package com.jaboz.at;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.TextView;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.TimeZone;

/**
 * WebView trang công ty và script nhập liệu trong assets.
 *
 * <p>Đóng app = {@link #finishAndRemoveTask()}: rời activity và xóa task khỏi mục
 * gần đây. Không force-stop package, không ghi cờ khóa giờ, không hẹn giờ nền.
 * Process chết khi reboot nên không còn gì để đóng; lần mở sau là phiên mới.
 * Handler trên activity đang sống kiểm tra lại tường đồng hồ (tối đa 15 giây)
 * để đổi giờ máy và ngày hôm sau vẫn ăn mốc, cùng kiểu với watcher 15 giây của
 * script trên trang.
 */
public class MainActivity extends Activity {
    private EditText address;
    private WebView webView;
    private TextView offline;
    private String snippet = "";
    private boolean injecting;
    private boolean closing;
    private final Handler clock = new Handler(Looper.getMainLooper());
    private final CloseSchedule.Session session = new CloseSchedule.Session(System.currentTimeMillis());
    private final Runnable closeCheck = new Runnable() {
        @Override
        public void run() {
            onCloseTick();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        webView = findViewById(R.id.web);
        offline = findViewById(R.id.offline);
        address = findViewById(R.id.address);
        ImageButton reload = findViewById(R.id.reload);
        address.setText(CompanyChrome.COMPANY_URL);
        address.setOnEditorActionListener(new TextView.OnEditorActionListener() {
            @Override
            public boolean onEditorAction(TextView view, int actionId, KeyEvent event) {
                boolean go = actionId == EditorInfo.IME_ACTION_GO
                        || actionId == EditorInfo.IME_ACTION_DONE
                        || (event != null
                        && event.getKeyCode() == KeyEvent.KEYCODE_ENTER
                        && event.getAction() == KeyEvent.ACTION_DOWN);
                if (!go) {
                    return false;
                }
                openAddress();
                return true;
            }
        });
        reload.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                resetToIdScreen();
            }
        });
        getWindow().setStatusBarColor(Color.parseColor("#DEE1E6"));
        getWindow().setNavigationBarColor(Color.WHITE);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
        snippet = readAsset("auto-tool-snippet.js");

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        webView.setBackgroundColor(Color.WHITE);
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.setSaveEnabled(false);
        webView.setWebViewClient(new Client());
        webView.setWebChromeClient(new Chrome());
        webView.loadUrl(CompanyChrome.COMPANY_URL);
        armCloseCheck();
    }

    @Override
    protected void onResume() {
        super.onResume();
        ensureCompanyPage();
        armCloseCheck();
    }

    @Override
    protected void onDestroy() {
        clock.removeCallbacks(closeCheck);
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (address != null && address.isFocused()) {
            address.clearFocus();
            hideKeyboard();
            return;
        }
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }

    private void armCloseCheck() {
        clock.removeCallbacks(closeCheck);
        clock.post(closeCheck);
    }

    private void onCloseTick() {
        if (closing || isFinishing()) {
            return;
        }
        CloseSchedule.Decision decision = session.tick(System.currentTimeMillis(), TimeZone.getDefault());
        if (decision.kind != CloseSchedule.Kind.NONE) {
            session.markFired(decision);
            closeApp(decision.kind);
            return;
        }
        long delay = decision.delayMs < 1L ? 1L : decision.delayMs;
        clock.removeCallbacks(closeCheck);
        clock.postDelayed(closeCheck, delay);
    }

    /** Đóng phiên này. Chrome chỉ được gọi cho mốc 16:45 (kể cả khi nhiều mốc đã trễ cùng lúc). */
    private void closeApp(CloseSchedule.Kind kind) {
        if (closing) {
            return;
        }
        closing = true;
        clock.removeCallbacks(closeCheck);
        if (kind == CloseSchedule.Kind.CLOSE_AND_SHOW_SITE) {
            showCompanyPageOutside();
        }
        finishAndRemoveTask();
    }

    private void showCompanyPageOutside() {
        CompanyChrome.Spec spec = CompanyChrome.viewSpec(getPackageName());
        try {
            startActivity(viewIntent(spec, true));
        } catch (ActivityNotFoundException missingChrome) {
            try {
                startActivity(viewIntent(spec, false));
            } catch (RuntimeException ignored) {
                // Không có trình duyệt xử lý được URL. Vẫn đóng app.
            }
        } catch (RuntimeException ignored) {
            // Intent bị từ chối. Vẫn đóng app.
        }
    }

    private static Intent viewIntent(CompanyChrome.Spec spec, boolean limitToChrome) {
        Intent intent = new Intent(spec.action, Uri.parse(spec.url));
        if (limitToChrome) {
            intent.setPackage(spec.targetPackage);
        }
        intent.addFlags(spec.flags);
        intent.putExtra(CompanyChrome.EXTRA_APPLICATION_ID, spec.applicationId);
        intent.putExtra(CompanyChrome.EXTRA_CREATE_NEW_TAB, spec.createNewTab);
        return intent;
    }

    private void ensureCompanyPage() {
        if (webView == null || closing) {
            return;
        }
        if (address != null && address.isFocused()) {
            return;
        }
        if (!isCompanyUrl(webView.getUrl())) {
            webView.loadUrl(CompanyChrome.COMPANY_URL);
            if (address != null) {
                address.setText(CompanyChrome.COMPANY_URL);
            }
            return;
        }
        webView.evaluateJavascript(
                "(function(){if(document.readyState!=='complete')return 'wait';return document.getElementById('workerId')?'ok':'half';})()",
                value -> {
                    if (closing || (address != null && address.isFocused())) {
                        return;
                    }
                    if (value != null && value.contains("half")) {
                        webView.loadUrl(CompanyChrome.COMPANY_URL);
                    }
                });
    }

    private void injectAuto() {
        if (injecting || snippet == null || snippet.isEmpty() || webView == null) {
            return;
        }
        injecting = true;
        String script = "(function(){if(window.__AT_LOADED)return 'have';window.__AT_LOADED=true;window.__AT_SKIP_MACHINE=true;try{localStorage.removeItem('autoWorker141BookmarkClick');localStorage.removeItem('autoWorker141TestUntil');}catch(e){}"
                + snippet
                + "return 'in';})()";
        webView.evaluateJavascript(script, value -> injecting = false);
    }

    private void resetToIdScreen() {
        if (address != null) {
            address.clearFocus();
            address.setText(CompanyChrome.COMPANY_URL);
        }
        hideKeyboard();
        if (offline != null) {
            offline.setVisibility(View.GONE);
        }
        if (webView == null) {
            return;
        }
        webView.evaluateJavascript(
                "try{['autoWorker141Enabled','autoWorker141SessionActive','autoWorker141BookmarkClick','autoWorker141ManualPause','autoWorker141Dismissed'].forEach(function(k){localStorage.removeItem(k);});}catch(e){}",
                value -> webView.loadUrl(CompanyChrome.COMPANY_URL));
    }

    private void openAddress() {
        String raw = address.getText() == null ? "" : address.getText().toString();
        String url = normalizeUrl(raw);
        address.setText(url);
        address.clearFocus();
        hideKeyboard();
        offline.setVisibility(View.GONE);
        webView.loadUrl(url);
    }

    private String normalizeUrl(String raw) {
        String url = raw == null ? "" : raw.trim();
        if (url.isEmpty()) {
            return CompanyChrome.COMPANY_URL;
        }
        if (!url.contains("://")) {
            url = "http://" + url;
        }
        return url;
    }

    private static boolean isCompanyUrl(String url) {
        return url != null && url.contains("192.168.10.27");
    }

    private void hideKeyboard() {
        if (address == null) {
            return;
        }
        InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
        if (imm != null) {
            imm.hideSoftInputFromWindow(address.getWindowToken(), 0);
        }
    }

    private String readAsset(String name) {
        try (InputStream in = getAssets().open(name);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buf = new byte[4096];
            int n;
            while ((n = in.read(buf)) >= 0) {
                out.write(buf, 0, n);
            }
            return out.toString(StandardCharsets.UTF_8.name());
        } catch (Exception ignored) {
            return "";
        }
    }

    private final class Client extends WebViewClient {
        @Override
        public void onPageFinished(WebView view, String url) {
            if (url != null && (address == null || !address.isFocused())) {
                address.setText(url);
            }
            if (address == null || !address.isFocused()) {
                view.requestFocus();
            }
            if (url != null && url.contains("192.168.10.27")) {
                view.evaluateJavascript(
                        "document.getElementById('workerId')?'ok':''",
                        value -> {
                            boolean ready = value != null && value.contains("ok");
                            offline.setVisibility(ready ? View.GONE : View.VISIBLE);
                            if (ready) {
                                injectAuto();
                            }
                        });
            }
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request != null && request.isForMainFrame()) {
                offline.setVisibility(View.VISIBLE);
            }
        }
    }

    private final class Chrome extends WebChromeClient {
        @Override
        public void onReceivedTitle(WebView view, String title) {
            if (title != null && !title.isEmpty()) {
                setTitle(title);
                setTaskDescription(new ActivityManager.TaskDescription(title));
            }
        }
    }
}

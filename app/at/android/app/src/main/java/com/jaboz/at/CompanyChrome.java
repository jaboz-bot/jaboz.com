package com.jaboz.at;

/**
 * Cách AT yêu cầu Chrome đưa trang công ty lên trước khi đóng lúc 16:45.
 *
 * <p>URL lấy từ app hiện tại ({@code http://192.168.10.27:5009}), không bịa host khác.
 *
 * <p>Android không có API liệt kê tab của Chrome. Hợp đồng công khai
 * {@code Browser.EXTRA_APPLICATION_ID} ({@code com.android.browser.application_id})
 * nói trình duyệt sẽ cố dùng lại cửa sổ đã mở với cùng định danh.
 * {@code Browser.EXTRA_CREATE_NEW_TAB} ({@code create_new_tab}) nếu true thì bỏ qua
 * việc dùng lại và luôn mở tab mới — AT đặt false.
 *
 * <p>Nguồn Chromium hiện tại ({@code IntentHandler.getTabOpenType}): với app id của
 * app khác Chrome và create_new_tab không true, kết quả là
 * {@code REUSE_APP_ID_MATCHING_TAB_ELSE_NEW_TAB} — dùng lại tab đã gắn với app id
 * này, chưa có thì mở một tab. Không đặt extra
 * {@code REUSE_URL_MATCHING_TAB_ELSE_NEW_TAB} vì nhánh đó trả về trước và sẽ mở tab
 * mới khi URL không khớp từng ký tự (trang công ty thường đã đổi path).
 *
 * <p>Việc dùng lại tab phụ thuộc bản Chrome trên máy. Môi trường build này không
 * chạy Chrome nên không chứng minh được tab không bị trùng trên điện thoại công ty.
 * Nếu không cài {@code com.android.chrome}, activity bỏ package và để trình duyệt
 * mặc định xử lý; trình duyệt đó có thể bỏ qua extra và mở tab mới.
 * Không dùng {@code FLAG_ACTIVITY_CLEAR_TOP}: cờ đó có thể tạo lại task trình duyệt
 * thay vì đưa task Chrome đang mở lên trước.
 */
public final class CompanyChrome {
    public static final String COMPANY_URL = "http://192.168.10.27:5009";
    public static final String CHROME_PACKAGE = "com.android.chrome";
    public static final String EXTRA_APPLICATION_ID = "com.android.browser.application_id";
    public static final String EXTRA_CREATE_NEW_TAB = "create_new_tab";
    /** {@code Intent.FLAG_ACTIVITY_NEW_TASK}. */
    public static final int FLAG_ACTIVITY_NEW_TASK = 0x10000000;
    public static final String ACTION_VIEW = "android.intent.action.VIEW";

    public static final class Spec {
        public final String action;
        public final String url;
        public final String targetPackage;
        public final int flags;
        public final String applicationId;
        public final boolean createNewTab;

        public Spec(
                String action,
                String url,
                String targetPackage,
                int flags,
                String applicationId,
                boolean createNewTab) {
            this.action = action;
            this.url = url;
            this.targetPackage = targetPackage;
            this.flags = flags;
            this.applicationId = applicationId;
            this.createNewTab = createNewTab;
        }
    }

    public static Spec viewSpec(String applicationId) {
        return new Spec(
                ACTION_VIEW,
                COMPANY_URL,
                CHROME_PACKAGE,
                FLAG_ACTIVITY_NEW_TASK,
                applicationId,
                false);
    }

    private CompanyChrome() {}
}

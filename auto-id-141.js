/* Auto ID Công nhân 141 — jaboz.com/auto-id-141.js */
window.AutoId141 = (function () {
  'use strict';

  const WORKER_ID = '141';
  const KEY = 'autoWorker141Enabled';

  let enabled = false;
  let cooldown = false;
  let running = false;
  let panelRoot = null;
  let statusEl = null;
  let toggleBtn = null;
  let homeToggleBtn = null;
  let tickInterval = null;
  let domObserver = null;
  let gm = null;

  function getWorkerInput() {
    return document.getElementById('workerId');
  }

  function getConfirmBtn() {
    return document.getElementById('confirmWorkerBtn');
  }

  function isStep1Visible() {
    const step1 = document.getElementById('step1');
    if (!step1) return false;
    return window.getComputedStyle(step1).display !== 'none';
  }

  function isWorkerIdEmpty() {
    const input = getWorkerInput();
    return input ? input.value.trim() === '' : false;
  }

  function isTargetPage() {
    return !!(getWorkerInput() && getConfirmBtn());
  }

  function readEnabled() {
    if (gm) return !!gm.getValue(KEY, false);
    return localStorage.getItem(KEY) === 'true';
  }

  function writeEnabled(value) {
    enabled = !!value;
    if (gm) gm.setValue(KEY, enabled);
    try { localStorage.setItem(KEY, String(enabled)); } catch (_) {}
    window.dispatchEvent(new CustomEvent('auto-id-141-sync', { detail: enabled }));
  }

  function syncEnabled() {
    enabled = readEnabled();
  }

  function setStatus(text) {
    if (!statusEl) return;
    statusEl.innerHTML = `<span class="dot ${enabled ? 'on' : 'off'}"></span>${text}`;
  }

  function updateHomeCardUI() {
    if (!homeToggleBtn) homeToggleBtn = document.getElementById('autoIdHomeToggle');
    if (!homeToggleBtn) return;
    homeToggleBtn.textContent = enabled ? 'TẮT' : 'BẬT';
    homeToggleBtn.dataset.on = enabled ? '1' : '0';
    const status = document.getElementById('autoIdHomeStatus');
    if (status) {
      status.textContent = enabled
        ? 'Đang bật — theo dõi mọi tab'
        : 'Đã tắt';
    }
  }

  function refreshUI() {
    if (toggleBtn) {
      toggleBtn.textContent = enabled ? 'TẮT' : 'BẬT';
      toggleBtn.dataset.on = enabled ? '1' : '0';
    }
    updateHomeCardUI();

    if (!toggleBtn) return;
    if (!enabled) setStatus('Đã tắt');
    else if (!isTargetPage()) setStatus('Chờ trang công ty...');
    else if (running) setStatus('Đang nhập 141...');
    else if (cooldown) setStatus('Chờ ô ID trống');
    else if (isStep1Visible() && isWorkerIdEmpty()) setStatus('Sẽ tự nhập');
    else setStatus('Đang theo dõi');
  }

  function updateCooldown() {
    if (cooldown && isStep1Visible() && isWorkerIdEmpty()) cooldown = false;
  }

  function autoFillAndConfirm() {
    const input = getWorkerInput();
    const btn = getConfirmBtn();
    if (!input || !btn || running) return;

    running = true;
    cooldown = true;
    setStatus('Đang nhập 141...');

    input.value = WORKER_ID;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    setTimeout(() => {
      btn.click();
      running = false;
      setStatus('Đã xác nhận — chờ RESET');
    }, 150);
  }

  function tick() {
    syncEnabled();
    if (!enabled) {
      removeFloatingPanel();
      refreshUI();
      return;
    }
    if (!panelRoot) createFloatingPanel();
    if (!isTargetPage()) {
      refreshUI();
      return;
    }
    updateCooldown();
    if (!cooldown && !running && isStep1Visible() && isWorkerIdEmpty()) {
      autoFillAndConfirm();
    }
    refreshUI();
  }

  function toggleEnabled() {
    writeEnabled(!enabled);
    if (!enabled) {
      cooldown = false;
      running = false;
      removeFloatingPanel();
    } else if (!panelRoot) {
      createFloatingPanel();
    }
    refreshUI();
  }

  function removeFloatingPanel() {
    if (panelRoot) panelRoot.remove();
    panelRoot = null;
    toggleBtn = null;
    statusEl = null;
  }

  function disableAll() {
    writeEnabled(false);
    cooldown = false;
    running = false;
    removeFloatingPanel();
    updateHomeCardUI();
  }

  function hidePanel() {
    disableAll();
  }

  function createFloatingPanel() {
    if (panelRoot || !enabled) return;

    const host = document.createElement('div');
    host.id = 'auto-worker-141-host';
    Object.assign(host.style, {
      position: 'fixed',
      right: '12px',
      bottom: '12px',
      zIndex: '2147483647',
      pointerEvents: 'none',
    });

    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .panel {
          width: 110px; padding: 10px;
          font-family: 'Segoe UI', Arial, sans-serif;
          background: #1a202c; border: 2px solid #4a5568;
          border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,.55);
          pointer-events: auto;
        }
        .toggle {
          width: 100%; border: none; border-radius: 6px;
          padding: 10px 0; font-size: 15px; font-weight: 700;
          color: #fff; cursor: pointer;
        }
        .toggle[data-on="0"] { background: #718096; }
        .toggle[data-on="1"] { background: #38a169; }
        .exit {
          width: 100%; margin-top: 12px; border: none; border-radius: 6px;
          padding: 7px 0; font-size: 12px; font-weight: 600;
          color: #e2e8f0; background: #4a5568; cursor: pointer;
        }
        .exit:hover { background: #e53e3e; color: #fff; }
        .status {
          margin-top: 8px; text-align: center;
          color: #cbd5e0; font-size: 10px; min-height: 22px;
        }
        .dot {
          display: inline-block; width: 8px; height: 8px;
          border-radius: 50%; margin-right: 4px; vertical-align: middle;
        }
        .dot.off { background: #718096; }
        .dot.on { background: #48bb78; }
      </style>
      <div class="panel">
        <button class="toggle" id="toggleBtn" type="button" data-on="0">BẬT</button>
        <button class="exit" id="exitBtn" type="button">Thoát</button>
        <div class="status" id="status"><span class="dot off"></span>Đã tắt</div>
      </div>
    `;

    (document.body || document.documentElement).appendChild(host);
    toggleBtn = shadow.getElementById('toggleBtn');
    statusEl = shadow.getElementById('status');
    toggleBtn.addEventListener('click', toggleEnabled);
    shadow.getElementById('exitBtn').addEventListener('click', hidePanel);
    panelRoot = host;
    refreshUI();
  }

  function startObservers() {
    if (tickInterval) return;
    tickInterval = setInterval(tick, 400);
    const root = document.body || document.documentElement;
    if (!root) return;
    domObserver = new MutationObserver(tick);
    domObserver.observe(root, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ['style', 'value'],
    });
  }

  function bindHomeCard() {
    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'autoIdHomeToggle') {
        e.preventDefault();
        toggleEnabled();
      }
    });
    updateHomeCardUI();
  }

  function listenExternalChanges() {
    window.addEventListener('auto-id-141-sync', (e) => {
      enabled = !!e.detail;
      if (enabled && !panelRoot) createFloatingPanel();
      if (!enabled) removeFloatingPanel();
      refreshUI();
    });
    window.addEventListener('storage', (e) => {
      if (e.key === KEY) tick();
    });
    if (gm && gm.addValueChangeListener) {
      gm.addValueChangeListener(KEY, (_n, _o, val) => {
        enabled = !!val;
        if (enabled && !panelRoot) createFloatingPanel();
        if (!enabled) removeFloatingPanel();
        refreshUI();
      });
    }
  }

  function boot(options) {
    if (options && options.gm) gm = options.gm;
    syncEnabled();
    bindHomeCard();
    listenExternalChanges();
    startObservers();
    tick();
    updateHomeCardUI();
  }

  return { boot, WORKER_ID, KEY };
})();

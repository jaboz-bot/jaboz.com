(function () {
  'use strict';

  const WORKER_ID = '141';
  const STORAGE_KEY = 'autoWorker141Enabled';
  const DISMISS_KEY = 'autoWorker141Dismissed';
  const BOOKMARK_FLAG_KEY = 'autoWorker141BookmarkClick';
  const SESSION_KEY = 'autoWorker141SessionActive';
  const SRC_KEY = 'autoWorker141Src';
  const MANUAL_PAUSE_KEY = 'autoWorker141ManualPause';
  const CONTROLS_STOPPED_KEY = 'autoWorker141ControlsStopped';
  const PLAY_POS_KEY = 'autoWorker141PlayPos';
  const LKC_POS_KEY = 'autoWorker141LkcPos';
  const TEST_UNTIL_KEY = 'autoWorker141TestUntil';
  const FORCE_ENABLE_ON_LOAD = false; // build-paste.js: bookmark=true, lưu F5=false
  const PC_MACHINE_NAME = 'SKY3';
  const PC_MACHINE_PASSWORD = '0918';

  const PAUSE_HOUR_MORNING = 8;
  const PAUSE_HOUR_LUNCH = 12;
  const RESET_HOUR = 16;
  const RESET_MIN = 55;

  const POLL_MS = 25;
  const POLL_MAX = 240;
  const TICK_MS = 120;
  const HASH_LAUNCH = '#aw141';
  const COMPANY_URL = 'http://192.168.10.27:5009';
  const PROXY_BRIDGE_PORT = '8765';

  function dateKey(d) {
    return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
  }

  function minutesOfDay(d) {
    const t = d || new Date();
    return t.getHours() * 60 + t.getMinutes();
  }

  function isLunchTime(now) {
    const cur = minutesOfDay(now);
    return cur >= PAUSE_HOUR_LUNCH * 60 && cur < 13 * 60;
  }

  function isBeforeWorkTime(now) {
    return minutesOfDay(now) < PAUSE_HOUR_MORNING * 60;
  }

  function shiftResetMinutes() {
    return RESET_HOUR * 60 + RESET_MIN;
  }

  function isSessionActive() {
    return localStorage.getItem(SESSION_KEY) === '1';
  }

  function isTestMode() {
    const until = Number(localStorage.getItem(TEST_UNTIL_KEY) || 0);
    if (until > Date.now()) return true;
    if (until) localStorage.removeItem(TEST_UNTIL_KEY);
    return false;
  }

  function isOnProxyBridge() {
    try {
      const port = String(location.port || '');
      if (port === PROXY_BRIDGE_PORT) return true;
      if (String(location.host || '').endsWith(':' + PROXY_BRIDGE_PORT)) return true;
    } catch (e) { /* bỏ qua */ }
    return false;
  }

  function isDemoHost() {
    return /localhost|127\.0\.0\.1/i.test(location.hostname);
  }

  function enableDemoFetchMock() {
    if (!isDemoHost()) return;
    const origFetch = window.fetch;
    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      if (url.includes('verify_worker')) {
        let workerName = '황콤엉장';
        try {
          if (init && init.body) {
            const body = JSON.parse(init.body);
            const id = body.workerId || WORKER_ID;
            const raw = String(parseInt(id, 10)).padStart(3, '0');
            if (typeof WORKERS !== 'undefined') {
              workerName = WORKERS[id] || WORKERS[raw] || WORKERS[WORKER_ID] || workerName;
            }
          }
        } catch (e) { /* giữ tên mặc định */ }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ workerName }),
        });
      }
      if (url.includes('/api/equip_check/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, completed: false, is_monday: false }),
        });
      }
      if (url.includes('/api/equip_check/save')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true }),
        });
      }
      return origFetch.apply(this, arguments);
    };
  }
  enableDemoFetchMock();

  const INSTALL_NAME_PREFIX = 'AW141I:';

  function applyInstallFromWindowName() {
    if (!window.name || window.name.indexOf(INSTALL_NAME_PREFIX) !== 0) return false;
    try {
      const s = decodeURIComponent(escape(atob(window.name.slice(INSTALL_NAME_PREFIX.length))));
      window.name = '';
      localStorage.setItem(SRC_KEY, s);
      return true;
    } catch (e) {
      window.name = '';
      return false;
    }
  }

  const installedFromWindowName = applyInstallFromWindowName();

  function applyHashLaunch() {
    if (location.hash !== HASH_LAUNCH) return false;
    try {
      history.replaceState(null, '', location.pathname + location.search);
    } catch (e) {
      location.hash = '';
    }
    return true;
  }

  const hashLaunch = applyHashLaunch();

  const bookmarkLaunch = localStorage.getItem(BOOKMARK_FLAG_KEY) === '1'
    || installedFromWindowName || hashLaunch;
  if (bookmarkLaunch) {
    localStorage.removeItem(BOOKMARK_FLAG_KEY);
    localStorage.setItem(SESSION_KEY, '1');
    localStorage.setItem(STORAGE_KEY, 'true');
    localStorage.removeItem(DISMISS_KEY);
    localStorage.removeItem(MANUAL_PAUSE_KEY);
    localStorage.removeItem(CONTROLS_STOPPED_KEY);
    const nowMin = minutesOfDay(new Date());
    const evtDay = 'autoWorker141Evt_' + dateKey(new Date()) + '_';
    if (nowMin === PAUSE_HOUR_MORNING * 60) {
      localStorage.setItem(evtDay + 'pause8', '1');
    }
    if (nowMin >= shiftResetMinutes()) {
      localStorage.setItem(evtDay + 'reset1655', '1');
    }
  }

  let enabled = bookmarkLaunch || FORCE_ENABLE_ON_LOAD;
  if (FORCE_ENABLE_ON_LOAD) {
    localStorage.setItem(SESSION_KEY, '1');
    localStorage.setItem(STORAGE_KEY, 'true');
    localStorage.removeItem(DISMISS_KEY);
  }

  let cooldown = false;
  let running = false;
  let autoFlowBusy = false;
  let pendingSave = false;
  let recutHolding = false;
  let cutLengthConfirmTimer = null;
  let cutCountdownInterval = null;
  let savingInProgress = false;
  let tickInterval = null;
  let domObserver = null;
  let scheduleTimer = null;
  let reloadPending = false;
  let postSaveStep1Wait = false;
  let saveInvokeLock = false;
  let lastCutLenPickAt = 0;
  let lkcNoticeKey = '';
  let lkcNoticeShownKey = '';
  let lkcDismissed = false;
  let machineSetupBusy = false;

  function getWorkerInput() { return document.getElementById('workerId'); }
  function getConfirmBtn() { return document.getElementById('confirmWorkerBtn'); }

  function isModalVisible(el) {
    if (!el) return false;
    const s = getComputedStyle(el);
    return s.display === 'flex' || s.display === 'block';
  }

  function isLoadingVisible() {
    const loading = document.getElementById('loadingOverlay');
    return !!(loading && isModalVisible(loading));
  }

  function waitFor(condition, cb, tries) {
    if (condition()) {
      cb();
      return;
    }
    if ((tries || 0) >= POLL_MAX) {
      cb();
      return;
    }
    setTimeout(() => waitFor(condition, cb, (tries || 0) + 1), POLL_MS);
  }

  function waitForFast(condition, cb, tries) {
    if (condition()) {
      cb();
      return;
    }
    if ((tries || 0) >= 80) {
      cb();
      return;
    }
    requestAnimationFrame(() => waitForFast(condition, cb, (tries || 0) + 1));
  }

  function humanMs(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function humanWait(cb, min, max) {
    setTimeout(cb, humanMs(min, max));
  }

  function waitForLoadingDone(cb) {
    waitFor(() => !isLoadingVisible(), () => {
      humanWait(cb, 70, 160);
    });
  }

  function waitForLoadingDoneAfterSave(cb) {
    waitFor(() => !isLoadingVisible(), () => {
      humanWait(cb, 110, 240);
    });
  }

  function waitForInputFilled(input, value, cb) {
    const want = String(value).trim();
    waitForFast(() => input && input.value.trim() === want, cb);
  }

  function isStep1Visible() {
    const step1 = document.getElementById('step1');
    if (!step1) return false;
    if (step1.offsetParent === null && getComputedStyle(step1).display === 'none') return false;
    return getComputedStyle(step1).display !== 'none';
  }

  function isWorkerIdEmpty() {
    const input = getWorkerInput();
    return input ? input.value.trim() === '' : false;
  }

  function isWorkerIdValue(value) {
    const input = getWorkerInput();
    return input ? input.value.trim() === String(value).trim() : false;
  }

  function isStep1Ready() {
    if (!isStep1Visible()) return false;
    const loading = document.getElementById('loadingOverlay');
    if (loading && isModalVisible(loading)) return false;
    const input = getWorkerInput();
    const btn = getConfirmBtn();
    if (!input || !btn) return false;
    if (input.disabled || btn.disabled) return false;
    return true;
  }

  function waitForStep1Ready(cb) {
    waitFor(isStep1Ready, cb);
  }

  function waitForInputValue(value, cb) {
    waitForFast(() => isWorkerIdValue(value), cb);
  }

  function isTargetPage() {
    return !!(getWorkerInput() && getConfirmBtn());
  }

  function canAutoRun() {
    if (!enabled || !isSessionActive()) return false;
    if (localStorage.getItem(MANUAL_PAUSE_KEY) === '1') return false;
    if (!isTestMode() && (isBeforeWorkTime() || isLunchTime())) return false;
    return true;
  }

  function setInputValue(input, value) {
    input.focus();
    const proto = HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc && desc.set) desc.set.call(input, value);
    else input.value = value;
    try {
      input.dispatchEvent(new InputEvent('input', { bubbles: true, data: value, inputType: 'insertText' }));
    } catch (e) {
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function typeLikePerson(input, value, done) {
    const text = String(value);
    let i = 0;
    function step() {
      if (!canAutoRun()) return;
      if (!input || input.isConnected === false) {
        done();
        return;
      }
      input.focus();
      setInputValue(input, text.slice(0, i + 1));
      i += 1;
      if (i >= text.length) {
        humanWait(done, 45, 110);
        return;
      }
      setTimeout(step, humanMs(32, 70));
    }
    humanWait(step, 40, 100);
  }

  function fireClick(el) {
    if (!el || el.disabled) return;
    if (typeof el.click === 'function') el.click();
    else {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    }
  }

  function clickConfirm(btn, input) {
    if (!btn || btn.disabled) return;
    fireClick(btn);
  }

  function invokeSaveOnce() {
    if (saveInvokeLock || savingInProgress || isLoadingVisible()) return false;
    if (!isSaveReady()) return false;

    saveInvokeLock = true;
    savingInProgress = true;
    pendingSave = false;
    autoFlowBusy = true;

    if (typeof window.saveData === 'function') {
      window.saveData();
    } else {
      const shapeBtn = document.getElementById('shapeBtn');
      if (!shapeBtn) {
        saveInvokeLock = false;
        savingInProgress = false;
        autoFlowBusy = false;
        pendingSave = true;
        return false;
      }
      fireClick(shapeBtn);
    }
    return true;
  }

  function reloadPage() {
    if (reloadPending) return;
    reloadPending = true;
    location.reload();
  }

  function stopAll() {
    enabled = false;
    hideLkcNotice();
    ['autoToolBridgeControl', 'autoToolBridgeStop'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
    if (tickInterval) clearInterval(tickInterval);
    if (domObserver) domObserver.disconnect();
    if (scheduleTimer) clearInterval(scheduleTimer);
    tickInterval = null;
    domObserver = null;
    scheduleTimer = null;
    window.__autoToolRunning = false;
  }

  function pauseSessionWithReload() {
    stopAll();
    localStorage.removeItem(SESSION_KEY);
    localStorage.setItem(STORAGE_KEY, 'false');
    reloadPage();
  }

  function scheduleEventKey(id) {
    return 'autoWorker141Evt_' + dateKey(new Date()) + '_' + id;
  }

  function markScheduleEvent(id) {
    localStorage.setItem(scheduleEventKey(id), '1');
  }

  function wasScheduleEvent(id) {
    return localStorage.getItem(scheduleEventKey(id)) === '1';
  }

  function checkScheduledEvents() {
    if (!isSessionActive() || reloadPending) return;
    if (isTestMode()) return;

    const now = new Date();
    const slot = minutesOfDay(now);

    if (slot === PAUSE_HOUR_MORNING * 60 && !wasScheduleEvent('pause8')) {
      markScheduleEvent('pause8');
      pauseSessionWithReload();
      return;
    }
    if (isLunchTime(now) && !wasScheduleEvent('pause12')) {
      markScheduleEvent('pause12');
      triggerWorkspaceReset();
      return;
    }
    if (slot >= shiftResetMinutes() && !wasScheduleEvent('reset1655')) {
      markScheduleEvent('reset1655');
      pauseSessionWithReload();
    }
  }

  function parseRawMaterialName() {
    const sources = [
      document.getElementById('pickupInfo'),
      document.getElementById('qrResult'),
    ];
    for (let i = 0; i < sources.length; i++) {
      const el = sources[i];
      if (!el) continue;
      const text = el.innerText || el.textContent || '';
      const m = text.match(/원재료:\s*(\S+)/);
      if (m) return m[1].trim();
    }
    return null;
  }

  function getScanTextBlob() {
    const parts = [];
    const qr = document.getElementById('qrResult');
    if (qr) parts.push(qr.innerText || qr.textContent || '');
    const pickup = document.getElementById('pickupInfo');
    if (pickup) parts.push(pickup.innerText || pickup.textContent || '');
    const qrInput = document.getElementById('qrcode');
    if (qrInput && qrInput.value) parts.push(qrInput.value);
    try {
      const data = window.lastData;
      if (data) {
        if (data.model) parts.push(String(data.model));
        if (data.rawMaterial) parts.push(String(data.rawMaterial));
        if (data.globalNo) parts.push(String(data.globalNo));
      }
    } catch (e) { /* bỏ qua */ }
    return parts.join('\n');
  }

  function scanHasLkc(text) {
    return /(?:^|[\s\-_/])LKC(?:[\s\-_/]|$)/i.test(String(text || ''));
  }

  function readSavedPos(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (typeof p.x !== 'number' || typeof p.y !== 'number') return null;
      return p;
    } catch (e) {
      return null;
    }
  }

  function writeSavedPos(key, x, y) {
    try {
      localStorage.setItem(key, JSON.stringify({ x: Math.round(x), y: Math.round(y) }));
    } catch (e) { /* bỏ qua */ }
  }

  function clampFixed(el, x, y) {
    const w = el.offsetWidth || 36;
    const h = el.offsetHeight || 36;
    const maxX = Math.max(0, window.innerWidth - w);
    const maxY = Math.max(0, window.innerHeight - h);
    return {
      x: Math.min(maxX, Math.max(0, x)),
      y: Math.min(maxY, Math.max(0, y)),
    };
  }

  function applyFixedPos(el, x, y) {
    const p = clampFixed(el, x, y);
    el.style.left = p.x + 'px';
    el.style.top = p.y + 'px';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.transform = 'none';
    return p;
  }

  function isNoDragTarget(node) {
    let n = node;
    while (n && n !== document.body) {
      if (n.getAttribute && n.getAttribute('data-at-no-drag') != null) return true;
      n = n.parentElement;
    }
    return false;
  }

  function installDrag(el, key, onTap) {
    if (!el || el.__atDrag) return;
    el.__atDrag = true;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let origX = 0;
    let origY = 0;
    let moved = false;

    el.addEventListener('pointerdown', (e) => {
      if (isNoDragTarget(e.target)) return;
      pointerId = e.pointerId;
      moved = false;
      el.__atDragging = true;
      const r = el.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      origX = r.left;
      origY = r.top;
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* bỏ qua */ }
      try { e.preventDefault(); } catch (err) { /* bỏ qua */ }
    });

    el.addEventListener('pointermove', (e) => {
      if (pointerId !== e.pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      if (!moved) return;
      applyFixedPos(el, origX + dx, origY + dy);
    });

    function end(e) {
      if (pointerId !== e.pointerId) return;
      pointerId = null;
      el.__atDragging = false;
      if (moved) {
        const r = el.getBoundingClientRect();
        writeSavedPos(key, r.left, r.top);
        return;
      }
      if (onTap) onTap(e);
    }

    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', (e) => {
      if (pointerId !== e.pointerId) return;
      pointerId = null;
      el.__atDragging = false;
    });
  }

  function noteFreshScan() {
    lkcDismissed = false;
    lkcNoticeKey = '';
    lkcNoticeShownKey = '';
  }

  function watchScanSource(el) {
    if (!el || el.__atScanWatch) return;
    el.__atScanWatch = true;
    try {
      const obs = new MutationObserver(noteFreshScan);
      obs.observe(el, { childList: true, subtree: true, characterData: true });
    } catch (e) { /* trang không cho theo dõi */ }
    el.addEventListener('input', noteFreshScan);
  }

  function armScanWatch() {
    watchScanSource(document.getElementById('qrResult'));
    watchScanSource(document.getElementById('qrcode'));
  }

  function hideLkcNotice() {
    const el = document.getElementById('autoToolLkcNotice');
    if (el) el.remove();
    repositionCutCountdown();
  }

  function findRightPanel() {
    const langBtn = document.getElementById('langKoBtn') || document.getElementById('langViBtn');
    if (langBtn) {
      const group = langBtn.closest('.group');
      if (group) return group;
    }
    const container = document.getElementById('container');
    if (container) {
      const groups = container.querySelectorAll(':scope > .group');
      if (groups.length >= 2) return groups[1];
      if (groups.length === 1) return groups[0];
    }
    return null;
  }

  function positionLkcNotice(el) {
    if (!el || el.__atDragging) return;
    const saved = readSavedPos(LKC_POS_KEY);
    if (saved) {
      applyFixedPos(el, saved.x, saved.y);
      repositionCutCountdown();
      return;
    }
    const panel = findRightPanel();
    const gap = 12;

    if (panel) {
      const r = panel.getBoundingClientRect();
      const w = Math.max(120, Math.round(r.width * 0.5));
      const h = Math.max(100, Math.round(r.height * 0.5));
      let left = Math.round(r.left + (r.width - w) / 2);
      let top = Math.round(r.top + (r.height - h) / 2);
      if (left < gap) left = gap;
      if (top < gap) top = gap;
      if (left + w > window.innerWidth - gap) left = Math.max(gap, window.innerWidth - w - gap);
      if (top + h > window.innerHeight - gap) top = Math.max(gap, window.innerHeight - h - gap);
      el.style.left = left + 'px';
      el.style.top = top + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      el.style.width = w + 'px';
      el.style.height = h + 'px';
      el.style.transform = 'none';
      repositionCutCountdown();
      return;
    }

    const vw = Math.min(420, window.innerWidth * 0.42);
    const w = Math.max(120, Math.round(vw * 0.5));
    const h = Math.max(100, Math.round(w * 0.85));
    el.style.left = 'auto';
    el.style.right = '8%';
    el.style.top = '50%';
    el.style.bottom = 'auto';
    el.style.width = w + 'px';
    el.style.height = h + 'px';
      el.style.transform = 'translateY(-50%)';
    repositionCutCountdown();
  }

  function showLkcNotice() {
    let el = document.getElementById('autoToolLkcNotice');
    if (!el) {
      el = document.createElement('div');
      el.id = 'autoToolLkcNotice';
      el.setAttribute('role', 'status');
      el.style.cssText = [
        'position:fixed',
        'z-index:2147483000',
        'box-sizing:border-box',
        'display:flex',
        'flex-direction:column',
        'align-items:center',
        'justify-content:center',
        'gap:6px',
        'padding:18px 16px 14px',
        'border-radius:16px',
        'background:#F7F4EE',
        'color:#3A342C',
        'border:1px solid #E4DCCE',
        'font:700 1.05rem/1.35 "Segoe UI",Tahoma,sans-serif',
        'text-align:center',
        'box-shadow:0 6px 16px rgba(0,0,0,.08)',
        'pointer-events:auto',
        'touch-action:none',
        'user-select:none',
        'letter-spacing:.02em',
      ].join(';');
      document.body.appendChild(el);
      installDrag(el, LKC_POS_KEY, null);
    }
    el.innerHTML = '<button type="button" data-at-no-drag id="autoToolLkcClose" style="position:absolute;top:4px;right:6px;width:22px;height:22px;padding:0;border:0;background:transparent;color:#6A645C;font:600 15px/22px sans-serif;cursor:pointer;">✕</button>'
      + '<div style="font-size:1.2em;letter-spacing:.06em;color:#3A342C;">LKC</div>'
      + '<div style="font-weight:700;font-size:1.02em;color:#3A342C;">cắt thêm 1–2 thanh</div>'
      + '<div style="font-weight:600;font-size:.82em;color:#4E4840;">dự phòng hỏng</div>';
    const closeBtn = el.querySelector ? el.querySelector('#autoToolLkcClose') : null;
    if (closeBtn && !closeBtn.__atBound) {
      closeBtn.__atBound = true;
      closeBtn.addEventListener('click', (e) => {
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        lkcDismissed = true;
        hideLkcNotice();
      });
    }
    positionLkcNotice(el);
    repositionCutCountdown();
  }

  function updateLkcNotice() {
    if (!enabled || !isSessionActive() || localStorage.getItem(MANUAL_PAUSE_KEY) === '1') {
      hideLkcNotice();
      return;
    }
    armScanWatch();
    const blob = getScanTextBlob();
    if (!blob.trim()) {
      lkcNoticeKey = '';
      hideLkcNotice();
      return;
    }
    if (!scanHasLkc(blob)) {
      lkcNoticeKey = '';
      lkcDismissed = false;
      hideLkcNotice();
      return;
    }
    if (lkcDismissed) {
      hideLkcNotice();
      return;
    }
    lkcNoticeKey = blob.slice(0, 220);
    if (lkcNoticeShownKey !== lkcNoticeKey || !document.getElementById('autoToolLkcNotice')) {
      lkcNoticeShownKey = lkcNoticeKey;
      showLkcNotice();
    } else {
      positionLkcNotice(document.getElementById('autoToolLkcNotice'));
    }
  }

  function diameterFromMaterialSuffix(name) {
    if (!name) return null;
    const m = String(name).trim().match(/(\d{1,2})$/);
    return m ? m[1] : null;
  }

  function getExpectedPickupDiameter() {
    try {
      const data = window.lastData;
      if (data && data.outerDiameter != null && String(data.outerDiameter).trim() !== '') {
        const n = parseFloat(data.outerDiameter);
        if (!isNaN(n)) return String(n);
      }
    } catch (e) { /* lấy từ tên nguyên liệu */ }
    return diameterFromMaterialSuffix(parseRawMaterialName());
  }

  function findCutLengthModal() {
    const ids = ['cutLenModal', 'cutLengthModal', 'lengthSelectModal', 'cuttingLenModal'];
    for (let i = 0; i < ids.length; i++) {
      const el = document.getElementById(ids[i]);
      if (el) return el;
    }
    const modals = document.querySelectorAll('.modal');
    for (let i = 0; i < modals.length; i++) {
      const t = modals[i].innerText || modals[i].textContent || '';
      if (t.includes('절단 길이 선택') || t.includes('절단길이를 선택') || t.includes('절단 길이를 선택')) {
        return modals[i];
      }
    }
    return null;
  }

  function isCutLengthOptionButton(btn) {
    if (!btn || btn.tagName !== 'BUTTON') return false;
    const txt = (btn.textContent || '').replace(/\s+/g, ' ').trim();
    if (!txt || txt === '확인' || txt === '취소' || txt === '입력' || txt === 'C') return false;
    if (btn.id && /confirm|cancel|close/i.test(btn.id)) return false;
    return /\+\d/.test(txt) || (/\d/.test(txt) && txt.includes('|'));
  }

  function clickCutLengthConfirm(modal) {
    const fns = ['cutLenConfirm', 'confirmCutLength', 'lengthSelectConfirm', 'cutLengthConfirm'];
    for (let i = 0; i < fns.length; i++) {
      const fn = window[fns[i]];
      if (typeof fn === 'function') {
        fn();
        return true;
      }
    }
    const byId = document.getElementById('cutLenConfirmBtn')
      || document.getElementById('cutLengthConfirmBtn')
      || document.getElementById('lengthSelectConfirmBtn');
    if (byId) {
      fireClick(byId);
      return true;
    }
    const btns = modal.querySelectorAll('button');
    for (let i = 0; i < btns.length; i++) {
      if ((btns[i].textContent || '').trim() === '확인') {
        fireClick(btns[i]);
        return true;
      }
    }
    return false;
  }

  function stopCutLengthWait() {
    if (cutLengthConfirmTimer) {
      clearTimeout(cutLengthConfirmTimer);
      cutLengthConfirmTimer = null;
    }
    if (cutCountdownInterval) {
      clearInterval(cutCountdownInterval);
      cutCountdownInterval = null;
    }
    const el = document.getElementById('autoToolCutCount');
    if (el) el.remove();
  }

  function rectsOverlap(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  function placeCutCountdown(el) {
    const w = 32;
    const h = 32;
    const gap = 8;
    let x = window.innerWidth - w - 12;
    let y = 64;
    const blocks = [];
    const lkc = document.getElementById('autoToolLkcNotice');
    const play = document.getElementById('autoToolPlayStop');
    if (lkc && lkc.getBoundingClientRect) blocks.push(lkc.getBoundingClientRect());
    if (play && play.getBoundingClientRect) blocks.push(play.getBoundingClientRect());
    for (let i = 0; i < blocks.length; i++) {
      const r = blocks[i];
      const box = { left: x, top: y, right: x + w, bottom: y + h };
      if (!rectsOverlap(box, r)) continue;
      const below = r.bottom + gap;
      const above = r.top - h - gap;
      if (below + h <= window.innerHeight - gap) y = below;
      else if (above >= gap) y = above;
      else x = Math.max(gap, r.left - w - gap);
    }
    applyFixedPos(el, x, y);
  }

  function showCutCountdown(seconds) {
    let el = document.getElementById('autoToolCutCount');
    if (!el) {
      el = document.createElement('div');
      el.id = 'autoToolCutCount';
      el.setAttribute('role', 'status');
      el.style.cssText = [
        'position:fixed',
        'z-index:2147482500',
        'width:32px',
        'height:32px',
        'box-sizing:border-box',
        'border-radius:16px',
        'background:rgba(247,244,238,.94)',
        'color:#6B6560',
        'border:1px solid rgba(228,220,206,.95)',
        'font:600 14px/30px sans-serif',
        'text-align:center',
        'pointer-events:none',
        'user-select:none',
      ].join(';');
      document.body.appendChild(el);
    }
    el.textContent = String(seconds);
    placeCutCountdown(el);
  }

  function repositionCutCountdown() {
    const el = document.getElementById('autoToolCutCount');
    if (el) placeCutCountdown(el);
  }

  function scheduleCutLengthConfirm() {
    stopCutLengthWait();
    let left = 3;
    showCutCountdown(left);
    cutCountdownInterval = setInterval(() => {
      left -= 1;
      if (left > 0) showCutCountdown(left);
    }, 1000);
    cutLengthConfirmTimer = setTimeout(() => {
      cutLengthConfirmTimer = null;
      stopCutLengthWait();
      if (!canAutoRun() || autoFlowBusy) return;
      autoFlowBusy = true;
      waitForLoadingDone(() => {
        const modal = findCutLengthModal();
        if (!modal || !isModalVisible(modal)) {
          autoFlowBusy = false;
          return;
        }
        clickCutLengthConfirm(modal);
        waitForSaveReady(() => {
          pendingSave = true;
          autoFlowBusy = false;
          tick();
        });
      });
    }, 3000);
  }

  function isSaveReady() {
    if (isModalVisible(document.getElementById('pickupConfirm'))) return false;
    const cutLenModal = findCutLengthModal();
    if (cutLenModal && isModalVisible(cutLenModal)) return false;
    const loading = document.getElementById('loadingOverlay');
    if (loading && isModalVisible(loading)) return false;
    const lenEl = document.querySelector('.cutting-len');
    if (!lenEl || !String(lenEl.textContent || '').trim()) return false;
    const qr = document.getElementById('qrResult');
    if (!qr || !String(qr.textContent || qr.innerText || '').trim()) return false;
    const step2 = document.getElementById('step2');
    if (!step2 || getComputedStyle(step2).display === 'none') return false;
    return true;
  }

  function waitForSaveReady(cb, tries) {
    if (isSaveReady()) {
      cb();
      return;
    }
    if ((tries || 0) >= POLL_MAX) {
      autoFlowBusy = false;
      cb();
      return;
    }
    setTimeout(() => waitForSaveReady(cb, (tries || 0) + 1), POLL_MS);
  }

  function waitForSaveComplete(cb) {
    let sawLoading = false;

    function poll(tries) {
      const loading = isLoadingVisible();
      if (loading) sawLoading = true;

      if (sawLoading && !loading) {
        humanWait(() => cb(isStep1Visible()), 110, 240);
        return;
      }
      if ((tries || 0) >= POLL_MAX) {
        humanWait(() => cb(isStep1Visible()), 110, 240);
        return;
      }
      setTimeout(() => poll((tries || 0) + 1), POLL_MS);
    }

    poll(0);
  }

  function installCutLengthHook() {
    if (window.__autoToolCutLenHook) return;
    window.__autoToolCutLenHook = true;
    function onCutLenPick(e) {
      if (!canAutoRun()) return;
      const modal = findCutLengthModal();
      if (!modal || !isModalVisible(modal)) return;
      const raw = e.target && e.target.nodeType === 1 ? e.target : (e.target && e.target.parentElement);
      const btn = raw && raw.closest ? raw.closest('button') : null;
      if (!btn || !modal.contains(btn) || !isCutLengthOptionButton(btn)) return;
      scheduleCutLengthConfirm();
    }
    document.addEventListener('click', onCutLenPick, true);
  }

  function afterPickupConfirmed() {
    waitForLoadingDone(() => {
      const cm = findCutLengthModal();
      if (cm && isModalVisible(cm)) {
        pendingSave = false;
      }
      autoFlowBusy = false;
      tick();
    });
  }

  function confirmPickupModal(modal) {
    const fn = window.pickupConfirm;
    if (typeof fn === 'function') fn();
    else {
      const btns = modal.querySelectorAll('button');
      for (let i = 0; i < btns.length; i++) {
        if (btns[i].textContent.trim() === '입력') {
          fireClick(btns[i]);
          break;
        }
      }
    }
  }

  function triggerWorkspaceReset() {
    ['recutModal', 'pickupConfirm', 'claimAlertModalBackdrop', 'qtyModal',
      'cutLenModal', 'cutLengthModal', 'lengthSelectModal', 'cuttingLenModal',
      'equipCheckModal'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    if (typeof doReset === 'function') doReset(true);
    else {
      const rb = document.getElementById('resetBtn');
      if (rb) fireClick(rb);
    }
  }

  function afterPageReset() {
    cooldown = false;
    running = false;
    autoFlowBusy = false;
    pendingSave = false;
    lkcNoticeKey = '';
    lkcNoticeShownKey = '';
    hideLkcNotice();
    recutHolding = false;
    stopCutLengthWait();
    if (canAutoRun()) {
      waitForLoadingDone(() => tick());
    }
  }

  function installReloadBoot() {
    if (window.__autoToolBoot) return;
    window.__autoToolBoot = true;

    function bootFromBookmarkRedirect() {
      if (localStorage.getItem(BOOKMARK_FLAG_KEY) !== '1') return;
      if (!document.getElementById('workerId')) return;
      if (window.__autoToolRunning) return;
      const src = localStorage.getItem(SRC_KEY);
      if (!src) return;
      try { (0, eval)(src); } catch (e) { /* bỏ qua */ }
    }

    window.addEventListener('pageshow', bootFromBookmarkRedirect);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootFromBookmarkRedirect, { once: true });
    } else {
      setTimeout(bootFromBookmarkRedirect, 0);
    }
  }

  function installPageHooks() {
    if (window.__autoToolHooked) return;
    window.__autoToolHooked = true;

    if (typeof window.doReset === 'function' && !window.doReset.__autoTool) {
      const orig = window.doReset;
      window.doReset = async function (...args) {
        await orig.apply(this, args);
        afterPageReset();
      };
      window.doReset.__autoTool = true;
    }

    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn && !resetBtn.__autoTool) {
      resetBtn.addEventListener('click', () => {
        setTimeout(afterPageReset, 120);
      });
      resetBtn.__autoTool = true;
    }

    installCutLengthHook();
    installRecutNoReset();
  }

  function installRecutNoReset() {
    if (window.__autoToolRecutNo) return;
    window.__autoToolRecutNo = true;
    document.addEventListener('click', (e) => {
      const modal = document.getElementById('recutModal');
      if (!modal || !isModalVisible(modal)) return;
      const raw = e.target && e.target.nodeType === 1 ? e.target : (e.target && e.target.parentElement);
      const btn = raw && raw.closest ? raw.closest('button') : null;
      if (!btn || !modal.contains(btn)) return;
      const txt = (btn.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (txt !== '아니오' && txt !== 'không' && txt !== 'khong' && txt !== 'no') return;
      e.preventDefault();
      e.stopPropagation();
      modal.style.display = 'none';
      triggerWorkspaceReset();
    }, true);
  }

  function autoHandleClaimModal() {
    const modal = document.getElementById('claimAlertModalBackdrop');
    if (!isModalVisible(modal) || isLoadingVisible()) return false;
    const btn = document.getElementById('claimAlertConfirmBtn');
    if (!btn) return false;
    if (autoFlowBusy) return true;
    autoFlowBusy = true;
    humanWait(() => {
      const m = document.getElementById('claimAlertModalBackdrop');
      const b = document.getElementById('claimAlertConfirmBtn');
      if (!isModalVisible(m) || !b) {
        autoFlowBusy = false;
        return;
      }
      fireClick(b);
      autoFlowBusy = false;
      humanWait(tick, 50, 120);
    }, 120, 240);
    return true;
  }

  function findEquipCheckModal() {
    const byId = document.getElementById('equipCheckModal');
    if (byId) return byId;
    const modals = document.querySelectorAll('.modal');
    for (let i = 0; i < modals.length; i++) {
      const t = modals[i].innerText || modals[i].textContent || '';
      if (t.includes('일일점검') && (t.includes('일괄 체크') || t.includes('점검 완료'))) {
        return modals[i];
      }
    }
    return null;
  }

  function findButtonByText(root, texts) {
    const btns = root.querySelectorAll('button');
    for (let i = 0; i < btns.length; i++) {
      const txt = (btns[i].textContent || '').replace(/\s+/g, ' ').trim();
      for (let j = 0; j < texts.length; j++) {
        if (txt.includes(texts[j])) return btns[i];
      }
    }
    return null;
  }

  function isPcMachineSelected() {
    try {
      if (window.lastData
          && String(window.lastData.machine || '').trim().toUpperCase() === PC_MACHINE_NAME) {
        return true;
      }
    } catch (e) { /* thử tiếp bằng nút hiển thị */ }
    const btn = document.getElementById('machineBtn');
    return !!(btn && String(btn.textContent || btn.innerText || '').trim().toUpperCase() === PC_MACHINE_NAME);
  }

  function finishPcMachineSetup() {
    machineSetupBusy = false;
    autoFlowBusy = false;
    cooldown = false;
    setTimeout(tick, 0);
  }

  function skipMachineSetup() {
    return window.__AT_SKIP_MACHINE === true;
  }

  function autoEnsurePcMachine() {
    // PC chọn SKY3. App Android và Tablet Bridge giữ nguyên máy đang dùng.
    if (skipMachineSetup() || isOnProxyBridge() || isPcMachineSelected()) return false;
    if (machineSetupBusy) return true;

    const machineBtn = document.getElementById('machineBtn');
    const modal = document.getElementById('machineModal');
    const input = document.getElementById('machineInput');
    const list = document.getElementById('machineList');
    if (!machineBtn || !modal || !input || !list) return false;

    machineSetupBusy = true;
    autoFlowBusy = true;
    if (!isModalVisible(modal)) fireClick(machineBtn);

    waitFor(() => isModalVisible(modal), () => {
      if (!isModalVisible(modal)) {
        finishPcMachineSetup();
        return;
      }

      typeLikePerson(input, PC_MACHINE_PASSWORD, () => {
        if (input.value.trim() !== PC_MACHINE_PASSWORD) {
          finishPcMachineSetup();
          return;
        }

        humanWait(() => {
          if (typeof window.machineConfirm === 'function') {
            window.machineConfirm();
          } else {
            const confirmBtn = findButtonByText(modal, ['입력']);
            if (confirmBtn) fireClick(confirmBtn);
          }

          waitFor(() => isModalVisible(list), () => {
            if (!isModalVisible(list)) {
              finishPcMachineSetup();
              return;
            }

            humanWait(() => {
              if (typeof window.chooseMachine === 'function') {
                window.chooseMachine(PC_MACHINE_NAME);
              } else {
                const skyBtn = findButtonByText(list, [PC_MACHINE_NAME]);
                if (skyBtn) fireClick(skyBtn);
              }

              waitFor(isPcMachineSelected, finishPcMachineSetup);
            }, 80, 160);
          });
        }, 70, 150);
      });
    });
    return true;
  }

  function clickEquipCheckAll(modal) {
    if (typeof window.equipCheckAllItems === 'function') {
      window.equipCheckAllItems();
      return true;
    }
    const btn = findButtonByText(modal, ['일괄 체크']);
    if (btn) {
      fireClick(btn);
      return true;
    }
    return false;
  }

  function clickEquipCheckComplete(modal) {
    const byId = document.getElementById('equipCheckSaveBtn');
    if (byId && !byId.disabled) {
      fireClick(byId);
      return true;
    }
    if (typeof window.saveEquipCheck === 'function') {
      const saveBtn = document.getElementById('equipCheckSaveBtn');
      if (saveBtn && saveBtn.disabled) return false;
      window.saveEquipCheck();
      return true;
    }
    const btn = findButtonByText(modal, ['점검 완료']);
    if (btn && !btn.disabled) {
      fireClick(btn);
      return true;
    }
    return false;
  }

  function isEquipCheckSaveReady(modal) {
    const byId = document.getElementById('equipCheckSaveBtn');
    if (byId) return !byId.disabled;
    const btn = findButtonByText(modal, ['점검 완료']);
    return !!(btn && !btn.disabled);
  }

  function autoHandleEquipCheckModal() {
    const modal = findEquipCheckModal();
    if (!modal || !isModalVisible(modal) || autoFlowBusy || isLoadingVisible()) return false;

    autoFlowBusy = true;

    waitForLoadingDone(() => {
      const m = findEquipCheckModal();
      if (!m || !isModalVisible(m)) {
        autoFlowBusy = false;
        return;
      }
      if (!clickEquipCheckAll(m)) {
        autoFlowBusy = false;
        return;
      }
      waitFor(() => {
        const m2 = findEquipCheckModal();
        return !!(m2 && isModalVisible(m2) && isEquipCheckSaveReady(m2));
      }, () => {
        const m3 = findEquipCheckModal();
        if (!m3 || !isModalVisible(m3) || !isEquipCheckSaveReady(m3)) {
          autoFlowBusy = false;
          return;
        }
        humanWait(() => {
          const mNow = findEquipCheckModal();
          if (!mNow || !isModalVisible(mNow) || !isEquipCheckSaveReady(mNow)) {
            autoFlowBusy = false;
            return;
          }
          if (!clickEquipCheckComplete(mNow)) {
            autoFlowBusy = false;
            return;
          }
        waitFor(() => {
          const m4 = findEquipCheckModal();
          return !m4 || !isModalVisible(m4);
        }, () => {
          autoFlowBusy = false;
          cooldown = false;
          waitForLoadingDone(() => tick());
        });
        }, 120, 240);
      });
    });

    return true;
  }

  function autoHandleRecutModal() {
    const modal = document.getElementById('recutModal');
    if (!isModalVisible(modal)) {
      if (recutHolding) {
        recutHolding = false;
        autoFlowBusy = false;
      }
      return false;
    }
    recutHolding = true;
    autoFlowBusy = true;
    pendingSave = false;
    return true;
  }

  function autoHandlePickupModal() {
    const modal = document.getElementById('pickupConfirm');
    if (!isModalVisible(modal) || autoFlowBusy || isLoadingVisible()) return false;

    const diameter = getExpectedPickupDiameter();
    if (!diameter) return false;

    const inp = document.getElementById('pickupInput');
    if (!inp) return false;

    const current = inp.value.trim();
    autoFlowBusy = true;

    if (current === diameter) {
      humanWait(() => {
        const modalNow = document.getElementById('pickupConfirm');
        if (!modalNow || !isModalVisible(modalNow)) {
          autoFlowBusy = false;
          return;
        }
        confirmPickupModal(modalNow);
        afterPickupConfirmed();
      }, 80, 160);
      return true;
    }

    typeLikePerson(inp, diameter, () => {
      const modalNow = document.getElementById('pickupConfirm');
      const inpNow = document.getElementById('pickupInput');
      if (!modalNow || !isModalVisible(modalNow) || !inpNow || inpNow.value.trim() !== diameter) {
        autoFlowBusy = false;
        return;
      }
      humanWait(() => {
        const modalLater = document.getElementById('pickupConfirm');
        const inpLater = document.getElementById('pickupInput');
        if (!modalLater || !isModalVisible(modalLater) || !inpLater || inpLater.value.trim() !== diameter) {
          autoFlowBusy = false;
          return;
        }
        confirmPickupModal(modalLater);
        afterPickupConfirmed();
      }, 70, 140);
    });
    return true;
  }

  function autoHandleSave() {
    if (!pendingSave || autoFlowBusy || savingInProgress || saveInvokeLock || isLoadingVisible()) {
      return false;
    }
    if (!isSaveReady()) return false;

    autoFlowBusy = true;
    humanWait(() => {
      if (!pendingSave || savingInProgress || saveInvokeLock || isLoadingVisible() || !isSaveReady()) {
        autoFlowBusy = false;
        return;
      }
      if (!invokeSaveOnce()) {
        autoFlowBusy = false;
        return;
      }

    waitForSaveComplete((backToStep1) => {
      saveInvokeLock = false;
      savingInProgress = false;
      if (backToStep1) {
        postSaveStep1Wait = true;
        autoFlowBusy = true;
        waitForStep1Ready(() => {
          waitForLoadingDoneAfterSave(() => {
            postSaveStep1Wait = false;
            autoFlowBusy = false;
            cooldown = false;
            tick();
          });
        });
        return;
      }
      autoFlowBusy = false;
      cooldown = false;
      if (isSaveReady()) {
        pendingSave = true;
      }
      waitForLoadingDone(() => tick());
    });
    }, 120, 240);

    return true;
  }

  function updateCooldown() {
    if (postSaveStep1Wait || running || autoFlowBusy || savingInProgress) return;
    if (cooldown && isStep1Visible() && isWorkerIdEmpty()) cooldown = false;
  }

  function autoFillAndConfirm() {
    const input = getWorkerInput();
    const btn = getConfirmBtn();
    if (!input || !btn || running || autoFlowBusy || savingInProgress) return;
    if (!isStep1Ready()) return;

    running = true;
    autoFlowBusy = true;
    cooldown = true;
    typeLikePerson(input, WORKER_ID, () => {
      if (!isWorkerIdValue(WORKER_ID)) {
        running = false;
        autoFlowBusy = false;
        return;
      }
      humanWait(() => {
        const inp = getWorkerInput();
        const b = getConfirmBtn();
        if (!inp || !b || !isWorkerIdValue(WORKER_ID) || b.disabled) {
          running = false;
          autoFlowBusy = false;
          return;
        }
        clickConfirm(b, inp);
        running = false;
        waitForLoadingDone(() => {
          autoFlowBusy = false;
          cooldown = false;
          tick();
        });
      }, 70, 150);
    });
  }

  function startScheduleWatcher() {
    if (scheduleTimer) clearInterval(scheduleTimer);
    checkScheduledEvents();
    scheduleTimer = setInterval(checkScheduledEvents, 15000);
  }

  function tick() {
    checkScheduledEvents();
    if (!canAutoRun()) return;
    if (!isTargetPage()) return;
    if (isLoadingVisible()) return;

    updateLkcNotice();

    // PC chủ: chọn SKY3 trước, rồi mới nhập ID và xử lý kiểm tra đầu ngày.
    if (autoEnsurePcMachine()) return;
    if (autoHandleEquipCheckModal()) return;
    if (autoHandleClaimModal()) return;
    if (autoHandleRecutModal()) return;
    if (autoHandlePickupModal()) return;
    if (autoHandleSave()) return;

    updateCooldown();
    if (!cooldown && !running && !autoFlowBusy && !savingInProgress
        && !isLoadingVisible()
        && isStep1Visible() && isWorkerIdEmpty()) {
      autoFillAndConfirm();
    }
  }

  function handIsRunning() {
    return enabled && isSessionActive() && localStorage.getItem(MANUAL_PAUSE_KEY) !== '1';
  }

  function paintPlayStop(el) {
    if (!el) return;
    const on = handIsRunning();
    el.textContent = on ? '⏸' : '▶';
    if (el.setAttribute) el.setAttribute('aria-label', on ? 'Stop' : 'Play');
  }

  function pauseByHand() {
    localStorage.setItem(MANUAL_PAUSE_KEY, '1');
    running = false;
    autoFlowBusy = false;
    machineSetupBusy = false;
    pendingSave = false;
    saveInvokeLock = false;
    savingInProgress = false;
    hideLkcNotice();
    stopCutLengthWait();
    paintPlayStop(document.getElementById('autoToolPlayStop'));
  }

  function playByHand() {
    localStorage.removeItem(MANUAL_PAUSE_KEY);
    localStorage.setItem(SESSION_KEY, '1');
    localStorage.setItem(STORAGE_KEY, 'true');
    enabled = true;
    const nowMin = minutesOfDay(new Date());
    const evtDay = 'autoWorker141Evt_' + dateKey(new Date()) + '_';
    if (nowMin === PAUSE_HOUR_MORNING * 60) localStorage.setItem(evtDay + 'pause8', '1');
    if (nowMin >= shiftResetMinutes()) localStorage.setItem(evtDay + 'reset1655', '1');
    paintPlayStop(document.getElementById('autoToolPlayStop'));
    if (!window.__autoToolRunning) start();
    else tick();
  }

  function placePlayStop(el) {
    const saved = readSavedPos(PLAY_POS_KEY);
    if (saved) {
      applyFixedPos(el, saved.x, saved.y);
      return;
    }
    applyFixedPos(el, window.innerWidth - 46, 10);
  }

  function installPlayStop() {
    if (!skipMachineSetup()) return;
    let el = document.getElementById('autoToolPlayStop');
    if (el) {
      paintPlayStop(el);
      return;
    }
    el = document.createElement('button');
    el.id = 'autoToolPlayStop';
    el.type = 'button';
    el.style.cssText = [
      'position:fixed',
      'z-index:2147483001',
      'width:36px',
      'height:36px',
      'margin:0',
      'padding:0',
      'border-radius:18px',
      'border:1px solid #E4DCCE',
      'background:#F7F4EE',
      'color:#6A645C',
      'font:600 15px/36px sans-serif',
      'text-align:center',
      'box-shadow:0 1px 3px rgba(0,0,0,.1)',
      'cursor:pointer',
      'touch-action:none',
      'user-select:none',
    ].join(';');
    document.body.appendChild(el);
    placePlayStop(el);
    installDrag(el, PLAY_POS_KEY, () => {
      if (handIsRunning()) pauseByHand();
      else playByHand();
    });
    paintPlayStop(el);
    if (!window.__atPlayResize) {
      window.__atPlayResize = true;
      window.addEventListener('resize', () => {
        const btn = document.getElementById('autoToolPlayStop');
        if (btn && !btn.__atDragging) placePlayStop(btn);
        const notice = document.getElementById('autoToolLkcNotice');
        if (notice) positionLkcNotice(notice);
      });
    }
  }

  function start() {
    if (!document.getElementById('workerId')) {
      const wait = () => {
        if (document.getElementById('workerId')) start();
        else setTimeout(wait, 100);
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wait, { once: true });
      } else {
        wait();
      }
      return;
    }

    if (tickInterval) clearInterval(tickInterval);
    if (domObserver) domObserver.disconnect();
    if (scheduleTimer) clearInterval(scheduleTimer);

    const boot = () => {
      window.__autoToolRunning = true;
      installPlayStop();
      installPageHooks();
      startScheduleWatcher();
      tick();
      tickInterval = setInterval(tick, TICK_MS);
      domObserver = new MutationObserver(tick);
      domObserver.observe(document.body, {
        childList: true, subtree: true, attributes: true,
        attributeFilter: ['style', 'value', 'hidden'],
      });
      setTimeout(tick, 200);
      setTimeout(tick, 500);
    };

    if (document.body) boot();
    else window.addEventListener('DOMContentLoaded', boot);
  }

  installReloadBoot();
  installPlayStop();

  if (!enabled || !isSessionActive()) {
    return;
  }
  start();
})();

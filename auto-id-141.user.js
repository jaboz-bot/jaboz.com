// ==UserScript==
// @name         Auto ID Công nhân 141
// @namespace    jaboz
// @version      2.0
// @description  Bật/tắt từ jaboz.com — tự nhập ID 141 trên mọi tab
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @require      https://jaboz.com/auto-id-141.js
// @run-at       document-idle
// ==/UserScript==

AutoId141.boot({
  gm: {
    getValue: GM_getValue,
    setValue: GM_setValue,
    addValueChangeListener: GM_addValueChangeListener,
  },
});

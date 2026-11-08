import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";

const root = new URL("..", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root));

test("https://jaboz.com/at is a real page, not the GitHub Pages 404", () => {
  const html = read("at/index.html").toString("utf8");
  assert.ok(html.length > 1000);
  assert.match(html, /<title>AT<\/title>/);
  assert.doesNotMatch(html, /Page not found/);
  assert.match(html, /class="bm"/);
  assert.match(html, /class="bm apk"/);
  assert.match(html, /href="AT\.apk"/);
  assert.doesNotMatch(html, /https:\/\/jaboz\.com\/app\/at\/AT\.apk/);

  const href = html.match(/href="(javascript:[^"]+)"/);
  assert.ok(href, "bookmarklet link");
  const source = decodeURIComponent(href[1].slice("javascript:".length));
  assert.match(source, /WORKER_ID='141'/);
  assert.match(source, /COMPANY_URL='http:\/\/192\.168\.10\.27:5009'/);
  assert.match(source, /PAUSE_HOUR_MORNING=8/);
  assert.match(source, /PAUSE_HOUR_LUNCH=12/);
  assert.match(source, /RESET_HOUR=16/);
  assert.match(source, /RESET_MIN=55/);
  assert.match(source, /function checkScheduledEvents\(/);
});

test("/app/at keeps the old URL by sending people to /at/", () => {
  const html = read("app/at/index.html").toString("utf8");
  assert.match(html, /url=\/at\//);
  assert.match(html, /location\.replace\("\/at\/"\)/);
  assert.match(html, /href="\/at\/"/);
  assert.match(html, /<title>AT<\/title>/);
});

test("data-entry snippet in the Android project is the existing script", () => {
  const snippet = read("app/at/android/app/src/main/assets/auto-tool-snippet.js").toString("utf8");
  assert.match(snippet, /const COMPANY_URL = 'http:\/\/192\.168\.10\.27:5009'/);
  assert.match(snippet, /const PAUSE_HOUR_MORNING = 8/);
  assert.match(snippet, /const PAUSE_HOUR_LUNCH = 12/);
  assert.match(snippet, /const RESET_HOUR = 16/);
  assert.match(snippet, /const RESET_MIN = 55/);
  assert.match(snippet, /function checkScheduledEvents\(/);
  assert.doesNotMatch(snippet, /20:25|11:50/);
});

test("both public APK paths are the same debug build 1.9", () => {
  const pageApk = read("at/AT.apk");
  const storeApk = read("app/at/AT.apk");
  assert.ok(pageApk.length > 1000);
  assert.equal(createHash("sha256").update(pageApk).digest("hex"), createHash("sha256").update(storeApk).digest("hex"));
  const aapt = `${process.env.HOME}/android-sdk/build-tools/34.0.0/aapt`;
  const badging = execFileSync(aapt, ["dump", "badging", new URL("at/AT.apk", root).pathname], {
    encoding: "utf8",
  });
  assert.match(badging, /package: name='com\.jaboz\.at'/);
  assert.match(badging, /versionCode='10'/);
  assert.match(badging, /versionName='1\.9'/);
  assert.match(badging, /application: label='AT'/);
  assert.match(badging, /launchable-activity: name='com\.jaboz\.at\.MainActivity'/);
  assert.match(badging, /uses-permission: name='android\.permission\.INTERNET'/);
  assert.match(badging, /application-debuggable/);
  const snippet = execFileSync("unzip", ["-p", new URL("at/AT.apk", root).pathname, "assets/auto-tool-snippet.js"], {
    encoding: "utf8",
  });
  const expected = read("app/at/android/app/src/main/assets/auto-tool-snippet.js").toString("utf8");
  assert.equal(snippet, expected);
});

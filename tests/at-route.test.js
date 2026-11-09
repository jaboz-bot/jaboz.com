import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (rel) => fs.readFileSync(path.join(root, rel));
const aapt = `${process.env.HOME}/android-sdk/build-tools/34.0.0/aapt`;
const apksigner = `${process.env.HOME}/android-sdk/build-tools/34.0.0/apksigner`;

function manifest() {
  return JSON.parse(read("at/versions.json").toString("utf8"));
}

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function resolveFrom(fromRel, href) {
  const dir = path.dirname(path.join(root, fromRel));
  return path.normalize(path.join(dir, href));
}

test("landing sends each entry to its own version list", () => {
  const html = read("at/index.html").toString("utf8");
  assert.match(html, /<title>AT<\/title>/);
  assert.match(html, /class="bm"/);
  assert.match(html, /class="bm apk"/);
  assert.match(html, /href="web\/"/);
  assert.match(html, /href="apk\/"/);
  assert.match(html, /bản cũ/);
  assert.doesNotMatch(html, /href="javascript:/);
  assert.doesNotMatch(html, /href="AT\.apk"/);
  assert.equal(fs.existsSync(resolveFrom("at/index.html", "web/index.html")), true);
  assert.equal(fs.existsSync(resolveFrom("at/index.html", "apk/index.html")), true);
});

test("/app/at keeps the old URL by sending people to /at/", () => {
  const html = read("app/at/index.html").toString("utf8");
  assert.match(html, /url=\/at\//);
  assert.match(html, /location\.replace\("\/at\/"\)/);
  assert.match(html, /href="\/at\/"/);
});

test("data-entry snippet in the Android project is the existing script", () => {
  const snippet = read("app/at/android/app/src/main/assets/auto-tool-snippet.js").toString("utf8");
  assert.match(snippet, /const COMPANY_URL = 'http:\/\/192\.168\.10\.27:5009'/);
  assert.match(snippet, /const PAUSE_HOUR_MORNING = 8/);
  assert.match(snippet, /const PAUSE_HOUR_LUNCH = 12/);
  assert.match(snippet, /const RESET_HOUR = 16/);
  assert.match(snippet, /const RESET_MIN = 55/);
  assert.doesNotMatch(snippet, /20:25|11:50/);
});

test("preserved web versions stay byte-for-byte and open from the AT list", () => {
  const data = manifest();
  const html = read("at/web/index.html").toString("utf8");
  assert.match(html, /Phiên bản trang/);
  assert.match(html, /Không gỡ và không hạ app Android/);
  assert.doesNotMatch(html, /Gỡ app sẽ mất dữ liệu/);
  const currents = data.web.filter((item) => item.current);
  assert.equal(currents.length, 1);
  assert.equal(currents[0].id, "1012.2232");
  for (const item of data.web) {
    const file = path.join(root, "at", item.file);
    const bytes = fs.readFileSync(file);
    assert.equal(sha256(bytes), item.sha256, item.id);
    assert.equal(bytes.length, item.bytes);
    const text = bytes.toString("utf8");
    assert.match(text, new RegExp(`V=%22${item.id.replace(".", "\\.")}%22`));
    const fromGit = execFileSync("git", ["show", item.source], { cwd: root });
    assert.equal(sha256(fromGit), item.sha256, item.source);
    assert.match(html, new RegExp(`data-id="${item.id}"`));
    assert.match(html, new RegExp(`href="${item.id}/"`));
    const opened = resolveFrom("at/web/index.html", `${item.id}/index.html`);
    assert.equal(opened, file);
    assert.equal(fs.existsSync(opened), true);
  }
  const live = read("at/web/1012.2232/index.html").toString("utf8");
  const href = live.match(/href="(javascript:[^"]+)"/);
  assert.ok(href);
  const source = decodeURIComponent(href[1].slice("javascript:".length));
  assert.match(source, /WORKER_ID='141'/);
  assert.match(source, /COMPANY_URL='http:\/\/192\.168\.10\.27:5009'/);
  assert.match(source, /PAUSE_HOUR_MORNING=8/);
  assert.match(source, /RESET_HOUR=16/);
  assert.match(source, /RESET_MIN=55/);
  assert.match(html, /data-id="1012\.2232"[^>]*data-current="true"/);
});

test("preserved APK versions stay byte-for-byte and download from the AT APK list", () => {
  const data = manifest();
  const html = read("at/apk/index.html").toString("utf8");
  assert.match(html, /Phiên bản APK/);
  assert.match(html, /debug, không phải release/);
  assert.match(html, /bắt gỡ AT/);
  assert.match(html, /mất dữ liệu của app/);
  const currents = data.apk.filter((item) => item.current);
  assert.equal(currents.length, 1);
  assert.equal(currents[0].versionName, "1.9");
  assert.equal(currents[0].versionCode, 10);
  const certs = new Set(data.apk.map((item) => item.certSha256));
  assert.equal(certs.size, 2);
  for (const item of data.apk) {
    assert.equal(item.buildType, "debug");
    assert.equal(item.release, false);
    const file = path.join(root, "at", item.file);
    const bytes = fs.readFileSync(file);
    assert.equal(sha256(bytes), item.sha256, item.versionName);
    assert.equal(bytes.length, item.bytes);
    if (item.versionName === "1.9") {
      assert.equal(sha256(bytes), sha256(read("at/AT.apk")));
      assert.equal(sha256(bytes), sha256(read("app/at/AT.apk")));
    } else {
      const fromGit = execFileSync("git", ["show", item.source], { cwd: root });
      assert.equal(sha256(fromGit), item.sha256, item.source);
    }
    const badging = execFileSync(aapt, ["dump", "badging", file], { encoding: "utf8" });
    assert.match(badging, new RegExp(`versionCode='${item.versionCode}'`));
    assert.match(badging, new RegExp(`versionName='${item.versionName}'`));
    assert.match(badging, /application-debuggable/);
    assert.doesNotMatch(badging, /versionName='release'/);
    const cert = execFileSync(apksigner, ["verify", "--print-certs", file], { encoding: "utf8" });
    assert.match(cert, new RegExp(item.certSha256));
    assert.match(html, new RegExp(`data-id="${item.versionName}"`));
    assert.match(html, new RegExp(`href="${item.versionName}/AT\\.apk"`));
    assert.match(html, new RegExp(item.certSha256));
    const downloaded = resolveFrom("at/apk/index.html", `${item.versionName}/AT.apk`);
    assert.equal(downloaded, file);
  }
  const oldCert = data.apk.find((item) => item.versionName === "1.8").certSha256;
  const newCert = data.apk.find((item) => item.versionName === "1.9").certSha256;
  assert.notEqual(oldCert, newCert);
  for (const name of ["1.0", "1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8"]) {
    assert.equal(data.apk.find((item) => item.versionName === name).certSha256, oldCert);
  }
});

test("version links keep working from nested pages on both entries", () => {
  const data = manifest();
  const webHtml = read("at/web/index.html").toString("utf8");
  const apkHtml = read("at/apk/index.html").toString("utf8");
  assert.equal(fs.existsSync(resolveFrom("at/web/index.html", "../index.html")), true);
  assert.equal(fs.existsSync(resolveFrom("at/web/index.html", "../apk/index.html")), true);
  assert.equal(fs.existsSync(resolveFrom("at/apk/index.html", "../web/index.html")), true);
  const nestedWeb = "at/web/0804.0036/index.html";
  assert.equal(fs.existsSync(path.join(root, nestedWeb)), true);
  assert.equal(
    resolveFrom(nestedWeb, "../../apk/1.8/AT.apk"),
    path.join(root, "at/apk/1.8/AT.apk"),
  );
  assert.equal(
    resolveFrom(nestedWeb, "../1012.2232/index.html"),
    path.join(root, "at/web/1012.2232/index.html"),
  );
  assert.match(webHtml, /href="\.\.\/apk\/"/);
  assert.match(apkHtml, /href="\.\.\/web\/"/);
  assert.equal(data.web.length >= 2, true);
  assert.equal(data.apk.length >= 2, true);
  assert.equal(data.web.some((item) => !item.current), true);
  assert.equal(data.apk.some((item) => !item.current), true);
});

test("public 1.9 APK is still the debug build", () => {
  const badging = execFileSync(aapt, ["dump", "badging", path.join(root, "at/AT.apk")], { encoding: "utf8" });
  assert.match(badging, /package: name='com\.jaboz\.at'/);
  assert.match(badging, /versionCode='10'/);
  assert.match(badging, /versionName='1\.9'/);
  assert.match(badging, /application-debuggable/);
  const snippet = execFileSync("unzip", ["-p", path.join(root, "at/AT.apk"), "assets/auto-tool-snippet.js"], {
    encoding: "utf8",
  });
  assert.equal(snippet, read("app/at/android/app/src/main/assets/auto-tool-snippet.js").toString("utf8"));
});

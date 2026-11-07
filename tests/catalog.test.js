import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { applyVersionManifest, formatSize, isCatalogVersionUrl, versionText } from "../app/catalog.js";

const published = {
  versionCode: 153,
  versionName: "1.3.22",
  apk: "https://jaboz.com/app/you-and-me/You-and-Me.apk?v=153",
  sha256: "d35138f280396e0e84c871f04af730a0f9b351ded4c8cd29c45b33fd567d25dc",
  size: 30760117,
};

test("store overlay follows you-and-me version.json", () => {
  const stale = {
    id: "you-and-me",
    name: "You & Me",
    latestVersionCode: 129,
    latestVersionName: "1.2.8",
    apkUrl: "https://jaboz.com/app/you-and-me/You-and-Me.apk?v=129",
    sizeLabel: "29.3 MB",
    updated: "2026-11-02",
    versionUrl: "./you-and-me/version.json",
    summary: "Hai điện thoại xem tin nhắn và nhật ký cuộc gọi của nhau khi cả hai đồng ý.",
  };
  const next = applyVersionManifest(stale, published, "Sat, 07 Nov 2026 12:14:25 GMT");
  assert.equal(next.latestVersionName, "1.3.22");
  assert.equal(next.latestVersionCode, 153);
  assert.equal(next.apkUrl, published.apk);
  assert.equal(next.sizeLabel, "29.3 MB");
  assert.equal(formatSize(published.size), "29.3 MB");
  assert.equal(next.updated, "2026-11-07");
  assert.equal(next.summary, stale.summary);
  assert.equal(versionText(next), "1.3.22 (153)");
  assert.equal(stale.latestVersionName, "1.2.8");
});

test("overlay keeps the catalog download when the manifest apk is not this app", () => {
  const app = {
    versionUrl: "./you-and-me/version.json",
    latestVersionName: "1.3.22",
    latestVersionCode: 153,
    apkUrl: published.apk,
  };
  const next = applyVersionManifest(app, {
    ...published,
    apk: "https://example.invalid/You-and-Me.apk?v=153",
  });
  assert.equal(next.apkUrl, published.apk);
});

test("other store entries are not switched onto their own version files", () => {
  const catalog = JSON.parse(fs.readFileSync(new URL("../app/apps.json", import.meta.url), "utf8"));
  const byId = Object.fromEntries(catalog.apps.map((app) => [app.id, app]));
  assert.equal(byId["vo-can"].versionUrl, undefined);
  assert.equal(byId["vo-can"].latestVersionName, "2.0");
  assert.equal(byId["vo-can"].latestVersionCode, 6);
  assert.equal(byId["vo-can"].apkUrl, "https://jaboz.com/app/vo-can/Vo-Can.apk");
  assert.equal(versionText(byId["vo-can"]), "2.0");
  assert.equal(byId["jaboz-manager"].versionUrl, undefined);
  assert.equal(byId["jaboz-manager"].latestVersionName, "1.0.3");
  assert.equal(byId["jaboz-manager"].apkUrl, "https://jaboz.com/app/jaboz-manager/Jaboz-Manager.apk?v=4");
  assert.equal(versionText(byId["jaboz-manager"]), "1.0.3");
  assert.equal(byId["you-and-me"].versionUrl, "./you-and-me/version.json");
  assert.equal(isCatalogVersionUrl(byId["you-and-me"].versionUrl), true);
  assert.equal(isCatalogVersionUrl("https://example.invalid/version.json"), false);
});

test("store page renders the manifest version and download", () => {
  const html = fs.readFileSync(new URL("../app/index.html", import.meta.url), "utf8");
  assert.match(html, /from "\.\/catalog\.js"/);
  assert.match(html, /applyVersionManifest/);
  assert.match(html, /versionText\(app\)/);
  assert.match(html, /dataset\.apk/);
  assert.match(html, /cache: "no-store"/);
});

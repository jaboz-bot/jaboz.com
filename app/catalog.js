const YOU_AND_ME_APK = "https://jaboz.com/app/you-and-me/You-and-Me.apk";

export function isCatalogVersionUrl(url) {
  return typeof url === "string" && /^\.\/[a-z0-9-]+\/version\.json$/.test(url);
}

export function formatSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return "";
  const mb = n / (1024 * 1024);
  if (mb >= 0.1) return `${mb.toFixed(1)} MB`;
  const kb = Math.max(1, Math.round(n / 1024));
  return `${kb} KB`;
}

export function applyVersionManifest(app, manifest, lastModified) {
  const next = { ...app };
  if (!manifest || typeof manifest !== "object") return next;

  const name = manifest.versionName;
  if (typeof name === "string" && /^[0-9A-Za-z][0-9A-Za-z._+-]{0,40}$/.test(name)) {
    next.latestVersionName = name;
  }

  const code = Number(manifest.versionCode);
  if (Number.isInteger(code) && code > 0 && code < 1000000) {
    next.latestVersionCode = code;
  }

  const apk = manifest.apk;
  if (apk === YOU_AND_ME_APK || (typeof apk === "string" && apk.startsWith(`${YOU_AND_ME_APK}?`))) {
    next.apkUrl = apk;
  }

  const label = formatSize(manifest.size);
  if (label) next.sizeLabel = label;

  if (typeof lastModified === "string" && lastModified) {
    const published = new Date(lastModified);
    if (!Number.isNaN(published.getTime())) next.updated = published.toISOString().slice(0, 10);
  }

  return next;
}

export function versionText(app) {
  const name = app && app.latestVersionName ? String(app.latestVersionName) : "";
  if (!name) return "";
  if (app.versionUrl && Number.isInteger(Number(app.latestVersionCode))) {
    return `${name} (${Number(app.latestVersionCode)})`;
  }
  return name;
}

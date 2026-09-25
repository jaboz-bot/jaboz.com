# jaboz.com

Trang tai APK chinh thuc. Giao dien nam o `index.html`, du lieu nam o `update.json`.

## Dang ban moi

1. Build APK (tang `versionCode`, `versionName`).
2. Copy APK vao `app/`.
3. Sua `update.json`:
   - `name`, `developer`, `summary`, `description`
   - `latestVersionCode`, `latestVersionName`
   - `apkUrl` (link file APK tren jaboz.com)
   - `sizeLabel`, `updated`, `requires`
   - `icon`, `screenshots` (duong dan anh)
   - `releaseNotes`, `details`
4. Push len nhanh `main`.

Khi `apkUrl` trong, nut tai tren trang o trang thai chua phat hanh.

## Quy uoc update

- `minVersionCode` bang `latestVersionCode`: bat buoc cap nhat.
- `minVersionCode` nho hon `latestVersionCode`: cap nhat tu nguyen.

Android khong cai ngam ngoai CH Play. App mo link APK de nguoi dung cai.

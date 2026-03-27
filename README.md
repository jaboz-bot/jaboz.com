# jaboz.com - static app download

Bo cuc toi gian:

- `index.html`: landing page tai app.
- `update.json`: metadata de app Android tu kiem tra ban moi.
- `app/`: chua cac file APK da phat hanh.

## Quy trinh phat hanh de nhat

1. Build APK moi (tang `versionCode`, `versionName` trong app Android).
2. Copy APK vao `app/` (giu lai ban cu de rollback).
3. Cap nhat `update.json`:
   - `latestVersionCode`
   - `latestVersionName`
   - `minVersionCode` (neu muon ep cap nhat)
   - `apkUrl` (link toi file APK moi tren jaboz.com)
   - `releaseNotes`
4. Push len nhanh `main` cua repo `jaboz.com`.

## Quy uoc update

- `minVersionCode`:
  - Bang `latestVersionCode`: bat buoc tat ca nguoi dung cap nhat.
  - Nho hon `latestVersionCode`: cho phep nguoi dung cap nhat tu nguyen.

> Luu y: Android khong cho "silent update" ngoai CH Play. App se hien thong bao cap nhat va mo link APK de nguoi dung cai dat.

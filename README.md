# jaboz.com

Cua hang APK chinh thuc.

- `index.html`: trang cua hang (doc `apps.json`)
- `apps.json`: danh sach app (Jaboz Manager ghim dau)
- `update.json`: feed cap nhat cho You & Me
- `jaboz-manager/`: APK + icon Jaboz Manager
- `you-and-me/`: APK + icon You & Me

## Them app moi

1. Dat APK + icon vao thu muc rieng.
2. Them muc vao `apps.json` (`pinned: true` neu muon ghim dau).
3. Push `main`.

## Jaboz Manager (source)

Source Android nam o `../jaboz-manager` (ngoai site). Build:

```
cd ../jaboz-manager
gradlew.bat assembleRelease
```

Ky APK roi copy vao `jaboz-manager/Jaboz-Manager.apk`.

# jaboz.com

- **Trang công khai:** `/` — landing Jaboz (không liệt kê app)
- **Cửa hàng APK (riêng):** [`/app/`](https://jaboz.com/app/) — đọc `app/apps.json`

## Cấu trúc

- `index.html` — landing công khai
- `app/index.html` — cửa hàng
- `app/apps.json` — danh sách app
- `app/you-and-me/` — APK + `version.json` (cập nhật ngầm You & Me)
- `you-and-me/version.json` — shim tương thích URL cũ (`jaboz.com/you-and-me/version.json` → APK dưới `/app/…`)

## Thêm app mới

1. Đặt APK + icon vào thư mục trong `app/`.
2. Thêm mục vào `app/apps.json`.
3. Push `main`.

## You & Me — cập nhật

Canonical: `https://jaboz.com/app/you-and-me/version.json`  
Shim cũ: `https://jaboz.com/you-and-me/version.json` (cùng nội dung, `apk` trỏ `/app/…`)

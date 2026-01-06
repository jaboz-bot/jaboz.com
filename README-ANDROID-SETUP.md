# Cấu hình Cursor với Android Studio

Dự án này đã được cấu hình để Cursor có thể tự động nhận diện và kiểm tra Android SDK và Android Studio.

## ✅ Đã cấu hình

1. **Android SDK Path**: Đã được thiết lập trong Cursor settings
2. **Environment Variables**: ANDROID_HOME và ANDROID_SDK_ROOT đã được cấu hình
3. **Terminal Integration**: Terminal trong Cursor tự động có các biến môi trường Android
4. **Tasks**: Các task để kiểm tra và chạy Android emulator

## 🚀 Cách sử dụng

### 1. Kiểm tra cấu hình Android

**Cách 1: Dùng Task trong Cursor**
- Nhấn `Ctrl+Shift+P`
- Gõ "Tasks: Run Task"
- Chọn "Check Android SDK"

**Cách 2: Chạy script thủ công**
```powershell
.\check-android.ps1
```

### 2. Chạy Android Emulator

**Cách 1: Dùng Task**
- Nhấn `Ctrl+Shift+P`
- Gõ "Tasks: Run Task"
- Chọn "Start Android Emulator"

**Cách 2: Từ Terminal**
```powershell
& "$env:ANDROID_SDK_ROOT\emulator\emulator.exe" -avd Pixel_8a_x86
```

### 3. Liệt kê các AVD có sẵn

```powershell
& "$env:ANDROID_SDK_ROOT\emulator\emulator.exe" -list-avds
```

## 📁 Cấu trúc file cấu hình

- `.vscode/settings.json` - Cấu hình Android SDK cho workspace
- `.vscode/tasks.json` - Các task để kiểm tra và chạy Android
- `.vscode/extensions.json` - Gợi ý các extension Android cần thiết
- `check-android.ps1` - Script kiểm tra cấu hình Android

## 🔧 Cài đặt Extension (Tùy chọn)

Cursor sẽ gợi ý các extension sau khi mở workspace:
- Gradle Language Support
- Java Extension Pack
- Kotlin
- Flutter & Dart (nếu phát triển Flutter)

## ⚠️ Lưu ý

1. **Reload Cursor**: Sau khi cấu hình, khởi động lại Cursor để áp dụng thay đổi
2. **Environment Variables**: Các biến môi trường đã được thiết lập vĩnh viễn trong User Environment Variables
3. **Android Studio**: Đã được phát hiện tại `C:\Program Files\Android\Android Studio\`

## 🐛 Xử lý lỗi

Nếu gặp lỗi, chạy script kiểm tra:
```powershell
.\check-android.ps1
```

Script sẽ hiển thị:
- ✅ Các thành phần đã cài đặt đúng
- ❌ Các thành phần còn thiếu
- ⚠️ Các cảnh báo

## 📝 Ghi chú

- Android SDK path: `C:\Users\Jaboz\AppData\Local\Android\Sdk`
- Android Studio: `C:\Program Files\Android\Android Studio\`
- AVD hiện có: `Pixel_8a_x86`


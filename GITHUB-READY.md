# ✅ Đã kết nối với GitHub!

Repository đã được liên kết với: **https://github.com/jaboz-bot/jaboz.com.git**

## 🚀 Bước tiếp theo: Push code lên GitHub

### Cách 1: Dùng Cursor (Khuyến nghị)

1. **Mở Source Control:**
   - Nhấn `Ctrl+Shift+G`
   - Hoặc click biểu tượng nhánh cây ở sidebar bên trái

2. **Commit code:**
   - Nhập message: `Initial commit: RSA App project`
   - Nhấn `Ctrl+Enter` để commit

3. **Push lên GitHub:**
   - Nhấn `...` (3 chấm) ở trên cùng
   - Chọn **"Push"**
   - Nếu hỏi branch, chọn **"main"**

### Cách 2: Dùng Terminal

```powershell
# Commit tất cả file
git commit -m "Initial commit: RSA App project"

# Push lên GitHub
git push -u origin main
```

## 🔐 Xác thực GitHub

Lần đầu push sẽ yêu cầu đăng nhập:

1. **Username**: `jaboz-bot`
2. **Password**: Dùng **Personal Access Token** (không phải password GitHub)

### Tạo Personal Access Token:

1. Vào GitHub → **Settings** → **Developer settings**
2. **Personal access tokens** → **Tokens (classic)**
3. **Generate new token (classic)**
4. Chọn quyền: `repo` (full control)
5. Copy token và dùng khi push

## 📁 Các file sẽ được push

- ✅ `.gitignore` - Loại trừ file không cần thiết
- ✅ `Admin/` - Thư mục admin
- ✅ `Dashboard/` - Thư mục dashboard  
- ✅ `Mobile-App/` - Thư mục mobile app
- ✅ `check-android.ps1` - Script kiểm tra Android
- ✅ `setup-github.ps1` - Script setup GitHub
- ✅ Các file README và hướng dẫn

## 🔄 Sử dụng hàng ngày

### Xem thay đổi
- `Ctrl+Shift+G` - Mở Source Control

### Commit và Push
1. `Ctrl+Shift+G`
2. Nhập message commit
3. `Ctrl+Enter` để commit
4. `...` → **Push**

### Pull (Lấy code mới)
1. `Ctrl+Shift+G`
2. `...` → **Pull**

## ✅ Kiểm tra kết nối

```powershell
# Xem remote repository
git remote -v

# Xem trạng thái
git status

# Xem lịch sử commit
git log --oneline
```

## 🆘 Nếu gặp lỗi

### "authentication failed"
- Kiểm tra Personal Access Token
- Hoặc thiết lập SSH key

### "failed to push"
```powershell
git pull origin main --rebase
git push origin main
```

### "branch 'main' has no upstream branch"
```powershell
git push -u origin main
```

---

**Repository URL**: https://github.com/jaboz-bot/jaboz.com.git  
**Branch**: main


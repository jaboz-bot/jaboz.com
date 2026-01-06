# 🚀 Hướng dẫn nhanh: Liên kết với GitHub

## Bước 1: Tạo Repository trên GitHub

1. Vào https://github.com và đăng nhập
2. Nhấn **"+"** → **"New repository"**
3. Đặt tên repository (ví dụ: `RSA-App`)
4. Chọn **Public** hoặc **Private**
5. **KHÔNG** tích "Initialize with README"
6. Nhấn **"Create repository"**

## Bước 2: Chạy Script Tự Động

Mở PowerShell trong thư mục dự án và chạy:

```powershell
.\setup-github.ps1 -GitHubUsername "TEN-GITHUB-CUA-BAN" -RepositoryName "RSA-App"
```

**Thay `TEN-GITHUB-CUA-BAN` bằng tên GitHub username của bạn!**

Script sẽ:
- ✅ Kiểm tra cấu hình Git
- ✅ Thiết lập user name/email nếu chưa có
- ✅ Kết nối với GitHub repository

## Bước 3: Push Code lên GitHub

### Cách 1: Dùng Cursor (Dễ nhất)

1. Nhấn `Ctrl+Shift+G` để mở Source Control
2. Nhập message: `Initial commit`
3. Nhấn `Ctrl+Enter` để commit
4. Nhấn `...` (3 chấm) → **Push**

### Cách 2: Dùng Terminal

```powershell
# Thêm tất cả file
git add .

# Commit
git commit -m "Initial commit: RSA App project"

# Push lên GitHub
git push -u origin main
```

**Lưu ý**: 
- Nếu branch là `master` thay vì `main`, dùng: `git push -u origin master`
- Lần đầu push sẽ yêu cầu đăng nhập GitHub

## 🔐 Xác thực GitHub

### Nếu dùng HTTPS:
GitHub yêu cầu **Personal Access Token** (không dùng password):

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. **Generate new token (classic)**
3. Chọn quyền: `repo` (full control)
4. Copy token và dùng khi push/pull

### Nếu dùng SSH:
1. Tạo SSH key (nếu chưa có):
   ```powershell
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
2. Copy public key:
   ```powershell
   cat ~/.ssh/id_ed25519.pub
   ```
3. GitHub → **Settings** → **SSH and GPG keys** → **New SSH key** → Paste key

## 📝 Sử dụng trong Cursor

### Xem thay đổi
- `Ctrl+Shift+G` - Mở Source Control panel
- Xem các file đã thay đổi (màu xanh lá = mới, màu vàng = đã sửa)

### Commit
1. `Ctrl+Shift+G`
2. Nhập message commit
3. `Ctrl+Enter` để commit

### Push (Đẩy lên GitHub)
1. `Ctrl+Shift+G`
2. Nhấn `...` → **Push**

### Pull (Lấy code mới từ GitHub)
1. `Ctrl+Shift+G`
2. Nhấn `...` → **Pull**

## ✅ Kiểm tra đã kết nối

```powershell
# Xem remote repository
git remote -v

# Xem trạng thái
git status

# Xem lịch sử commit
git log --oneline
```

## 🆘 Xử lý lỗi

### "remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/USERNAME/REPO.git
```

### "authentication failed"
- Kiểm tra Personal Access Token (HTTPS)
- Hoặc kiểm tra SSH key (SSH)

### "failed to push"
```powershell
git pull origin main --rebase
git push origin main
```

## 📚 Tài liệu chi tiết

Xem file `README-GITHUB-SETUP.md` để biết thêm chi tiết.


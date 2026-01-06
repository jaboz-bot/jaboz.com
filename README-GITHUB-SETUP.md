# Hướng dẫn liên kết Cursor với GitHub

## 📋 Bước 1: Tạo Repository trên GitHub

1. Đăng nhập vào [GitHub](https://github.com)
2. Nhấn nút **"+"** ở góc trên bên phải → chọn **"New repository"**
3. Điền thông tin:
   - **Repository name**: `RSA-App` (hoặc tên bạn muốn)
   - **Description**: Mô tả dự án (tùy chọn)
   - **Visibility**: Chọn **Public** hoặc **Private**
   - **KHÔNG** tích vào "Initialize with README" (vì đã có code)
4. Nhấn **"Create repository"**

## 🔗 Bước 2: Kết nối Repository Local với GitHub

Sau khi tạo repository trên GitHub, bạn sẽ thấy URL. Có 2 cách:

### Cách 1: Sử dụng HTTPS (Dễ nhất)

```powershell
# Thêm remote repository
git remote add origin https://github.com/TEN-GITHUB-CUA-BAN/RSA-App.git

# Kiểm tra đã kết nối chưa
git remote -v
```

**Lưu ý**: Thay `TEN-GITHUB-CUA-BAN` bằng tên GitHub username của bạn.

### Cách 2: Sử dụng SSH (Bảo mật hơn)

```powershell
# Thêm remote repository
git remote add origin git@github.com:TEN-GITHUB-CUA-BAN/RSA-App.git
```

## 📤 Bước 3: Commit và Push code lên GitHub

```powershell
# Xem các file đã thay đổi
git status

# Thêm tất cả các file vào staging
git add .

# Commit với message
git commit -m "Initial commit: RSA App project"

# Push lên GitHub (lần đầu)
git push -u origin main
```

**Lưu ý**: 
- Nếu branch của bạn là `master` thay vì `main`, dùng: `git push -u origin master`
- Lần đầu push có thể yêu cầu đăng nhập GitHub

## 🔄 Bước 4: Sử dụng trong Cursor

### Xem thay đổi
- Mở **Source Control** panel (biểu tượng nhánh cây ở sidebar bên trái)
- Hoặc nhấn `Ctrl+Shift+G`

### Commit và Push
1. Nhấn `Ctrl+Shift+G` để mở Source Control
2. Nhập message commit
3. Nhấn `Ctrl+Enter` để commit
4. Nhấn `...` → **Push** để đẩy lên GitHub

### Pull (Lấy code mới từ GitHub)
- Nhấn `Ctrl+Shift+G`
- Nhấn `...` → **Pull** để lấy code mới

## 🔐 Xác thực với GitHub

### Nếu dùng HTTPS:
GitHub yêu cầu Personal Access Token thay vì password:

1. Vào GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Nhấn **"Generate new token"**
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
3. Thêm vào GitHub: **Settings** → **SSH and GPG keys** → **New SSH key**

## 📁 Cấu trúc Repository cho Web Tĩnh

Repository của bạn có thể chứa:
```
RSA-App/
├── Admin/          # Thư mục admin
├── Dashboard/      # Thư mục dashboard
├── Mobile-App/     # Thư mục mobile app
├── .gitignore      # File loại trừ
└── README.md       # Mô tả dự án
```

## 🚀 Các lệnh Git thường dùng

```powershell
# Xem trạng thái
git status

# Xem lịch sử commit
git log

# Xem các branch
git branch

# Tạo branch mới
git checkout -b ten-branch-moi

# Chuyển branch
git checkout ten-branch

# Merge branch
git merge ten-branch

# Xem thay đổi
git diff

# Undo thay đổi chưa commit
git restore ten-file.html

# Undo commit (giữ thay đổi)
git reset --soft HEAD~1
```

## ⚠️ Lưu ý quan trọng

1. **Luôn commit trước khi push**: Đảm bảo đã commit trước khi push
2. **Pull trước khi push**: Nếu có người khác làm việc cùng, pull trước để tránh conflict
3. **Không commit file nhạy cảm**: Đã có `.gitignore` để loại trừ file không cần thiết
4. **Commit message rõ ràng**: Viết message mô tả rõ thay đổi

## 🆘 Xử lý lỗi thường gặp

### Lỗi: "remote origin already exists"
```powershell
# Xóa remote cũ
git remote remove origin

# Thêm lại
git remote add origin URL-GITHUB-CUA-BAN
```

### Lỗi: "failed to push some refs"
```powershell
# Pull code mới trước
git pull origin main --rebase

# Push lại
git push origin main
```

### Lỗi: "authentication failed"
- Kiểm tra lại Personal Access Token (HTTPS)
- Hoặc kiểm tra SSH key (SSH)

## 📝 Tạo README.md cho Repository

Tạo file `README.md` để mô tả dự án:

```markdown
# RSA App

Remote Support Assistant Application

## Cấu trúc

- `Admin/` - Admin panel
- `Dashboard/` - Dashboard interface  
- `Mobile-App/` - Mobile application

## Cài đặt

...

## Sử dụng

...
```


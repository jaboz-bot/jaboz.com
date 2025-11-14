# 💬 Chat Room App - Ứng dụng Chat Room đơn giản

Ứng dụng chat room real-time đơn giản được xây dựng với Node.js, Express và Socket.io.

## ✨ Tính năng

- ✅ Tạo và tham gia phòng chat
- ✅ Chat real-time (tin nhắn hiển thị ngay lập tức)
- ✅ Hiển thị số người trong phòng
- ✅ Lưu lịch sử tin nhắn (50 tin nhắn gần nhất)
- ✅ Giao diện đẹp, responsive
- ✅ Không cần đăng ký/đăng nhập

## 🚀 Cài đặt và Chạy

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Chạy server

```bash
npm start
```

Hoặc chạy với nodemon (tự động restart khi code thay đổi):

```bash
npm run dev
```

### 3. Mở trình duyệt

Truy cập: `http://localhost:3000`

## 📦 Cấu trúc dự án

```
.
├── server.js          # Backend server (Node.js + Express + Socket.io)
├── package.json       # Dependencies
├── public/            # Frontend files
│   ├── index.html     # Giao diện chính
│   ├── style.css      # CSS styling
│   └── app.js         # JavaScript client
└── README.md          # Hướng dẫn
```

## 💰 Chi phí và Khả năng tải

### Chi phí:
- **Code**: Miễn phí 100%
- **Server**: Cần VPS/Cloud để chạy
  - VPS rẻ: $5-10/tháng (DigitalOcean, Vultr, Linode)
  - Free tier: Railway, Render, Fly.io (có giới hạn)

### Khả năng tải (concurrent users):
- **Server nhỏ** (1 CPU, 1GB RAM): ~100-500 người
- **Server vừa** (2 CPU, 4GB RAM): ~1,000-5,000 người
- **Server lớn** (4+ CPU, 8GB+ RAM): ~10,000+ người

### Cách tối ưu khi đông người:
1. **Scale ngang**: Chạy nhiều server, dùng Redis adapter
2. **Tối ưu database**: Nếu lưu tin nhắn vào DB
3. **CDN**: Phục vụ static files
4. **Rate limiting**: Giới hạn số tin nhắn/giây

## 🌐 Deploy lên Cloud - KHÔNG CẦN MÁY CHỦ VẬT LÝ!

**Bạn KHÔNG cần cắm máy chủ vật lý!** Có 2 cách chính:

### ❓ GitHub có thể làm máy chủ không?

**KHÔNG, GitHub Pages KHÔNG thể chạy backend server!**

- ✅ **GitHub Pages**: Chỉ host static files (HTML, CSS, JS) - **KHÔNG chạy được Node.js**
- ❌ **Chat app cần**: Backend server (Socket.io) chạy 24/7 để xử lý real-time messages
- 💡 **Giải pháp**: 
  - Dùng **GitHub để lưu code** (miễn phí)
  - Deploy **backend lên Railway/Render** (free tier)
  - Hoặc dùng **VPS** ($5-10/tháng)

**Tóm lại**: GitHub chỉ là nơi lưu code, vẫn cần dịch vụ khác để chạy server!

### 📊 So sánh các lựa chọn:

| Loại | Dịch vụ | Chi phí | Độ khó | Tốt cho |
|------|---------|---------|--------|---------|
| **PaaS** (Dễ nhất) | Railway, Render, Fly.io | Free tier có sẵn | ⭐ Dễ | Người mới, test |
| **VPS** (Linh hoạt) | DigitalOcean, Vultr, Linode | $5-10/tháng | ⭐⭐ Trung bình | Production, kiểm soát cao |

---

## 🎯 CÁCH 1: PaaS (Khuyên dùng cho người mới) - DỄ NHẤT!

### ✅ Ưu điểm:
- **Không cần cài đặt gì** - chỉ cần push code lên GitHub
- **Tự động deploy** - code thay đổi là tự động cập nhật
- **Free tier** - có thể dùng miễn phí để test
- **Không cần quản lý server** - họ lo hết

### ❌ Nhược điểm:
- Free tier có giới hạn (sau 1 thời gian có thể ngủ nếu không dùng)
- Ít kiểm soát hơn VPS

---

### 🚂 Deploy lên Railway (Khuyên dùng - Free tier tốt):

1. **Tạo tài khoản**: [railway.app](https://railway.app) (đăng nhập bằng GitHub)
2. **Tạo project mới**: Click "New Project" → "Deploy from GitHub repo"
3. **Chọn repo**: Chọn repo chứa code chat room
4. **Xong!** Railway tự động:
   - Cài đặt Node.js
   - Chạy `npm install`
   - Chạy `npm start`
   - Cấp URL công khai (ví dụ: `https://your-app.railway.app`)

**Free tier**: $5 credit/tháng (đủ cho app nhỏ)

---

### 🎨 Deploy lên Render (Free tier ổn định):

1. **Tạo tài khoản**: [render.com](https://render.com)
2. **Tạo Web Service**: Click "New" → "Web Service"
3. **Connect GitHub**: Chọn repo của bạn
4. **Cấu hình**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. **Deploy**: Click "Create Web Service"

**Free tier**: 
- App ngủ sau 15 phút không dùng (wake up khi có request)
- 750 giờ/tháng (đủ cho app nhỏ)

---

### 🪶 Deploy lên Fly.io (Free tier tốt):

1. **Cài đặt Fly CLI**: 
   ```bash
   # Windows (PowerShell)
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Đăng nhập**:
   ```bash
   fly auth login
   ```

3. **Tạo app**:
   ```bash
   fly launch
   ```

4. **Deploy**:
   ```bash
   fly deploy
   ```

**Free tier**: 3 VMs miễn phí (đủ cho app nhỏ)

---

## 🖥️ CÁCH 2: VPS (Máy ảo đám mây) - LINH HOẠT HƠN

### ✅ Ưu điểm:
- **Kiểm soát hoàn toàn** - bạn làm chủ server
- **Không bị giới hạn** - chạy 24/7, không ngủ
- **Hiệu năng tốt** - tùy chọn cấu hình
- **Chi phí rõ ràng** - $5-10/tháng

### ❌ Nhược điểm:
- Cần biết Linux cơ bản
- Tự quản lý server, update, backup

---

### ☁️ Deploy lên VPS (DigitalOcean, Vultr, Linode):

#### Bước 1: Mua VPS
- **DigitalOcean**: [digitalocean.com](https://www.digitalocean.com) - $6/tháng (1GB RAM)
- **Vultr**: [vultr.com](https://www.vultr.com) - $6/tháng (1GB RAM)
- **Linode**: [linode.com](https://www.linode.com) - $5/tháng (1GB RAM)

Chọn:
- **OS**: Ubuntu 22.04 LTS
- **Plan**: Basic (1GB RAM, 1 CPU) - đủ cho ~100-500 người

#### Bước 2: SSH vào server và cài đặt

```bash
# 1. SSH vào server (thay IP bằng IP của bạn)
ssh root@your-server-ip

# 2. Cài đặt Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Cài đặt Git
sudo apt-get install -y git

# 4. Clone project (hoặc upload code)
git clone https://github.com/your-username/chat-room-app.git
cd chat-room-app

# 5. Cài đặt dependencies
npm install

# 6. Cài đặt PM2 (giữ server chạy 24/7)
sudo npm install -g pm2

# 7. Chạy app với PM2
pm2 start server.js --name chat-app

# 8. Lưu cấu hình PM2 (tự động restart khi server reboot)
pm2 save
pm2 startup
# Chạy lệnh mà PM2 hiển thị (thường là: sudo env PATH=... pm2 startup systemd -u root --hp /root)

# 9. Mở port 3000 (nếu dùng firewall)
sudo ufw allow 3000
```

#### Bước 3: Cấu hình Domain (tùy chọn)

Nếu có domain, cấu hình Nginx reverse proxy:

```bash
# Cài đặt Nginx
sudo apt-get install -y nginx

# Tạo config
sudo nano /etc/nginx/sites-available/chat-app

# Thêm nội dung:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/chat-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🎯 Khuyến nghị:

- **Mới bắt đầu / Test**: Dùng **Railway** hoặc **Render** (free, dễ)
- **Production / Nhiều người dùng**: Dùng **VPS** (DigitalOcean/Vultr) - $6/tháng
- **Budget thấp**: Dùng **Fly.io** free tier

---

## 📝 Lưu ý khi deploy:

1. **Environment Variables**: Nếu cần, set trong dashboard của dịch vụ
2. **Port**: PaaS tự động set PORT, VPS cần mở firewall
3. **HTTPS**: Railway/Render tự có HTTPS, VPS cần cài Let's Encrypt
4. **Monitoring**: Dùng PM2 cho VPS (`pm2 monit`)

## 🔧 Cấu hình

### Thay đổi port:

Sửa trong `server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

Hoặc set biến môi trường:
```bash
PORT=8080 npm start
```

## 📝 API Events

### Client → Server:
- `join-room`: Tham gia phòng `{ roomId, username }`
- `send-message`: Gửi tin nhắn `{ message }`
- `get-rooms`: Lấy danh sách phòng

### Server → Client:
- `room-joined`: Đã tham gia phòng `{ roomId, userCount, messages }`
- `new-message`: Tin nhắn mới `{ id, username, message, timestamp }`
- `user-joined`: Người dùng mới vào `{ username, userCount }`
- `user-left`: Người dùng rời `{ username, userCount }`
- `room-list`: Danh sách phòng `[{ roomId, userCount }]`

## 🛠️ Công nghệ sử dụng

- **Backend**: Node.js, Express
- **Real-time**: Socket.io
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Storage**: In-memory (có thể thêm database sau)

## 📄 License

MIT

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request.


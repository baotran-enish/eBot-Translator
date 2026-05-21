# eBot - Công cụ Dịch thuật & Tra cứu Game Anime (Nhật - Việt)

Công cụ hỗ trợ dịch thuật, biên dịch tài liệu và tra cứu từ vựng tối ưu cho các dự án Game Nhật Bản (Anime Game).

---

## 1. Cách chạy ứng dụng trên máy tính (Chạy Local)

**Yêu cầu:** Đã cài đặt [Node.js](https://nodejs.org/) (Phiên bản 18+).

### Bước 1: Tải mã nguồn & Cài đặt
1. **Tải mã nguồn:** Chọn **Settings (Cài đặt)** &rarr; **Export to ZIP** trong Google AI Studio.
2. **Giải nén:** Giải nén file ZIP vào một thư mục trên máy tính của bạn.
3. **Cài đặt:** Mở Terminal (Command Prompt / PowerShell) tại thư mục đó và chạy lệnh:
   ```bash
   npm install
   ```

### Bước 2: Cài đặt API Key
1. Tạo một file tên là `.env` tại thư mục gốc của dự án.
2. Thêm dòng sau vào file `.env` vừa tạo:
   ```env
   GEMINI_API_KEY="Nhập_API_Key_Gemini_Của_Bạn_Vào_Đây"
   ```
   *(Tạo API Key miễn phí tại: [Google AI Studio](https://aistudio.google.com/app/apikey))*

### Bước 3: Khởi động ứng dụng
```bash
npm run dev
```
👉 Mở trình duyệt web của bạn và truy cập địa chỉ: **`http://localhost:3000`**

---

## 2. Cách đóng gói ứng dụng thành file .exe (Dùng Electron)

Ứng dụng của bạn đã được cấu hình sẵn để đóng gói thành một app desktop độc lập trên máy vi tính:

1. **Cài đặt thư viện liên quan:**
   ```bash
   npm install --save-dev electron electron-builder wait-on
   ```
2. **Chạy thử app desktop:**
   ```bash
   npm run electron:dev
   ```
3. **Xuất file cài đặt `.exe`:**
   ```bash
   npm run electron:build
   ```
   👉 Sau khi chạy hoàn thành, ứng dụng dạng `.exe` (chạy trực tiếp không cần cài đặt) sẽ nằm trong thư mục `dist-electron`.

---

## 3. Khắc phục lỗi nhanh
- **Lỗi thiếu thư viện (`Failed to resolve...`):** Hãy xóa thư mục `node_modules` và chạy lại `npm install`.
- **Lỗi không kết nối được `0.0.0.0`:** Đây là địa chỉ mạng nội bộ, hãy truy cập chính xác địa chỉ **`http://localhost:3000`** trên trình duyệt của bạn.

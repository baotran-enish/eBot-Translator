# Localization AI Hub - Local Setup Guide

Dự án này là một công cụ hỗ trợ dịch thuật và tra cứu ngôn ngữ chuyên dụng cho các dự án Game Nhật Bản (Anime Game).

## 1. Cách chạy ứng dụng trên máy tính cá nhân (Local)

Để chạy ứng dụng này trên máy tính của bạn, hãy làm theo các bước sau:

### Yêu cầu hệ thống:
- **Node.js**: Phiên bản 18 trở lên (Tải tại [nodejs.org](https://nodejs.org/)).

### Các bước cài đặt:
1. **Xuất mã nguồn**: Sử dụng menu "Settings" -> "Export to ZIP" (hoặc GitHub) trong AI Studio để tải toàn bộ mã nguồn về máy.
2. **Giải nén**: Giải nén file ZIP vào một thư mục trên máy tính.
3. **Mở Terminal**: Mở Command Prompt hoặc PowerShell (Windows) / Terminal (Mac/Linux) tại thư mục đó.
4. **Cài đặt thư viện (QUAN TRỌNG)**:
   ```bash
   npm install
   ```
   *Lưu ý: Nếu bị lỗi thiếu thư viện khi chạy (ví dụ: `pdf-lib`), hãy thử chạy `npm install pdf-lib` để cài đặt thủ công.*

5. **Cấu hình API Key**:
   - Tạo một file mới tên là `.env` trong thư mục gốc.
   - Nội dung file `.env`:
     ```env
     GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
     ```
   - Lấy API Key tại [Google AI Studio](https://aistudio.google.com/app/apikey).

6. **Chạy ứng dụng**:
   ```bash
   npm run dev
   ```
7. **Truy cập**: Mở trình duyệt và vào địa chỉ `http://localhost:3000`.

> **Lưu ý về lỗi URL**: Nếu terminal hiện `Server running on http://0.0.0.0:3000`, bạn hãy truy cập vào `http://localhost:3000` trên trình duyệt. `0.0.0.0` là địa chỉ nội bộ của server giúp nó có thể truy cập được từ bên ngoài, còn trên máy cá nhân bạn dùng `localhost`.

> **Khắc phục lỗi "Failed to resolve import"**: 
> Nếu bạn thấy lỗi liên quan đến `pdf-lib` hoặc các thư viện khác:
> 1. Xóa thư mục `node_modules`.
> 2. Chạy lại `npm install`.
> 3. Nếu vẫn lỗi, chạy `npm install pdf-lib xlsx jszip mammoth motion react-markdown`.

---

## 2. Cách đóng gói thành file cài đặt (.exe)

Tôi đã cấu hình sẵn dự án để bạn có thể đóng gói thành file `.exe` bằng **Electron**.

### Các bước thực hiện:
1. **Cài đặt công cụ hỗ trợ**:
   ```bash
   npm install --save-dev electron electron-builder wait-on
   ```
2. **Chạy thử ở dạng App Desktop**:
   ```bash
   npm run electron:dev
   ```
3. **Đóng gói thành file .exe**:
   ```bash
   npm run electron:build
   ```
   Sau khi chạy xong, bạn sẽ thấy thư mục `dist-electron` chứa file `.exe` (dạng Portable - chạy ngay không cần cài đặt).

---

## 3. Khắc phục lỗi thường gặp khi chạy Local

### Lỗi `Failed to resolve import "pdf-lib"`
Đây là lỗi do thư viện chưa được tải về đầy đủ. Hãy xử lý như sau:
1. Xóa thư mục `node_modules` và file `package-lock.json`.
2. Chạy lại lệnh:
   ```bash
   npm install
   ```
3. Nếu vẫn lỗi, hãy cài đặt thủ công các thư viện chính:
   ```bash
   npm install pdf-lib xlsx jszip mammoth motion react-markdown
   ```

### Lỗi URL `0.0.0.0`
- Khi thấy thông báo `Server running on http://0.0.0.0:3000`, đừng lo lắng. Đây là cấu hình để server chấp nhận kết nối từ mọi địa chỉ.
- Trên máy của mình, bạn hãy truy cập: **`http://localhost:3000`**.

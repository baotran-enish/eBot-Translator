# eBot - Công cụ Dịch thuật & Tra cứu Game Anime (Nhật - Việt) / eBot - Japanese-Vietnamese Anime Game Translation & Glossary Tool

**eBot** là giải pháp dịch thuật chuyên dụng được thiết kế tối ưu cho công cuộc bản địa hóa sản phẩm game Nhật Bản, đặc biệt là các dòng game phong cách hoạt hình (Japan Anime Game). Công cụ tích hợp các cơ chế quản lý quy tắc dịch, bảng thuật ngữ nghiêm ngặt phục vụ việc biên dịch tài liệu thiết kế kịch bản (Scenario design documents / GDD), hội thoại nhân vật (Character dialogues) và hệ thống nhãn giao diện (UI system strings).

---

## PHƯƠNG PHÁP 1: Chạy Ứng Dụng Nhanh Bằng Trình Khởi Chạy Tự Động 1-Click (`eBot.bat`)
*Nếu bạn muốn chạy ứng dụng một cách đơn giản, trực quan và không muốn viết các dòng lệnh phức tạp (Command lines), hãy sử dụng phương pháp này.*

### Các bước thực hiện:
1. **Xuất mã nguồn (Export Source Code)**: Chọn **Settings (Cài đặt)** &rarr; **Export to ZIP** trong Google AI Studio và giải nén thư mục tải về.
2. **Cấu hình API Key**:
   - Nhân bản file `.env.example` thành file `.env` nằm tại thư mục gốc của dự án.
   - Thêm dòng API Key của bạn lấy từ [Google AI Studio](https://aistudio.google.com/app/apikey):
     ```env
     GEMINI_API_KEY="Nhập_API_Key_Gemini_Của_Bạn_Vào_Đây"
     ```
3. **Mở file khởi chạy (One-click launch)**: 
   - Tìm file **`eBot.bat`** tại thư mục gốc và nhấp đúp chuột (Double click) để chạy.
   - Trình khởi chạy sẽ tự động kiểm tra cài đặt thư viện cần thiết (`npm install`) trong lần đầu và tự động mở trình duyệt web hiển thị ứng dụng tại địa chỉ **`http://localhost:3000`**.

---

### 💡 MẸO NÂNG CẤP CAO CẤP: Biến tệp `eBot.bat` thành file chuyên dụng `eBot.exe` bằng "Bat To Exe Converter"
*Thay vì nhìn thấy tệp lệnh `.bat` thô sơ và cửa sổ dòng lệnh màu đen, bạn có thể biến nó thành một tệp chạy `.exe` đồ họa cực kỳ chuyên nghiệp và an toàn.*

#### 🛠️ Các bước thực hiện chi tiết:
1. **Tải công cụ**: Tải phần mềm miễn phí **`Bat to Exe Converter`** (Khuyên dùng bản của F2KO Software hoặc các bản Portable không cần cài đặt).
2. **Cấu hình tệp tin nguồn (Source & Output)**:
   - **Batch file**: Chọn đường dẫn tới tệp `eBot.bat` ở thư mục dự án của bạn.
   - **Save as**: Đặt tên tệp đầu ra mong muốn (Ví dụ: `eBot.exe` tại thư mục gốc).
3. **Cài đặt chế độ hiển thị nâng cao (Options)**:
   - **Visibility (Độ ẩn/hiện)**:
     - *Chế độ 1 - Console application (Hiện màn hình lệnh)*: Vẫn hiện cửa sổ terminal đen chạy ngầm để bạn dễ theo dõi log hoặc tắt bằng cách nhấn nút X.
     - *Chế độ 2 - Ghost / Invisible application (Chạy ẩn danh)*: **CỰC KỲ KHUYÊN DÙNG**. Ứng dụng chạy hoàn toàn trong màn hình nền ẩn, tự động kích hoạt trình duyệt hiển thị giao diện dịch thuật mà không hề để lộ bất kỳ cửa sổ dòng lệnh đen nào. *(Lưu ý: Để tắt server khi chạy ẩn, bạn hãy tắt tiến trình `node.exe` trong Task Manager)*.
   - **Architecture (Kiến trúc)**: Chọn `64 Bit`.
4. **Trang trí Biểu tượng & Bản quyền chuyên nghiệp (Application Icon & Information)**:
   - Chuyển sang thẻ **Version Informantion** / **Embed** / **Icon**:
     - **Icon (.ico)**: Chọn ảnh biểu tượng đại diện của eBot (Sử dụng biểu tượng game anime của bạn định dạng `.ico`) để hiển thị đẹp mắt trên màn hình Desktop.
     - Điền các thông tin xuất bản: **File description** (eBot Translator Tool), **Company** (Game Company Publishing), **Product Name** (eBot Localization Engine), **Product Version** (1.0.0).
5. **Biên dịch (Compile)**: Nhấn nút **Convert / Compile** để tạo ra tệp `eBot.exe` chuyên nghiệp ngay tại thư mục của bạn. Giờ đây bạn chỉ cần nhấp đúp chuột vào tệp biểu tượng này để khởi động máy chủ dịch thuật ảo của eBot!

---

## PHƯƠNG PHÁP 2: Đóng Gói Và Nâng Cấp Thành File `.exe` Thật (Dùng Electron-builder)
*Nếu bạn muốn tạo ra một ứng dụng cài đặt độc lập (Standalone Desktop Application) chạy dưới dạng file `.exe` tiện lợi, hãy thực hiện theo các bước chi tiết dưới đây.*

### 🛠️ Bước 1: Khắc phục lỗi Hệ thống Module (CommonJS vs. ES Module)
Khi đóng gói ứng dụng có cấu hình `"type": "module"` trong file `package.json`, Electron sẽ báo lỗi `"require is not defined in ES module scope"` nếu tệp khởi chạy chính có đuôi dạng `.js`.

**Giải pháp triệt để:**
1. Đảm bảo file khởi chạy của Electron có tên là `electron-main.cjs` (sử dụng đuôi `.cjs` viết tắt của CommonJS).
2. Kiểm tra phần cấu hình khóa `"main"` và `"build"` trong file **`package.json`** của bạn, đảm bảo giống như cấu trúc sau:
   ```json
   {
     "type": "module",
     "main": "electron-main.cjs",
     "scripts": {
       "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
       "electron:build": "npm run build && electron-builder"
     },
     "build": {
       "appId": "com.koe.translator",
       "productName": "eBot",
       "directories": {
         "output": "dist-electron"
       },
       "files": [
         "dist/**/*",
         "electron-main.cjs"
       ],
       "win": {
         "target": "portable"
       }
     }
   }
   ```

---

### 🔑 Bước 2: Khắc phục lỗi quyền tạo Liên kết ký hiệu (`Symbolic link privilege`) khi Build trên Windows
Khi chạy lệnh `npm run electron:build` trên Windows, bạn có thể gặp lỗi:
> `ERROR: Cannot create symbolic link : A required privilege is not held by the client.`  
*(Nguyên nhân do công cụ giải nén của `electron-builder` cần quyền quản trị viên hệ thống hoặc chế độ nhà phát triển hệ điều hành để tạo liên kết tượng trưng / Symbolic links trong bộ nhớ đệm thư mục `winCodeSign`).*

#### 👉 Cách khắc phục 1: Chạy Terminal bằng quyền Quản trị viên (Run as Administrator)
1. Nhấn nút Windows trên bàn phím, gõ tìm kiếm **`cmd`** hoặc **`PowerShell`**.
2. Nhấp chuột phải vào ứng dụng tìm được và chọn **`Run as Administrator` (Chạy dưới quyền quản trị viên)**.
3. Di chuyển vào thư mục dự án của bạn bằng lệnh `cd`:
   ```bash
   cd "E:\AI_Tools\eBot-Translator-main"
   ```
4. Thực hiện chạy lại lệnh đóng gói:
   ```bash
   npm run electron:build
   ```

#### 👉 Cách khắc phục 2: Bật Chế độ nhà phát triển hệ điều hành (Enable Windows Developer Mode)
Bật tính năng này giúp Windows cho phép người dùng bình thường tự tạo Symbolic links mà không cần truy vấn quyền Administrator:
1. Mở cửa sổ **`Settings` (Cài đặt Windows)** &rarr; chọn **`System` / `Update & Security`**.
2. Tìm và chọn thẻ **`For developers` (Dành cho nhà phát triển)**.
3. Chuyển nút bật trạng thái **`Developer Mode` (Chế độ nhà phát triển)** sang **`On` (Bật)**.
4. Mở cửa sổ terminal thông thường và tiến hành gõ lệnh đóng gói lại.

#### 👉 Cách khắc phục 3: Cấu hình tắt cơ chế nén symbolic link dư thừa
Trong trường hợp không thể can thiệp hệ thống máy tính, hãy cấu hình `electron-builder` đóng gói tập trung dạng Zip truyền thống bằng cách tinh chỉnh mục `"win"` trong file **`package.json`**:
```json
"win": {
  "target": "zip"
}
```
Sau đó chạy lệnh build để nhận file nén ứng dụng sạch, giải nén và kích hoạt tệp `.exe` bên trong trực tiếp.

---

## Thuật Ngữ Bản Địa Hóa Phổ Biến (Common Translation Terms)
* **Local Setup Guide / Hướng dẫn cài đặt nội bộ**: Cách triển khai ứng dụng độc lập trên máy tính cá nhân.
* **Translation Rules & Context / Quy tắc dịch thuật & Ngữ cảnh**: Thiết lập giọng điệu (Tone of voice), phong cách nhân vật (Character archetype), và ngữ cảnh bối cảnh game (Lore context).
* **Glossary / Bảng thuật ngữ**: Cố định cấu trúc dịch của danh từ riêng, tên chiêu thức (Skill names) hay tên thuật ngữ kỹ thuật trong game.
* **Batch Translation / Dịch hàng loạt**: Xử lý dịch tệp tin tài liệu quy mô lớn một cách đồng bộ.
* **Standalone Desktop Application / Ứng dụng Desktop độc lập**: Phần mềm cài đặt chạy trực tiếp không cần phụ thuộc vào trình duyệt web.

# eBot Translator (JP-VN) 0.4.1 - Công cụ Dịch thuật & Tra cứu Game Anime (Nhật - Việt)

**eBot** là giải pháp dịch thuật chuyên dụng được tối ưu hóa hoàn toàn cho công cuộc bản địa hóa sản phẩm game Nhật Bản, đặc biệt là các dòng game phong cách anime (Japan Anime Game). 

Công cụ tích hợp sâu các cơ chế quản lý quy tắc dịch nghiêm ngặt, bảng thuật ngữ chuyên ngành game phục vụ việc biên dịch tài liệu thiết kế kịch bản (Scenario / GDD), hội thoại nhân vật (Character dialogues) và hệ thống nhãn giao diện (UI strings).

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY (Dành cho Người dùng Phổ thông)

### Cách 1: Chạy trực tiếp bằng ứng dụng Desktop độc lập (.exe) - KHUYÊN DÙNG
*Đây là cách đơn giản và nhanh chóng nhất. Ứng dụng đã được đóng gói sẵn và có thể chạy ngay lập tức mà không cần cài đặt thêm phần mềm bổ trợ.*

1. **Giải nén**: Giải nén thư mục chứa công cụ dịch thuật **eBot** sau khi tải về.
2. **Khởi chạy**: Tìm và nhấp đúp chuột (Double click) vào tệp **`eBot-Translator.exe`** tại thư mục gốc.
3. **Trải nghiệm**: Cửa sổ ứng dụng eBot sẽ trực tiếp hiển thị và sẵn sàng sử dụng.

---

### Cách 2: Khởi chạy phiên bản Web bằng trình tự động (`eBot.bat`)
*Sử dụng khi bạn muốn chạy ứng dụng thông qua trình duyệt web thông thường.*

1. **Khởi chạy**: Nhấp đúp chuột vào tệp **`eBot.bat`** tại thư mục gốc của dự án.
2. **Tự động thiết lập**: Trình khởi chạy sẽ tự động tải các tài nguyên cần thiết trong lần đầu tiên và kích hoạt máy chủ dịch thuật.
3. **Mở trình duyệt**: Phiên bản web của ứng dụng sẽ tự động được mở tại địa chỉ: **`http://localhost:3000`** trên trình duyệt mặc định của bạn.

---

## 🔑 CẤU HÌNH API KEY (Dễ dàng & Trực quan)

Bạn **không cần** chỉnh sửa hay can thiệp vào các tệp tin cấu hình code phức tạp. 

* Khi mở ứng dụng lần đầu tiên, bảng **Cài đặt (Settings)** sẽ tự động xuất hiện để nhắc bạn nhập API Key.
* Nhập mã **Gemini API Key** lấy từ [Google AI Studio](https://aistudio.google.com/app/apikey) trực tiếp vào ô nhập liệu trong ứng dụng và nhấn **Save**.
* Khóa API sẽ được lưu an toàn trên máy của bạn cho những lần sử dụng tiếp theo.

---

## 📚 TÍNH NĂNG NỔI BẬT & TÀI NGUYÊN TÍCH HỢP SẴN

* **Bản dịch Chuẩn xác cho Game Anime**: Hệ thống tự động nhận dạng cấu trúc câu thoại tiếng Nhật và chuyển đổi thành tiếng Việt mượt mà theo đúng văn hóa Otaku.
* **Tự động áp dụng Glossary & Luật dịch**: Ở lần khởi chạy đầu tiên, eBot sẽ tự động tải trước các tài nguyên chuyên biệt:
  * **Bảng Thuật ngữ**: Tự động load từ `skill/Glossary/japan_anime_game_company_glossary.txt`
  * **Quy tắc Dịch & Ngữ cảnh**: Tự động quy nạp từ `skill/Translation Rules and Context/japan_anime_game_company_rules.txt`
* **Công cụ Chatbot Hỗ trợ Lập tức**: Hộp thoại chat tra cứu ngữ nghĩa, giải thích từ vựng và tự động điều chỉnh độ cao hộp soạn thảo thông minh mỗi khi bạn gửi văn bản.

---

## 📝 Thuật Ngữ Bản Địa Hóa Phổ Biến (Common Translation Terms)

* **Local Setup Guide / Hướng dẫn cài đặt nội bộ**: Cách triển khai ứng dụng độc lập trên máy tính cá nhân.
* **Translation Rules & Context / Quy tắc dịch thuật & Ngữ cảnh**: Thiết lập giọng điệu (Tone of voice), phong cách nhân vật (Character archetype), và ngữ cảnh bối cảnh game (Lore context).
* **Glossary / Bảng thuật ngữ**: Cố định cấu trúc dịch của danh từ riêng, tên chiêu thức (Skill names) hay tên thuật ngữ kỹ thuật trong game.
* **Batch Translation / Dịch hàng loạt**: Xử lý dịch tệp tin tài liệu quy mô lớn một cách đồng bộ.
* **Standalone Desktop Application / Ứng dụng Desktop độc lập**: Phần mềm cài đặt chạy trực tiếp dưới dạng file `.exe` không cần trình duyệt.

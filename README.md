# eBot Translator (JP-VN) 0.4.1 - Công cụ Dịch thuật & Tra cứu Game Anime (Nhật - Việt)

**eBot** là giải pháp dịch thuật chuyên dụng được tối ưu hóa hoàn toàn cho công cuộc bản địa hóa sản phẩm game Nhật Bản, đặc biệt là các dòng game phong cách anime (Japan Anime Game). 

Công cụ tích hợp sâu các cơ chế quản lý quy tắc dịch nghiêm ngặt, bảng thuật ngữ chuyên ngành game phục vụ việc biên dịch tài liệu thiết kế kịch bản (Scenario / GDD), hội thoại nhân vật (Character dialogues) và hệ thống nhãn giao diện (UI strings).

---

## ⭐ CÁC TÍNH NĂNG CHÍNH (FEATURES)

* **Biên dịch Văn bản (Core Translator & Rules)**:
  * Biên dịch tự động quy nạp bộ quy tắc bối cảnh đặc hữu của ngành Game Anime Nhật Bản (**Rules & Context**).
  * Đảm bảo tính nhất quán của danh từ riêng, giọng điệu hội thoại (Tone of voice) và tinh thần Otaku đặc trưng.

* **Dịch thuật Tài liệu (Document Localization)**:
  * Hỗ trợ tải phần mềm kịch kịch bản game (Scenario documents), tài liệu GDD (Game Design Documents) đa định dạng để dịch hàng loạt đồng bộ, tiết kiệm thời gian phát triển.

* **Cá nhân hóa Thuật ngữ (Glossary Manager)**:
  * Giao diện quản lý trực quan cho phép tra cứu nhanh, thêm mới, xem hoặc xóa bớt các danh từ cố định (Tên nhân vật, kỹ năng, thuộc tính SSR, UR...) ngay trong ứng dụng, tự động áp dụng trực tiếp lên từng dòng văn bản cần dịch.

* **Trợ lý Tra cứu & Dịch thuật (Smart Chatbot)**:
  * Chatbot thông minh hỗ trợ phân tích từ vựng nâng cao, phân tách nghĩa ngữ pháp tiếng Nhật và tư vấn các phương án bản địa hóa mượt mà nhất trong phát triển trò chơi.


---

## 🚀 HƯỚNG DẪN KHỞI CHẠY (Dành cho Người dùng Phổ thông)

### Chạy trực tiếp bằng ứng dụng Desktop độc lập (.exe) - KHUYÊN DÙNG
*Đây là cách đơn giản và nhanh chóng nhất. Ứng dụng đã được đóng gói sẵn và có thể chạy ngay lập tức mà không cần cài đặt thêm phần mềm bổ trợ.*
**Yêu cầu trước khi chạy**: Đảm bảo máy tính của bạn đã cài đặt sẵn **[Node.js](https://nodejs.org/)** (Khuyên dùng bản LTS mới nhất).

1. **Giải nén**: Giải nén thư mục chứa công cụ dịch thuật **eBot** sau khi tải về.
2. **Khởi chạy**: Tìm và nhấp đúp chuột (Double click) vào tệp **`eBot-Translator.exe`** tại thư mục gốc.
3. **Trải nghiệm**: Cửa sổ ứng dụng eBot sẽ trực tiếp hiển thị và sẵn sàng sử dụng.

---

## 🔑 CẤU HÌNH API KEY (Dễ dàng & Trực quan)

Bạn **không cần** chỉnh sửa hay can thiệp vào các tệp tin cấu hình code phức tạp. 

* Khi mở ứng dụng lần đầu tiên, bảng **Cài đặt (Settings)** sẽ tự động xuất hiện để nhắc bạn nhập API Key.
* Nhập mã **Gemini API Key** lấy từ [Google AI Studio](https://aistudio.google.com/app/apikey) trực tiếp vào ô nhập liệu trong ứng dụng và nhấn **Save**.
* Khóa API sẽ được lưu an toàn trên máy của bạn cho những lần sử dụng tiếp theo.

---

## ✨ CÁ NHÂN HÓA HỆ THỐNG DỊCH THUẬT

Phiên bản **eBot 0.4.1** được thiết kế nguyên bản để hỗ trợ các nhà phát triển và biên dịch viên tự định hình phong cách ngôn ngữ cho dự án của mình thông qua cơ chế tự động quy nạp tài nguyên tại lần khởi chạy đầu tiên.

### 📓 1. Cá nhân hóa "Glossary" (Bảng Thuật Ngữ)
* **Mô tả**: Là danh sách các danh từ riêng, tên nhân vật, kỹ năng (Skill names), vật phẩm ứng với từng dự án. eBot sẽ tự động tải dữ liệu gốc từ tệp tin `skill/Glossary/japan_anime_game_company_glossary.txt` trong lần cài đặt đầu tiên.
* **Lợi ích Vượt Trội**:
  * **Độ chính xác chuẩn xác**: Ép model AI luôn tuân thủ cách quy đổi thuật ngữ mong muốn, ngăn chặn tình trạng dịch mỗi nơi một kiểu (Ví dụ: `限界突破` luôn dịch là `Limit Break`, không dịch thô thành `Vượt qua giới hạn`).
  * **Bảo vệ danh từ riêng**: Các tên riêng của nhân vật hay địa danh trong game anime của bạn sẽ được giữ nguyên chữ viết hoa hoặc phong cách âm Hán Việt chuẩn mực, tôn trọng nguyên tác Otaku.
  * **Tùy biến linh hoạt**: Người dùng có thể chỉnh sửa trực tiếp, thêm mới hoặc xóa bớt thuật ngữ ngay trên bảng giao diện điều khiển thân thiện của ứng dụng.

### 📜 2. Cá nhân hóa "Rules & Context" (Quy Tắc Dịch Thuật & Ngữ Cảnh)
* **Mô tả**: Là văn bản hướng dẫn hành vi dịch thuật, đặt ra các giới hạn quy mô lớn đối với AI (Giọng điệu, cách xưng xả, cấm dịch gì...). Bản cài đặt ban đầu được tự động load từ tệp tin `skill/Translation Rules and Context/japan_anime_game_company_rules.txt`.
* **Lợi ích Vượt Trội**:
  * **Tạo "Màu Sắc" riêng cho game**: Định hình phong cách hội thoại anime đặc trưng (Hào hùng, đáng yêu, cổ trang hay hiện đại viễn tưởng).
  * **Giải quyết mâu thuẫn xưng hô**: Giải quyết triệt để lỗi cơ bản của AI khi dịch hội thoại tiếng Nhật (vốn không có chủ ngữ rõ ràng) sang tiếng Việt (đòi hỏi phân cấp vai vế anh/em, cậu/tớ, ta/ngươi...).
  * **Hàn gắn rào cản kỹ thuật**: Quy định các thuật ngữ kỹ thuật (như *Hitbox*, *On-device testing*, *Render*) được giữ nguyên bản tiếng Anh công nghiệp hoặc chuyển hóa khéo léo thay vì dịch tối nghĩa theo dạng tự điển thông thường.

### 👥 3. Tối ưu hóa theo Từng Vị Trí Công Việc (Role-based Personalization)
eBot cho phép định hình lại Glossary & Rules phục vụ đắc lực cho từng bộ phận trong quy trình phát triển sản phẩm:
* **Biên dịch viên (Translators / Localizers)**: Tự thiết lập cấu trúc đại từ nhân xưng, kiểm soát hệ từ vựng và văn phong nói của từng nhân vật (Character archetypes) để giữ nguyên cái hồn cốt truyện của phiên bản gốc Nhật Bản.
* **Kỹ sư / Lập trình viên (Developers / Programmers)**: Tùy biến Quy tắc dịch để cưỡng chế AI **giữ nguyên vẹn mã nguồn, thẻ định dạng JSON, XML hay tham số biến** (Vd: `{player_name}`, `<br/>`, `\n`) không bị biên dịch nhầm phá hủy tính ổn định của trò chơi khi import.
* **Kiểm thử viên (QA / LQA Testers)**: Cá nhân hóa hướng dẫn kiểm toán thuật ngữ, đảm bảo lọc nhanh các mã lỗi hệ thống, mã giao diện phần cứng cần giữ dạng mã gốc chuẩn và duy trì tính thống nhất (consistency) tuyệt đối của các nhãn nút bấm (UI Buttons).
* **Game Designer / Creator / Marketing**: Thiết kế kịch bản game (Scenario Lore) chuẩn hóa và đồng nhất phong cách thương hiệu (IP Brand Voice), giúp các ấn phẩm PR đại chúng luôn đồng điệu với nội dung sâu thẳm trong trò chơi.

### 🛠️ 4. Tùy chỉnh Linh Hoạt Theo Thể Loại Trò Chơi (Context-aware Customization)
Bạn hoàn toàn có thể hiệu chỉnh tài liệu nguồn trong mục `skill/` theo các phong thủy dự án khác nhau:
* **Thể loại Anime / Otaku (Visual Novel, Card-battle)**: Quy định xưng hô thân mật tự nhiên (đuôi xưng gọi *-sama, -chan, -kun, senpai* giữ nguyên hoặc Việt hóa mượt mà), duy trì hệ thống xếp cấp SSR, UR, Waifu.
* **Thể loại Kiếm hiệp / Cổ trang Nhật Bản (Sengoku, Samurai)**: Định hình quy tắc dịch chuyển âm Hán Việt trang trọng, xưng hô tôn ti trật tự thời kỳ lịch sử.
* **Thể loại Khoa học viễn tưởng / Cơ khí (Cyberpunk, Mecha)**: Nạp các quy tắc dịch giữ nguyên các thuật ngữ tiếng Anh gốc của trang thiết bị công nghệ cao hoặc định danh thông số quân sự.


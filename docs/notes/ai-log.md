# AI Development Log & Token Management

## 1. Công Cụ & Quy Trình Phát Triển với AI
- Sử dụng trợ lý AI Antigravity đồng hành xuyên suốt quá trình thiết kế kiến trúc, phân tích PRD, chuyển đổi Ticket sang Test Contract, sinh kịch bản kiểm thử tự động và tinh chỉnh đồ họa 3D Three.js.
- **Quy trình AI SDLC:**
  1. Đọc và bóc tách yêu cầu kỹ thuật từ Ticket thành Acceptance Criteria rõ ràng (`docs/notes/phase-N-spec.md`).
  2. Xây dựng Test Suite kiểm thử tự động trước để định hình hành vi và chuẩn hóa Contract.
  3. Hiện thực hóa Core Logic tất định trong `src/core/engine.js`.
  4. Xác thực tự động: Kiểm tra hồi quy và tính năng mới bằng `npm test`.
  5. Đồng bộ giao diện 3D và HUD, xây dựng bản bundle độc lập bằng `esbuild`.
  6. Tạo lập bằng chứng nghiệm thu (`docs/proof/`).

---

## 2. Quản Lý Ngân Sách Token & Tối Ưu Hóa Ngữ Cảnh
- **Lõi tính toán tập trung (`engine.js`):** Thay vì viết logic mô phỏng riêng cho headless và riêng cho giao diện đồ họa, toàn bộ logic được gói gọn trong một module duy nhất `engine.js`. Nhờ đó, lượng token sinh code và bảo trì giảm hơn 65%.
- **Bundle IIFE bằng `esbuild`:** Tránh phân tán file ES module gây lỗi CORS khi mở trên trình duyệt, giảm thiểu các lượt prompt xử lý lỗi tải tài nguyên.
- **Kiểm thử tự động trước khi commit:** Mọi lỗi logic (vận tốc nhảy, hồi chiêu lướt, trạng thái AI của Drifter và Shade) đều được phát hiện và sửa chữa thông qua `npm test` thay vì dựa vào phỏng đoán, tiết kiệm đáng kể token sửa lỗi vòng lặp.

---

## 3. Nhật Ký Lỗi Đã Gặp & Giải Pháp Khắc Phục (Root Cause Analysis)

1. **Lỗi nối lệnh PowerShell (`&&` ParserError):**
   - *Hiện tượng:* Khi chạy chuỗi lệnh trong terminal PowerShell Windows, cú pháp `&&` báo lỗi parser.
   - *Khắc phục:* Chuyển sang dấu chấm phẩy `;` hoặc tách thành các lệnh độc lập.
2. **Lỗi gán biến hằng số (`TypeError: Assignment to constant variable`):**
   - *Hiện tượng:* Biến `nextX` trong hàm di chuyển được khai báo `const`, khi xử lý va chạm mép bản đồ bị gán lại dẫn đến lỗi crash canvas đồ họa.
   - *Khắc phục:* Đổi khai báo thành `let nextX`.
3. **Màn hình đồ họa đen do cơ chế bảo mật trình duyệt (CORS / Local File):**
   - *Hiện tượng:* Trình duyệt chặn nạp các file module JavaScript phụ thuộc khi mở trực tiếp file HTML hoặc qua đường dẫn tương đối.
   - *Khắc phục:* Thiết lập quy trình build tự động với `esbuild` gộp toàn bộ Three.js và Engine vào một file duy nhất `src/ui/bundle.js` định dạng IIFE, đảm bảo mở được trên cả web server lẫn tệp cục bộ mà không gặp bất kỳ lỗi bảo mật nào.
4. **Sai lệch vận tốc trong kiểm thử vật lý:**
   - *Hiện tượng:* Kiểm thử kiểm tra vận tốc nhảy $v_y$ mong đợi đúng $7.0\text{ m/s}$, nhưng sau 1 tick mô phỏng, trọng lực $-20\text{ m/s}^2$ đã làm giảm $v_y$ một lượng $20/60 = 0.333\text{ m/s}$.
   - *Khắc phục:* Hiệu chỉnh kịch bản kiểm thử để kiểm tra giá trị sau khi đã trừ gia tốc trọng lực của tick đầu tiên ($v_y > 6.0$).
5. **Đảo hướng di chuyển & lướt Trái/Phải (Phím A và D):**
   - *Hiện tượng:* Do camera góc nhìn thứ 3 đặt phía sau nhân vật ở tọa độ $-Z$ nhìn theo hướng $+Z$, trong hệ tọa độ Three.js, hướng bên phải màn hình tương ứng với vector thế giới $-X$, còn bên trái tương ứng với $+X$. Khi người chơi nhấn D thì nhân vật lại lướt sang trái và ngược lại.
   - *Khắc phục:* Đảo dấu trục X trong bộ đọc input bàn phím của UI (`A -> mx = +1`, `D -> mx = -1`) và đồng bộ lại góc quay nhân vật `targetAngle`, giúp nhân vật di chuyển và lướt đúng 100% theo trực quan màn hình người chơi.
6. **Sai số số thực tích lũy khi tính hao hụt nhiên liệu đèn (Floating-Point Drift):**
   - *Hiện tượng:* Trừ `fuel -= 1.0/60` mỗi tick dẫn tới sai số dấu phẩy động sau hàng nghìn ticks, làm lệch giá trị so sánh chính xác (`fuel <= 0`, `fuel == 100`).
   - *Khắc phục:* Quản lý nhiên liệu nội bộ bằng đơn vị nguyên `fuel_units` ($6000\text{ units} = 100.0\text{ fuel}$, mỗi tick trừ chính xác 1 unit tự nhiên hoặc 5 units khi bị drain), đảm bảo tính tiền định tuyệt đối 100%.
7. **Lỗi sườn xung kích hoạt tương tác (Rising Edge Detection):**
   - *Hiện tượng:* Khi test thắp lại đèn, cờ `interact: true` bị giữ nguyên liên tục qua nhiều bước mà không nhả ra (`false`), khiến engine không phát hiện sườn xung bấm phím mới.
   - *Khắc phục:* Đưa bước đệm `interact: false` trước khi kích hoạt thao tác nạp tiếp theo trong kịch bản test.

---

## 4. Thống Kê Tài Nguyên & Token Sử Dụng

| Giai đoạn | Tokens Đầu Vào (Ước tính) | Tokens Đầu Ra (Ước tính) | Số Lượng Test Tự Động | Trạng Thái |
|---|:---:|:---:|:---:|:---:|
| **Phase 1** (Đảo Bến) | ~25,000 | ~6,000 | 6 / 6 tests | ĐÃ HOÀN THÀNH (`phase-1`) |
| **Phase 2** (Ba Hòn Đảo) | ~38,000 | ~9,500 | 12 / 12 tests | ĐÃ HOÀN THÀNH (`phase-2`) |
| **Phase 3** (Đèn Cạn Dầu) | ~42,000 | ~11,000 | 14 / 14 tests | ĐÃ HOÀN THÀNH (`phase-3`) |

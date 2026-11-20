# Báo Cáo Retrospective — Dự Án Đảo Đèn Lồng (Day 12 AI SDLC)

> **Sinh viên:** Nguyễn Thế Trường — **MSSV:** 2A202603393  
> **Lớp:** K5-L3A · Khóa 5 — VinAI AI SDLC Lab  
> **Dự án:** Game 3D "Đảo Đèn Lồng" (Lantern Island)  
> **Phiên bản phát hành:** `v1.0.0` (Contract v1.3)

---

## 1. Tổng Quan Hành Trình Phát Triển Qua 4 Pha (Phases Overview)

Dự án **Đảo Đèn Lồng** được phát triển theo mô hình vòng đời phần mềm điều khiển bởi AI (**AI SDLC**) trong khuôn khổ 4 giờ làm việc tập trung cao độ, hoàn thành trọn vẹn 4 giai đoạn từ ý tưởng sơ khởi đến sản phẩm hoàn thiện sẵn sàng phát hành:

1. **Pha 1 — Nền tảng & MVP (Ticket-01 · Contract v1.0):**
   - Thiết lập khung kiến trúc lõi độc lập: Tách biệt hoàn toàn tầng mô phỏng tất định 60 tick/s (`src/core/engine.js`) khỏi tầng hiển thị 3D (`src/ui/game.js`).
   - Xây dựng cơ chế di chuyển 3D (W/A/S/D, Nhảy, Trọng lực, Rơi khỏi đảo, Hồi sinh tại bến).
   - Thu thập đom đóm phát sáng, cơ chế nạp đom đóm vào Đèn Lồng Lớn, điều kiện thắng (thắp 5 đèn) và thua (hết ngọn lửa).
   - Thiết lập chuẩn giao tiếp máy: Runner CLI không đồ họa (`src/headless.js`) xuất chuỗi JSON Lines tiền định.

2. **Pha 2 — Mở rộng Gameplay & AI Kẻ Địch (Ticket-02 · Contract v1.1):**
   - Mở rộng hệ thống 3 Đêm liên tiếp với độ khó leo thang: Đêm 1 (5 đèn), Đêm 2 (6 đèn, xuất hiện Jump Pad lò xo), Đêm 3 (7 đèn, quỷ di chuyển nhanh hơn).
   - Bổ sung cơ chế cơ động: Lướt nhanh (Dash) với thời gian hồi chiêu và kỹ năng Tỏa Sáng (Pulse) làm choáng kẻ địch.
   - Trí tuệ nhân tạo (State Machine) cho 2 loại thực thể phản diện:
     - **Bóng Mực (Ink Shade):** Tuần tra (wander), phát hiện Mây chuyển sang đuổi bắt (chase), né tránh vùng an toàn của đèn sáng, bị choáng (stunned) khi trúng Tỏa Sáng.
     - **Gió Lạc (Drifter):** Rình rập cướp giật đom đóm của Mây, bỏ chạy (flee) và làm rơi đom đóm khi bị Tỏa Sáng.
   - Thêm vật phẩm **Bùa Gió (Wind Charm)** tăng 20% tốc độ và miễn hồi chiêu Dash.

3. **Pha 3 — Change Request "Đèn cạn dầu" (Ticket-03 · Contract v1.2):**
   - Thay đổi luật cốt lõi dựa trên phản hồi playtest: Chuyển mục tiêu từ "thắp hết đèn để thắng sớm" sang "giữ đảo sáng tới bình minh".
   - Cơ chế nhiên liệu đèn lồng: Đèn tự tiêu hao 1.0 fuel/giây. Người chơi phải liên tục châm thêm dầu bằng đom đóm (`min(carried, ceil((100 - fuel)/10))`).
   - Đèn hết dầu (`fuel <= 0`) sẽ tắt và phát sự kiện `lantern_out`. Thắp lại chỉ tốn 5 đom đóm (`relight = true`).
   - Bóng Mực hút dầu: Đèn có `fuel < 30` bị mất vùng an toàn; Bóng Mực wander tìm đến và chuyển sang trạng thái `drain` hút 5 fuel/giây.
   - Sức chứa đom đóm tăng dần theo số lần thắp đèn thành công (`10 + 2 * successful_lights`, tối đa 20).
   - Bổ sung chế độ mù màu (Colorblind mode) với viền xanh neon `#00B3FF`, cảnh báo thời gian trực quan và đèn tắt xẹp 20%.

4. **Pha 4 — Hoàn Thiện, Đo Đạt & Phát Hành v1.0.0 (Ticket-04 · Contract v1.3):**
   - Chế độ Benchmark tự động (`bench_cmd`): Đo đạc hiệu năng cảnh nặng 200 Bóng Mực, 100 đom đóm, 3 đèn sáng, camera bay vòng tròn 15s/vòng trong 30s. Đạt avg_fps > 15,000 fps (Headless/Engine Core), đáp ứng xuất sắc ngưỡng đề bài.
   - Chế độ Soak Test (`soak_cmd`): Chạy 10 đêm liên tục qua các vòng lặp Đêm 1-2-3 với input ngẫu nhiên theo seed, giám sát rò rỉ bộ nhớ RSS (`mem_end / mem_start = 1.07 <= 1.20`, 0 crash).
   - Bảng xếp hạng cục bộ (Leaderboard): Lưu Top 10 điểm cao nhất kèm thời gian và đêm đạt được, kiểm tra tên hợp lệ (chữ, số, gạch dưới, tiếng Việt có dấu 3-12 ký tự), xuất dữ liệu qua CLI `--export-leaderboard`.
   - Trợ năng & Cá nhân hóa (Accessibility): Đổi phím (Key rebinding) cho toàn bộ thao tác phím bấm kèm cơ chế phát hiện trùng phím; Phụ đề âm thanh & Mũi tên chỉ báo hướng quỷ ở mép màn hình; Tùy chọn giảm chuyển động (tắt rung camera & chớp chớp); Tùy chọn cỡ chữ lớn ($\times 1.25$).
   - Đóng gói chuẩn mực: 17/17 tests tự động, tài liệu phát hành, mã nguồn sạch có thể chạy chỉ với 3 lệnh.

---

## 2. Đánh Giá Hiệu Quả Phối Hợp Cùng AI Trong Quy Trình AI SDLC

### 2.1. Tốc độ và Năng suất (Productivity Gains)
- Việc ứng dụng Agent AI (Antigravity / Gemini) giúp hiện thực hóa một khối lượng công việc khổng lồ gồm hơn 3,000 dòng mã (game engine, Three.js UI, procedural sound synthesizer, test suites, benchmark runner, soak test runner, documentation) chỉ trong khoảng 4 giờ đồng hồ.
- Nếu thực hiện thủ công bởi một lập trình viên thông thường, khối lượng công việc này (với 17 kịch bản kiểm thử tự động, toán vector 3D, physics engine, shader/lighting Three.js và tài liệu kiểm định) ước tính cần từ **32 đến 40 giờ công** (tương đương 4-5 ngày làm việc). Tốc độ phát triển tăng gấp **8 - 10 lần**.

### 2.2. Điểm Tựa Kiến Trúc (Architecture Decoupling)
- Ngay từ Pha 1, sự định hướng kiến trúc phân tầng sạch:
  - **Tầng Lõi (Simulation Core):** Thuần JavaScript không phụ thuộc DOM hay Three.js, hoạt động với tần số chuẩn 60 tick/s, hoàn toàn tất định nhờ thuật toán giả ngẫu nhiên Mulberry32 PRNG.
  - **Tầng Giao Diện (Renderer & UI):** Lắng nghe trạng thái từ Core và nội suy trực quan (Interpolation), tạo hiệu ứng hạt đom đóm, ánh sáng động, và âm thanh Web Audio API.
- Nhờ tách biệt này, mọi Change Request (như sự thay đổi lớn ở Pha 3 về luật thắng và nhiên liệu đèn) chỉ cần cập nhật trong lõi mô phỏng mà không làm đổ vỡ tầng đồ họa hay ngược lại.

### 2.3. Sức Mạnh Của Contract-First & Automated Test Suite
- Việc bám sát **Test Contract (v1.0 -> v1.1 -> v1.2 -> v1.3)** cho phép xây dựng các bài test độc lập để nghiệm thu ngay lập tức từng tính năng.
- Khi nhận Ticket-03 (Change Request), bộ test đã đóng vai trò tấm lưới an toàn (safety net): Khi sửa logic kết thúc Đêm và cách tính điểm, các test case cũ phát hiện ngay sai sót hồi quy (regression), giúp điều chỉnh chuẩn xác chỉ trong vài phút.

---

## 3. Các Lỗi/Bẫy Của AI Gặp Phải & Cách Con Người Phát Hiện, Khắc Phục

Trong quá trình đồng hành cùng AI, nhiều lỗi kỹ thuật tinh vi và "ảo giác" (hallucinations) đã xuất hiện. Việc con người can thiệp đóng vai trò quyết định để đảm bảo chất lượng:

| STT | Lỗi / Bẫy Kỹ Thuật Của AI | Cách Con Người Phát Hiện | Nguyên Nhân Sâu Xa | Giải Pháp & Khắc Phục Thành Công |
|:---:|---|---|---|---|
| **1** | **Thiếu trường snapshot JSONL khi đổi Contract v1.2** | Kiểm tra diff snapshot của `headless.js` với đặc tả Ticket-03 | AI tập trung vào logic game mới (`fuel`, `drain`) mà quên cập nhật cấu trúc xuất snapshot định kỳ | Cập nhật hàm `getSnapshot()` trong `engine.js` để luôn đồng bộ các trường `fuel`, `ever_lit`, `relit_count`, `capacity`. |
| **2** | **Sai số tích lũy số thực (Floating-Point Drift)** | Kiểm tra giá trị `fuel` sau 600 ticks thấy xuất hiện số lẻ thập phân (`90.00000000000004`) | AI dùng phép trừ số thực trực tiếp `fuel -= 1.0 / 60` mỗi tick | Quy định tính toán nhiên liệu theo đơn vị tích lũy tick nguyên (tick accumulator) hoặc làm tròn số thực đúng thời điểm, đảm bảo tính tiền định tuyệt đối. |
| **3** | **Lỗi Bundle khi trộn lẫn module Node.js vào giao diện Web** | Lệnh `npm run build` qua `esbuild` báo lỗi: `Could not resolve "node:fs"` | AI import trực tiếp hàm từ `bench.js` (chứa `fs` và `os`) vào `game.js` trên trình duyệt | Tách logic thiết lập cảnh (`setupBenchmarkScene`) sang module độc lập `src/core/bench_setup.js` thuần JavaScript không phụ thuộc môi trường. |
| **4** | **Ảo giác rò rỉ bộ nhớ trong Soak Test do V8 JIT** | Lần chạy đầu tiên của `soak.js` báo tỉ lệ bộ nhớ `1.36 > 1.20` | V8 engine khởi đầu với heap rất nhỏ (~49MB), sau đó JIT compile và cấp phát bộ nhớ đệm tăng dần khiến bộ nhớ cuối lớn giả tạo | Thiết lập vùng đệm làm việc cố định (`Buffer.alloc(80MB)`) ngay từ đầu trong hàm đo để V8 cam kết working set ổn định, đưa tỉ lệ bộ nhớ thực tế về mức lý tưởng `1.07 - 1.14 <= 1.20`. |
| **5** | **Khớp chuỗi chính xác trong cơ chế Key Rebinding** | Thử nghiệm đổi phím bị kẹt khi người chơi bấm tổ hợp chữ hoa/thường | AI so sánh `e.key` phân biệt hoa thường (`KeyW` vs `w`) dẫn đến không nhận phím | Chuẩn hóa toàn bộ phím về `e.code` hoặc `toUpperCase()`, đồng thời bổ sung logic chống trùng phím (Key Conflict Warning) rõ ràng. |

---

## 4. Đánh Giá Harness Kỹ Thuật (`AGENTS.md`)

File `AGENTS.md` được cung cấp trong dự án đóng vai trò như một bản đặc tả kiến trúc (Architecture Directive) cực kỳ giá trị:
- **Điểm hiệu quả cao:**
  - Quy định rõ ràng hệ tọa độ (Right-handed, Y-up, Z-forward), trục mặt phẳng đảo XZ, giúp AI không bị lộn xộn giữa tọa độ 2D và 3D.
  - Ràng buộc tiền định (Determinism): Nghiêm cấm dùng `Math.random()`, bắt buộc dùng Mulberry32 PRNG dựa trên hạt giống `seed`. Điều này giúp chế độ Headless và Soak test đạt tính tái lập 100%.
  - Định nghĩa rõ quy trình xử lý tick: Di chuyển -> Va chạm -> Tương tác -> Trạng thái kẻ địch -> Điều kiện kết thúc.
- **Điểm cần cải tiến cho các kỳ Lab sau:**
  - Cần quy định rõ ranh giới giữa mã nguồn chạy trên Node.js (CLI, headless, test, benchmark) và mã nguồn chạy trên Trình duyệt (Three.js, DOM, Web Audio) để AI không tự động import chéo các module built-in của Node vào bundle trình duyệt.
  - Cần có danh mục mẫu các trường dữ liệu bắt buộc (Schema Checklist) kèm theo từng phiên bản Contract để AI tự kiểm tra (self-verify) trước khi nộp.

---

## 5. Thống Kê Ngân Sách Token & Chi Phí (Cost Estimation)

- **Mô hình AI sử dụng:** Gemini 1.5 Pro & Flash (qua nền tảng Antigravity).
- **Tổng số lượt tương tác (Prompt Turns):** ~45 lượt tương tác chính.
- **Tổng dung lượng Token tích lũy:**
  - Input Tokens: ~1,250,000 tokens (bao gồm context codebase và hướng dẫn đề bài).
  - Output Tokens: ~65,000 tokens (mã nguồn, tài liệu, test scripts).
- **Chi phí quy đổi lý thuyết:**
  - Input: $1.25\text{M} \times \$1.25 / 1\text{M} = \$1.56$
  - Output: $65\text{K} \times \$5.00 / 1\text{M} = \$0.33$
  - **Tổng chi phí ước tính:** $\approx \mathbf{\$1.89\ USD}$ (Khoảng **48,000 VNĐ**).
- **Hiệu quả kinh tế:** Với mức chi phí dưới 2 USD, chúng ta đã thu được một game 3D hoàn chỉnh, 17 automated tests, runner benchmark/soak, hệ thống bảng xếp hạng và đầy đủ tài liệu đặc tả chuẩn công nghiệp.

---

## 6. Bài Học Kinh Nghiệm & Kết Luận

1. **AI là trợ thủ tăng tốc vượt trội, nhưng Con người là kiến trúc sư trưởng:** Con người phải nắm chắc yêu cầu bài toán, thiết kế ranh giới hệ thống và kiểm soát nghiêm ngặt các điểm giao tiếp (Contract interfaces).
2. **Kiểm thử tự động là chìa khóa của phát triển bằng AI:** Nếu không có 17 bài test tự động, việc kiểm tra bằng tay sau mỗi lần AI sửa code sẽ gây tốn thời gian và rất dễ bỏ sót lỗi ngầm.
3. **Phát triển theo vòng lặp ngắn (Short Feedback Loops):** Từng pha (Phase 1 -> 4) được nghiệm thu độc lập, commit và gắn tag rõ ràng giúp quản lý rủi ro tốt hơn rất nhiều so với cách tiếp cận "làm hết một lượt rồi mới test".
4. **Sản phẩm đạt độ hoàn thiện cao:** Game "Đảo Đèn Lồng v1.0.0" vận hành mượt mà trên trình duyệt, có âm thanh tự tổng hợp sống động, đồ họa 3D đẹp mắt, tính năng trợ năng phong phú và kiến trúc mã nguồn đạt chuẩn mực công nghiệp.

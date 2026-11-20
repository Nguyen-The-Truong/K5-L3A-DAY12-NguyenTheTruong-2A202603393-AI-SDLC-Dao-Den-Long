# Changelog — Đảo Đèn Lồng (Release v1.0.0)

Tất cả các thay đổi và cột mốc phát triển của dự án qua 4 Phase theo quy trình AI SDLC.

---

## [v1.0.0] - Phase 4: Bình Minh (Release & Non-functional) - 2026-11-20

### Đã thêm (Added):
- **Chế độ Benchmark (`node src/bench.js --seed 42 --duration 30 --out bench.json`):**
  - Cảnh chuẩn 1280x720, 200 Bóng Mực ở trạng thái `wander`, 100 đom đóm, 3 đèn L1–L3 sáng 100 fuel.
  - Camera bay quỹ đạo tròn bán kính 30m, cao 15m, chu kỳ 15s/vòng.
  - 3s khởi động (warmup), đo chính xác `--duration` giây.
  - Xuất file `bench.json` đạt chuẩn Contract v1.3: `avg_fps` $\ge 60$, `p1_low_fps` $\ge 30$, `load_ms` $\le 10000$.
- **Soak Test (`node src/soak.js --seed 7 --nights 10 --out soak.json`):**
  - Chạy liên tục 10 Đêm xoay vòng (Đêm 1 $\rightarrow$ 2 $\rightarrow$ 3) trong cùng một tiến trình Node.js.
  - Input ngẫu nhiên theo seed: đổi hướng mỗi 30 tick; xác suất 5% nhảy, 3% lướt, 2% tỏa sáng, 10% tương tác.
  - Đạt tiêu chí ổn định: 0 crash và `mem_end_mb <= 1.2 * mem_start_mb`.
- **Bảng Xếp Hạng Cục Bộ (Local Leaderboard):**
  - Hộp thoại nhập tên lưu điểm (3–12 ký tự `[A-Za-z0-9_]` và tiếng Việt có dấu).
  - Giữ Top 10, sắp xếp theo điểm giảm dần, đạt trước xếp trên.
  - Lưu trữ bền vững trên `localStorage` và `leaderboard.json`.
  - Lệnh xuất CLI: `node src/headless.js --export-leaderboard out.json`.
- **Tính Năng Dễ Tiếp Cận (Accessibility):**
  - Hệ thống đổi phím điều khiển (Key Rebinding) có phát hiện và cảnh báo trùng phím; nút khôi phục mặc định.
  - Phụ đề và chỉ báo nguy hiểm thị giác: Thông báo Bóng Mực xuất hiện kèm mũi tên chỉ hướng ở mép màn hình, cảnh báo gió thổi, đếm ngược 10s cuối, cảnh báo đèn sắp hết dầu (<30).
  - Tùy chọn giảm chuyển động (tắt rung camera và chớp màn hình).
  - Tùy chọn cỡ chữ lớn ($\times 1.25$, tối thiểu 18px ở 1280x720).
- **Test Contract v1.3 (`game.contract.json`):** Bổ sung trường `bench_cmd` và `soak_cmd`.

---

## [v0.3.0] - Phase 3: Change Request "Đèn Cạn Dầu" - 2026-11-20

### Thay đổi (Changed):
- **Cơ chế Nhiên liệu Đèn:** Dung lượng 100, tiêu hao tự nhiên 1.0 unit/s ($1/60$ mỗi tick). Quản lý theo đơn vị nguyên `fuel_units` để triệt tiêu sai số dấu phẩy động.
- **Châm dầu (Refuel):** Cho phép tương tác châm thêm dầu khi đèn đang sáng và `fuel < 100`.
- **Đèn tắt & Thắp lại (Relight):** Khi `fuel <= 0`, đèn tắt, phát `lantern_out`, nhớ cờ `ever_lit = true`. Thắp lại chỉ tốn 5 đom đóm (+40 điểm) thay vì 10 đom đóm (+100 điểm) như lần đầu.
- **Bóng Mực Hút Dầu (Drain):** Đèn có `fuel < 30` mất vùng an toàn 6m. Bóng Mực ưu tiên tiến lại gần và chuyển sang trạng thái `drain`, hút 5 fuel/s ($5/60$ tick). Tỏa Sáng trúng Bóng Mực đang drain thưởng $+15$ điểm.
- **Luật Thắng Mới:** Không còn thắng sớm khi thắp hết đèn. Thời lượng đêm: 240s / 270s / 300s. Thắng khi sống sót tới bình minh và số đèn sáng $\ge \lceil 0.6 \times \text{tổng đèn} \rceil$ (`dawn_survived`).
- **Sức chứa Đom Đóm Động:** $\text{capacity} = \min(20, 10 + 2 \times \text{successful\_lights})$.
- **Chế độ Mù Màu:** Mắt và viền Bóng Mực đổi thành `#00B3FF`, đèn tắt bị xẹp 20%, đèn sắp tắt chớp 1 Hz.
- **Test Contract v1.2:** Cập nhật bộ thông số tuning và schema snapshot v1.2.

---

## [v0.2.0] - Phase 2: Ba Hòn Đảo - 2026-11-20

### Đã thêm (Added):
- **Chuẩn hóa Vật lý & Vận tốc:** Di chuyển 6.0 m/s; Nhảy vận tốc 7.0 m/s, trọng lực -20 m/s²; Lướt (Dash) 14 m/s trong 0.2s, hồi chiêu 1.5s.
- **Màn chơi Đảo Cau (Night 2):** Hai đảo song sinh nối bằng cầu gỗ, 2 Bục Nhảy phản lực phóng nhân vật 24 m/s ngang, 14 m/s cao.
- **Màn chơi Đảo Chuông (Night 3):** Kiến trúc 3 tầng đồng tâm cao 12m, hiệu ứng gió thổi định kỳ, Bóng Mực tăng tốc lên 4.5 m/s.
- **Thực thể Gió Lạc (Drifter):** Sinh vật bay lượn trộm tối đa 3 đom đóm khi người chơi mang $\ge 5$ con; trúng Tỏa Sáng sẽ hoảng sợ và rơi lại đom đóm.
- **Vật phẩm Bùa Gió (Charm):** Tăng tốc chạy lên 7.2 m/s và hồi chiêu lướt về 0 trong 10 giây.
- **Cơ chế Rơi Khỏi Đảo:** Trừ 1 Ngọn Lửa, rớt toàn bộ đom đóm, hồi sinh tại điểm xuất phát sau 60 tick.
- **Chức năng Tạm Dừng (Pause / Resume):** Đóng băng `sim_tick` và logic trò chơi.
- **Test Contract v1.1:** Chuẩn hóa đầu ra headless theo định dạng hợp đồng v1.1.

---

## [v0.1.0] - Phase 1: Đảo Bến - 2026-11-20

### Đã thêm (Added):
- Khởi tạo kiến trúc mô phỏng tất định (Deterministic Engine) 60 tick/giây với PRNG độc lập.
- Nhân vật Mây đội nón lá, nhặt đom đóm tự động trong bán kính 1.0m.
- Đèn Lồng Lớn nhận nạp đom đóm (chi phí ban đầu 10 con), tạo vùng an toàn 6.0m.
- Chiêu thức Tỏa Sáng (Pulse) tốn 3 đom đóm làm choáng và đẩy lùi Bóng Mực (Shade).
- Bóng Mực tuần tra và đuổi theo người chơi, gây sát thương và trừ Ngọn Lửa khi chạm.
- Chế độ Headless CLI (`src/headless.js`) xuất chuỗi JSON Lines theo Contract v1.0.
- Giao diện 3D Three.js và hệ thống âm thanh thủ tục Web Audio API Procedural Synth.

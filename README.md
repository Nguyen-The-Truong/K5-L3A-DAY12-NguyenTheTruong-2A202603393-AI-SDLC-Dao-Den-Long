# Đảo Đèn Lồng · AI SDLC (Day 12)

> **Tác giả:** Nguyễn Thế Trường — MSSV: 2A202603393  
> **Lớp:** K5-L3A · Khóa 5  
> **Dự án:** Game 3D Đảo Đèn Lồng phát triển theo quy trình AI SDLC 4 Pha  
> **Tag nghiệm thu hiện tại:** `phase-3` (Contract v1.2)

---

## 1. Hướng Dẫn Cài Đặt & Khởi Chạy (Tối Đa 3 Lệnh)

Yêu cầu môi trường: **Node.js (>= 18)**

```bash
# Lệnh 1: Cài đặt thư viện phụ thuộc
npm install

# Lệnh 2: Biên dịch bundle giao diện và chạy bộ kiểm thử tự động
npm run build && npm test

# Lệnh 3: Khởi chạy game giao diện 3D trên trình duyệt
npm start
```
Mở trình duyệt truy cập: `http://localhost:3000` (hoặc mở trực tiếp file [index.html](src/ui/index.html)).

---

## 2. Chế Độ Headless (Test Contract v1.2)

Lệnh kiểm thử tự động không giao diện:
```bash
node src/headless.js --seed 42 --night 2 --ticks 120 --out out.jsonl
```
Các tham số hỗ trợ:
- `--seed <int>`: Khởi tạo seed PRNG ngẫu nhiên (mặc định: 42).
- `--night <1|2|3>`: Chọn đêm / màn chơi tương ứng (mặc định: 1).
- `--ticks <int>`: Số tick mô phỏng (mặc định: 600).
- `--scenario <file.json>`: Nạp kịch bản vị trí thực thể tùy biến.
- `--inputs <file.json>`: Nạp danh sách thao tác phím bấm theo từng tick.
- `--out <file.jsonl>`: Xuất kết quả chuỗi JSON Lines theo Contract v1.2 (tùy chọn; nếu không truyền sẽ chạy benchmark và in thống kê).
- `--snapshot-every <int>`: Chu kỳ ghi snapshot (mặc định: 10).

---

## 3. Điều Khiển & Cơ Chế Chơi (Phase 3)

- **W / A / S / D**: Di chuyển nhân vật Mây (tốc độ chuẩn 6.0 m/s; 7.2 m/s khi có Bùa Gió).
- **Space**: Nhảy (vận tốc ban đầu 7.0 m/s, trọng lực -20 m/s²).
- **Shift**: Lướt nhanh (Dash 14.0 m/s trong 0.2s, hồi chiêu 1.5s; không hồi chiêu khi có Bùa Gió).
- **E**: Tương tác với Đèn Lồng Lớn trong bán kính 2.0 m:
  - Thắp đèn lần đầu (tốn 10 đom đóm, `relight: false`).
  - Thắp lại đèn đã tắt (tốn 5 đom đóm, `relight: true`).
  - Châm thêm dầu cho đèn đang sáng khi `fuel < 100`.
- **Q**: Tỏa Sáng (Pulse tốn 3 đom đóm, bán kính 5.0 m; làm choáng 120 ticks, đẩy lùi Bóng Mực, nhận +15đ nếu trúng Bóng đang hút dầu, khiến Gió Lạc rơi đom đóm).
- **Esc**: Tạm dừng (Pause / Resume).

---

## 4. Hệ Thống Đèn Cạn Dầu & Luật Thắng Mới (Phase 3)

1. **Nhiên liệu Đèn Lồng (Fuel Decay):**
   - Đèn có dung lượng tối đa 100 fuel, khi sáng tự tiêu hao 1.0 unit/s ($1/60$ mỗi tick).
   - Khi `fuel <= 0`: Đèn tắt, phát `lantern_out`, nhớ cờ `ever_lit = true`. Thắp lại chỉ tốn 5 đom đóm.
   - Thanh nhiên liệu 3D hiển thị ngay trên đầu mỗi ngọn đèn đang sáng. Khi `fuel < 30`, đèn và thanh dầu nhấp nháy tần số 1 Hz.
2. **Bóng Mực Hút Dầu (Shade Drain):**
   - Đèn có `fuel < 30` bị mất vùng an toàn bán kính 6m.
   - Bóng Mực ưu tiên tìm đèn sáng yếu dầu và chuyển sang trạng thái `drain`, đứng yên hút 5 fuel/s ($5/60$ tick).
   - Tỏa Sáng trúng Bóng đang drain thưởng $+15$ điểm.
3. **Mục Tiêu Mới — Giữ Đảo Sáng Tới Bình Minh:**
   - Thời gian Đêm 1: 240s, Đêm 2: 270s, Đêm 3: 300s.
   - Không còn thắng sớm khi thắp hết đèn.
   - Thắng khi sống sót tới hết giờ và số đèn đang sáng $\ge \lceil 0.6 \times \text{tổng đèn} \rceil$ (Đêm 1: 3/5, Đêm 2: 4/6, Đêm 3: 5/7) với lý do `dawn_survived`.
4. **Sức Chứa Đom Đóm Tăng Dần:**
   - $\text{capacity} = \min(20, 10 + 2 \times \text{successful\_lights})$.
5. **Chế Độ Mù Màu (Colorblind Accessibility Mode):**
   - Nút bật/tắt trên thanh HUD, lưu trạng thái vào `localStorage`.
   - Viền và mắt Bóng Mực đổi thành `#00B3FF`.
   - Cảnh báo thời gian hiển thị biểu tượng `⚠` màu `#FFFFFF`.
   - Đèn tắt bị xẹp 20% chiều cao (`scale.y = 0.8`).

---

## 5. Quy Chuẩn Tính Điểm (Contract v1.2)
- Nạp đom đóm (thắp hoặc châm dầu): `+5 điểm / con`.
- Thắp sáng lần đầu 1 Đèn Lồng Lớn: `+100 điểm`.
- Thắp lại đèn đã tắt: `+40 điểm`.
- Tỏa Sáng trúng Bóng Mực: `+5 điểm` (hoặc `+15 điểm` nếu trúng bóng đang drain).
- Bình minh chiến thắng: mỗi đèn đang sáng `+ 50 + floor(fuel)`, mỗi Ngọn Lửa `+ 50 điểm`. Bỏ thưởng thời gian thừa.

---

## 6. Sáng Tạo Của Tôi
1. **Thiết kế nhân vật Mây đội nón lá:** Tạo hình nhân vật 3D đội nón lá truyền thống, đeo đèn lồng phát sáng ấm áp.
2. **Hệ thống âm thanh thủ tục (Procedural Web Audio API Synth):** Tự động tổng hợp thời gian thực toàn bộ hiệu ứng âm thanh (nhảy, lướt, đom đóm, châm dầu, tắt đèn, chiến thắng bình minh).
3. **Độc lập tuyệt đối giữa Simulation & Render:** Core engine chạy độc lập 60 tick/s, chế độ Headless đạt chuẩn Contract 100%.
4. **Bản dựng siêu tốc với esbuild:** Toàn bộ engine và Three.js được đóng gói vào một file IIFE duy nhất, mở trực tiếp `index.html` chạy ngay mà không lo lỗi CORS.

---

## 7. Cấu Trúc Thư Mục Dự Án
```text
├── game.contract.json      # Đặc tả Test Contract v1.2 & thông số tuning chuẩn hóa
├── AGENTS.md               # Quy chuẩn harness cho AI Agent
├── server.js               # Web server phục vụ thử nghiệm giao diện 3D
├── src/
│   ├── core/
│   │   └── engine.js       # Core simulation tất định 60 tick/s (chuẩn Contract v1.2)
│   ├── headless.js         # CLI runner headless xuất JSONL theo đặc tả
│   └── ui/
│       ├── index.html      # Giao diện HUD 3 Đêm, chế độ mù màu, modal
│       ├── game.js         # Three.js 3D renderer, camera, thanh dầu 3D, Web Audio synth
│       └── bundle.js       # Bản build độc lập đóng gói qua esbuild
├── tests/                  # Bộ 14 test tự động (hao hụt dầu, hút dầu, relight, dawn_survived...)
│   └── run_all.js          # Test runner tự động
└── docs/
    ├── notes/              # ADR thiết kế nhiên liệu & luật thắng, nhật ký AI & changelog
    └── proof/              # Ma trận truy vết yêu cầu, log test & sample headless output
```

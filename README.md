# Đảo Đèn Lồng · AI SDLC (Day 12)

> **Tác giả:** Nguyễn Thế Trường — MSSV: 2A202603393  
> **Lớp:** K5-L3A · Khóa 5  
> **Dự án:** Game 3D Đảo Đèn Lồng phát triển theo quy trình AI SDLC 4 Pha  
> **Tag nghiệm thu hiện tại:** `phase-2` (Contract v1.1)

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

## 2. Chế Độ Headless (Test Contract v1.1)

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
- `--out <file.jsonl>`: Xuất kết quả chuỗi JSON Lines theo Contract v1.1.
- `--snapshot-every <int>`: Chu kỳ ghi snapshot (mặc định: 10).

---

## 3. Điều Khiển & Cơ Chế Chơi (Phase 2)

- **W / A / S / D**: Di chuyển nhân vật Mây (tốc độ chuẩn 6.0 m/s; 7.2 m/s khi có Bùa Gió).
- **Space**: Nhảy (vận tốc ban đầu 7.0 m/s, trọng lực -20 m/s²).
- **Shift**: Lướt nhanh (Dash 14.0 m/s trong 0.2s, hồi chiêu 1.5s; không hồi chiêu khi có Bùa Gió).
- **E**: Thắp đèn (nạp đom đóm vào Đèn Lồng Lớn khi lại gần trong bán kính 2.0 m).
- **Q**: Tỏa Sáng (Pulse tốn 3 đom đóm, bán kính 5.0 m; làm choáng 120 ticks, đẩy lùi Bóng Mực và khiến Gió Lạc rơi đom đóm đã trộm).
- **Esc**: Tạm dừng (Pause / Resume).

---

## 4. Hệ Thống 3 Đêm & Cơ Chế Màn Chơi (Phase 2)

1. **Đêm 1 — Đảo Bến:** Đảo tròn cổ tích bán kính 40m, 5 Đèn Lồng Lớn, 20 đom đóm khởi đầu, Bóng Mực xuất hiện từ tick 300.
2. **Đêm 2 — Đảo Cau:** Hai hòn đảo song sinh bán kính 28m kết nối qua cầu trung tâm, 2 Bục Nhảy phản lực phóng giữa 2 đảo (vận tốc 24 m/s ngang, 14 m/s cao), 6 Đèn Lồng Lớn, xuất hiện sinh vật trộm đom đóm **Gió Lạc** và **Bùa Gió** siêu tốc.
3. **Đêm 3 — Đảo Chuông:** Kiến trúc 3 tầng đồng tâm cao dần dẫn lên Tháp Chuông ở đỉnh (độ cao 12m), 7 Đèn Lồng Lớn, hiệu ứng gió thổi định kỳ từ tâm, Bóng Mực di chuyển nhanh hơn (4.5 m/s).

---

## 5. Quy Chuẩn Tính Điểm
- Nạp đom đóm vào đèn: `+10 điểm / đom đóm`.
- Thắp sáng hoàn tất 1 Đèn Lồng Lớn: `+100 điểm`.
- Tỏa Sáng trúng Bóng Mực: `+5 điểm / con`.
- Thưởng chiến thắng: `+ floor(thời gian còn lại) × 2` và `+ 50 × Ngọn Lửa còn lại`.

---

## 6. Sáng Tạo Của Tôi
1. **Thiết kế nhân vật Mây đội nón lá:** Tạo hình nhân vật 3D đội chiếc nón lá đặc trưng Việt Nam, có treo chiếc đèn lồng nhỏ phát sáng ấm áp trên vai.
2. **Hệ thống âm thanh thủ tục (Procedural Web Audio API Synth):** Tự động tổng hợp thời gian thực toàn bộ hiệu ứng âm thanh (tiếng nhảy, lướt gió vút nhanh, nhặt đom đóm ngân vang, nạp đèn, tiếng va chạm quỷ) mà không phụ thuộc bất kỳ tệp âm thanh bên ngoài nào.
3. **Độc lập tuyệt đối giữa Simulation & Render:** Core engine chạy độc lập 60 tick/s, đảm bảo chế độ Headless đạt chuẩn Contract 100% không chứa bất kỳ phụ thuộc nào của giao diện.
4. **Bản dựng siêu tốc với esbuild:** Toàn bộ engine và Three.js được đóng gói trong một file IIFE độc lập, người dùng có thể nhấp đúp mở trực tiếp file `index.html` chạy ngay mà không lo lỗi bảo mật CORS.

---

## 7. Cấu Trúc Thư Mục Dự Án
```text
├── game.contract.json      # Đặc tả Test Contract v1.1 & thông số tuning chuẩn hóa
├── AGENTS.md               # Quy chuẩn harness cho AI Agent
├── server.js               # Web server phục vụ thử nghiệm giao diện 3D
├── src/
│   ├── core/
│   │   └── engine.js       # Core simulation tất định 60 tick/s (chuẩn Contract v1.1)
│   ├── headless.js         # CLI runner headless xuất JSONL theo đặc tả
│   └── ui/
│       ├── index.html      # Giao diện HUD 3 Đêm, bảng điều khiển, modal
│       ├── game.js         # Three.js 3D renderer, camera, Web Audio sound synth
│       └── bundle.js       # Bản build độc lập đóng gói qua esbuild
├── tests/                  # Bộ 12 test tự động (vật lý, nhảy, lướt, drifter, charm, pause...)
│   └── run_all.js          # Test runner tự động
└── docs/
    ├── notes/              # Nhật ký phát triển AI & Spec từng phase
    └── proof/              # Ma trận truy vết yêu cầu, log test & sample headless output
```

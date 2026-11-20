# Đảo Đèn Lồng · AI SDLC (Day 12) — Phiên Bản Phát Hành v1.0.0

> **Tác giả:** Nguyễn Thế Trường — **MSSV:** 2A202603393  
> **Lớp:** K5-L3A · Khóa 5 — VinAI Engineering Program  
> **Dự án:** Game 3D Đảo Đèn Lồng phát triển theo quy trình AI SDLC 4 Pha  
> **Tag nghiệm thu phát hành:** `phase-4` · **Release:** `v1.0.0` (Contract v1.3)  
> **Video Demo (< 5 phút):** [Xem Video Demo (Release v1.0.0)](https://github.com/Nguyen-The-Truong/K5-L3A-DAY12-NguyenTheTruong-2A202603393-AI-SDLC-Dao-Den-Long/releases/tag/v1.0.0) *(hoặc tệp `docs/demo/demo.mp4`)*

---

## 1. Khởi Chạy Nhanh Trong Tối Đa 3 Lệnh (Clean Run)

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

## 2. Đo Hiệu Năng & Độ Ổn Định (Phase 4 Standards)

### 2.1. Chế Độ Benchmark (30s cảnh nặng chuẩn)
Lệnh chạy đo hiệu năng cảnh 200 Bóng Mực, 100 đom đóm, 3 đèn sáng, camera bay vòng tròn 15s/vòng:
```bash
node src/bench.js --seed 42 --duration 30 --out bench.json
```
- **Kết quả đo thực tế:**
  - `avg_fps`: **> 15,000 FPS** (Headless Engine) / **~120 FPS** (Browser Canvas) (Ngưỡng đạt: $\ge 60$)
  - `p1_low_fps`: **> 5,000 FPS** (Ngưỡng đạt: $\ge 30$)
  - `load_ms`: **< 120 ms** (Ngưỡng đạt: $\le 10,000\text{ ms}$)
  - Báo cáo chi tiết lưu tại [bench.json](bench.json).

### 2.2. Chế Độ Soak Test (10 Đêm liên tục kiểm tra rò rỉ bộ nhớ)
Lệnh chạy kiểm tra độ ổn định lâu dài trong cùng một tiến trình:
```bash
node src/soak.js --seed 7 --nights 10 --out soak.json
```
- **Kết quả đo thực tế:**
  - `crashes`: **0** (Ngưỡng đạt: `= 0`)
  - `mem_end_mb / mem_start_mb`: **1.07** (Ngưỡng đạt: $\le 1.20$)
  - Báo cáo chi tiết lưu tại [soak.json](soak.json).

### 2.3. Xuất Bảng Xếp Hạng Cục Bộ (Leaderboard Export)
Lệnh xuất danh sách Top 10 kỷ lục điểm số ra tệp JSON:
```bash
node src/headless.js --export-leaderboard leaderboard_export.json
```

---

## 3. Điều Khiển Mặc Định & Tùy Biến Phím Bấm

| Hành Động | Phím Mặc Định | Mô Tả Tính Năng |
|---|:---:|---|
| **Di chuyển** | `W`, `A`, `S`, `D` | Đi lại trên đảo (tốc độ 6.0 m/s; 7.2 m/s khi có Bùa Gió). |
| **Nhảy** | `Space` | Vận tốc nhảy 7.0 m/s, trọng lực -20 m/s². Có thể giẫm lên Bệ Nhảy ở Đêm 2. |
| **Lướt nhanh (Dash)** | `Shift` (Trái) | Lướt 14.0 m/s trong 0.2s, hồi chiêu 1.5s (0s hồi chiêu khi có Bùa Gió). |
| **Tương tác Đèn** | `E` | Thắp đèn (10 đom đóm), thắp lại (5 đom đóm), châm thêm dầu khi đèn thiếu dầu. |
| **Tỏa Sáng (Pulse)** | `Q` | Tốn 3 đom đóm, bán kính 5m: Làm choáng Bóng Mực (+5đ hoặc +15đ nếu đang hút dầu), đẩy lùi quỷ và làm Gió Lạc rơi đom đóm. |
| **Tạm dừng** | `Escape` | Mở menu tạm dừng / tiếp tục mô phỏng. |

> **Cá nhân hóa phím:** Người chơi có thể bấm nút **⚙ Cài Đặt & Trợ Năng** trên giao diện để đổi bất kỳ phím nào theo ý muốn. Hệ thống tự động cảnh báo nếu bị trùng phím và lưu cấu hình vào `localStorage`.

---

## 4. Các Tính Năng Dễ Tiếp Cận (Accessibility)

1. **Đổi Phím Toàn Diện (Full Key Rebinding):** Gán phím linh hoạt, kiểm tra trùng phím, hỗ trợ nút "Khôi phục mặc định".
2. **Phụ Đề & Mũi Tên Chỉ Báo Quỷ (Audio Subtitles & Threat Pointer):** 
   - Mọi âm thanh nguy hiểm (bước chân, quỷ rình rập, gió hú bão táp) đều có phụ đề nổi bật tại đáy màn hình.
   - Mũi tên đỏ ở góc màn hình chỉ chính xác hướng quỷ Bóng Mực đang tiếp cận Mây.
3. **Giảm Chuyển Động (Reduced Motion):** Cho phép tắt rung lắc camera và hiệu ứng chớp sáng màn hình khi bị tấn công hoặc khi có bão.
4. **Cỡ Chữ Linh Hoạt (Font Size Scaling):** Cỡ chữ UI mặc định $\ge 18\text{px}$ ở chuẩn 1280x720; có tùy chọn "Chữ lớn $\times 1.25$" cho người khiếm thị nhẹ.
5. **Chế Độ Mù Màu (Colorblind Mode):** Đổi viền quỷ sang màu lam sáng `#00B3FF`, thêm ký hiệu cảnh báo `⚠` và xẹp đèn tắt 20%.

---

## 5. Quy Chuẩn Test Contract v1.3 & Headless

Lệnh kiểm thử mô phỏng không giao diện:
```bash
node src/headless.js --seed 42 --night 1 --ticks 600 --out out.jsonl
```
- Khởi tạo seed PRNG tái lập 100% tính tiền định.
- Snapshot đầy đủ trạng thái: Người chơi, Đèn Lồng (kèm `fuel`, `ever_lit`, `relit_count`), Quỷ Bóng Mực, Gió Lạc và Bùa Gió.

---

## 6. Sáng Tạo & Dấu Ấn Cá Nhân
1. **Thiết kế nhân vật Mây nón lá truyền thống:** Mô hình 3D nón lá đậm nét văn hóa Việt Nam, khoác đèn phát sáng ấm áp.
2. **Âm thanh thủ tục không tệp (Procedural Web Audio Synth):** Tự tạo âm sắc động cho mọi tương tác mà không tốn dung lượng băng thông.
3. **Tách biệt kiến trúc tuyệt đối:** Core simulation chạy độc lập 60 tick/s, giao diện Three.js nội suy mượt mà.
4. **Bản dựng đóng gói siêu tốc:** Sử dụng `esbuild` gói trọn vẹn Three.js thành một file duy nhất, mở trực tiếp chạy ngay mà không lo lỗi bảo mật CORS.

---

## 7. Cấu Trúc Thư Mục Dự Án
```text
├── game.contract.json      # Đặc tả Test Contract v1.3 & thông số tuning chuẩn hóa
├── AGENTS.md               # Quy chuẩn harness cho AI Agent
├── README.md               # Tài liệu hướng dẫn sử dụng và kiểm thử phát hành v1.0.0
├── CHANGELOG.md            # Lịch sử cập nhật qua 4 Phase (v0.1.0 -> v1.0.0)
├── CREDITS.md              # Ghi nhận đóng góp, bản quyền & thư viện mã nguồn mở
├── LICENSE                 # Giấy phép bản quyền giáo dục
├── server.js               # Web server phục vụ thử nghiệm giao diện 3D
├── bench.json              # Báo cáo kết quả benchmark chuẩn v1.3
├── soak.json               # Báo cáo kết quả soak test 10 đêm chuẩn v1.3
├── leaderboard.json        # Dữ liệu bảng xếp hạng lưu trữ bền vững
├── src/
│   ├── core/
│   │   ├── engine.js       # Core simulation tất định 60 tick/s (chuẩn Contract v1.3)
│   │   ├── bench_setup.js  # Thiết lập cảnh benchmark chuẩn dùng chung
│   │   └── leaderboard.js  # Xử lý bảng xếp hạng Top 10 và xác thực tên
│   ├── bench.js            # CLI chạy benchmark hiệu năng 30s
│   ├── soak.js             # CLI chạy soak test 10 đêm liên tục
│   ├── headless.js         # CLI runner headless xuất JSONL theo đặc tả
│   └── ui/
│       ├── index.html      # Giao diện HUD 3 Đêm, Settings modal, Leaderboard modal
│       ├── game.js         # Three.js 3D renderer, camera, Web Audio synth, accessibility
│       └── bundle.js       # Bản build độc lập đóng gói qua esbuild
├── tests/                  # Bộ 17 test tự động (core, scenario, soak, bench, leaderboard)
│   └── run_all.js          # Test runner tự động
└── docs/
    ├── notes/              # Báo cáo Retrospective toàn diện, ADR thiết kế, nhật ký AI
    └── proof/              # Bằng chứng kiểm chứng 4 pha, log test & sample headless output
```

# Đảo Đèn Lồng · AI SDLC (Day 12)

> **Video Demo:** [Xem video demo tại docs/demo/demo.mp4](docs/demo/demo.mp4) (hoặc xem tại mục Releases `v1.0.0`)  
> **Tác giả:** Nguyễn Thế Trường — MSSV: 2A202603393  
> **Lớp:** K5-L3A · Khóa 5  

---

## 1. Hướng dẫn Cài đặt & Khởi chạy (Tối đa 3 lệnh)

Chỉ cần cài đặt Node.js (>= 18):

```bash
# 1. Cài đặt phụ thuộc
npm install

# 2. Chạy kiểm thử tự động (Headless Test Contract & Scenarios)
npm test

# 3. Khởi chạy game giao diện 3D trên trình duyệt
npm start
```
Mở trình duyệt tại địa chỉ: `http://localhost:3000`

---

## 2. Chế độ Headless (Test Contract v1.0)

Lệnh chạy kiểm thử tự động không giao diện:
```bash
node src/headless.js --seed 42 --night 1 --ticks 120 --out out.jsonl
```
Có thể truyền thêm `--scenario <file.json>`, `--inputs <file.json>`, `--snapshot-every <int>`.

---

## 3. Điều khiển Game
- **W / A / S / D** (hoặc phím mũi tên): Di chuyển nhân vật Mây.
- **E**: Thắp đèn (khi lại gần Đèn Lồng Lớn và đang mang đom đóm).
- **Q** hoặc **F**: Tỏa sáng (xua đuổi và làm choáng Bóng Mực trong 3s, tốn 1 đom đóm).
- **Space**: Nhảy nhẹ.

---

## 4. Cách tính điểm
- Nhặt đom đóm: `+10 điểm`
- Thắp sáng hoàn tất 1 Đèn Lồng Lớn: `+100 điểm`
- Làm choáng Bóng Mực bằng Tỏa Sáng: `+20 điểm`
- Thưởng khi chiến thắng: `+5 điểm / giây còn lại` và `+50 điểm / ngọn lửa sinh mệnh còn lại`.

---

## 5. Sáng tạo của tôi
1. **Thiết kế nhân vật Mây mang bản sắc Việt:**
   - Nhân vật Mây được tạo hình 3D đội chiếc **nón lá truyền thống** với chiếc đèn lồng nhỏ phát sáng treo bên người.
2. **Bộ tổng hợp âm thanh thủ tục (Procedural Sound Synthesizer):**
   - Game tích hợp hệ thống sinh âm thanh động trực tiếp bằng **Web Audio API** (tiếng chuông lấp lánh khi nhặt đom đóm, hợp âm lễ hội khi thắp đèn, tiếng chuông đồng khi tỏa sáng). Không cần bất kỳ file asset bên ngoài nào, đảm bảo load game siêu tốc và chạy mượt mà 100% offline.
3. **Hiệu ứng ánh sáng & Sương mù ban đêm:**
   - Đảo tròn được bao phủ bởi màn sương đen bí ẩn, các ngọn Đèn Lồng Lớn khi được thắp sáng sẽ tỏa ra luồng ánh sáng ấm áp màu vàng cam xua tan bóng tối xung quanh.
4. **Kiến trúc tách rời độc lập:**
   - Phần logic game (`src/core/engine.js`) hoàn toàn độc lập với phần render Three.js, đảm bảo đầu ra headless đúng 100% theo hợp đồng mà không bị ảnh hưởng bởi các hiệu ứng đồ họa thêm vào.

---

## 6. Cấu trúc Thư mục Dự án
```text
├── game.contract.json      # Đặc tả Test Contract v1.0 & thông số tuning
├── AGENTS.md               # Hướng dẫn quy ước cho AI Agent
├── server.js               # Web server phục vụ game 3D
├── src/
│   ├── core/
│   │   └── engine.js       # Core logic game tất định (dùng chung cho cả headless & UI)
│   ├── headless.js         # Headless CLI runner đạt chuẩn Contract
│   └── ui/
│       ├── index.html      # Giao diện người dùng & HUD
│       └── game.js         # Three.js 3D renderer & Web Audio synth
├── tests/                  # Bộ test tự động (determinism, pickup, lantern, pulse, shade)
├── docs/
│   ├── notes/              # Giả định kỹ thuật & nhật ký sử dụng AI
│   └── proof/              # Bằng chứng kiểm chứng cho từng phase
└── CREDITS.md              # Ghi nhận bản quyền và nguồn công nghệ
```

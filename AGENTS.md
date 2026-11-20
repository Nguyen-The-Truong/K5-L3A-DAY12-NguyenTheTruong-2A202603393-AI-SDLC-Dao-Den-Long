# Harness AI — Đảo Đèn Lồng

Tài liệu hướng dẫn và quy chuẩn cho AI Agent trong suốt quá trình phát triển dự án qua 4 phase.

## 1. Lệnh cơ bản
- **Cài đặt:** `npm install`
- **Biên dịch bundle:** `npm run build` (hoặc `npm run build:ui`)
- **Chạy toàn bộ test kiểm chứng:** `npm test`
- **Chạy game giao diện 3D:** `npm start`
- **Chạy headless theo Contract v1.1:**
  `node src/headless.js --seed 42 --night 2 --ticks 120 --out out.jsonl`

## 2. Kiến trúc cốt lõi (Bất biến)
1. **Core Simulation (`src/core/engine.js`)**:
   - Độc lập 100% với môi trường hiển thị (không dùng DOM, `window`, WebGL).
   - Mọi tính toán chạy ở 60 ticks/s, hoàn toàn tất định (deterministic) dựa trên seed (Mulberry32 PRNG).
   - Cả Headless CLI (`src/headless.js`) và Giao diện 3D (`src/ui/bundle.js`) đều dùng chung `engine.js`.
2. **Quy chuẩn Test Contract v1.1**:
   - Mọi thông số vật lý, bán kính và điểm số phải đọc từ `game.contract.json` (hoặc đồng bộ chính xác với `tuning`).
   - Tọa độ trong snapshot làm tròn đúng 3 chữ số thập phân (`round3`).
   - Mảng thực thể mới: `drifters`, `charms`, `motes` (kèm `kind`, `ttl_s`), `player` (kèm `vel`, `grounded`, `invuln`, `dash_cd_s`, `pulse_cd_s`, `charm_s`).
   - Sự kiện mới: `dash`, `charm_picked`, `drifter_steal`, `drifter_drop`, `night_start`, `paused`, `resumed`.
   - Dòng cuối cùng của file headless output bắt buộc phải là `{"type":"end", ...}`.
3. **Quy tắc sáng tạo thêm**:
   - Tính năng thêm ngoài PRD phải nằm ở cờ bật/tắt hoặc chỉ chạy trong mode UI, tuyệt đối **không làm đổi output của chế độ headless**.

## 3. Quy trình làm việc mỗi Phase
1. Đọc ticket -> Lập danh sách yêu cầu bắt buộc và giả định cho chỗ mơ hồ (`docs/notes/phase-N-spec.md`).
2. Viết scenario test cho yêu cầu mới **trước khi viết code**.
3. Cập nhật `src/core/engine.js` và `game.contract.json` nếu có tham số mới.
4. Chạy `npm test` để kiểm chứng cả tính năng mới và hồi quy tính năng cũ (tất cả các test phải ĐẠT).
5. Build lại bundle UI bằng `npm run build:ui`.
6. Thu thập bằng chứng vào `docs/proof/`, ghi chép vào `docs/notes/ai-log.md`.
7. Kiểm thử thực tế giao diện và chờ người dùng xác nhận trước khi commit và push tag `phase-N`.

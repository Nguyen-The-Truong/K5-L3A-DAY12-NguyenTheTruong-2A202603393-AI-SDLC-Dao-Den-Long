# Harness AI — Đảo Đèn Lồng

Tài liệu hướng dẫn và quy chuẩn cho AI Agent trong suốt quá trình phát triển dự án qua 4 phase.

## 1. Lệnh cơ bản
- **Cài đặt:** `npm install`
- **Chạy game giao diện 3D:** `npm start`
- **Chạy toàn bộ test kiểm chứng:** `npm test`
- **Chạy headless theo Contract:**
  `node src/headless.js --seed 42 --night 1 --ticks 120 --out out.jsonl`

## 2. Kiến trúc cốt lõi (Bất biến)
1. **Core Simulation (`src/core/engine.js`)**:
   - Độc lập 100% với môi trường hiển thị (không dùng DOM, `window`, WebGL).
   - Mọi tính toán chạy ở 60 ticks/s, hoàn toàn tất định (deterministic) dựa trên seed (Mulberry32 PRNG).
   - Cả Headless CLI (`src/headless.js`) và Giao diện 3D (`src/ui/game.js`) đều dùng chung `engine.js`.
2. **Quy chuẩn Test Contract**:
   - Mọi thông số vật lý, bán kính và điểm số phải đọc từ `game.contract.json` (hoặc đồng bộ chính xác với `tuning`).
   - Tọa độ trong snapshot làm tròn đúng 3 chữ số thập phân (`toFixed(3)`).
   - Sự kiện xảy ra ở tick nào phải ghi đúng `tick = current_tick`.
   - Dòng cuối cùng của file headless output bắt buộc phải là `{"type":"end", ...}`.
3. **Quy tắc sáng tạo thêm**:
   - Tính năng thêm ngoài PRD phải nằm ở cờ bật/tắt hoặc chỉ chạy trong mode UI, tuyệt đối **không làm đổi output của chế độ headless**.

## 3. Quy trình làm việc mỗi Phase
1. Đọc ticket -> Lập danh sách yêu cầu bắt buộc và giả định cho chỗ mơ hồ.
2. Viết scenario test cho yêu cầu mới **trước khi viết code**.
3. Cập nhật `src/core/engine.js` và `game.contract.json` nếu có tham số mới.
4. Chạy `npm test` để kiểm chứng cả tính năng mới và hồi quy tính năng cũ.
5. Thu thập bằng chứng vào `docs/proof/`, ghi chép vào `docs/notes/`.
6. Commit nhỏ, tạo git tag `phase-N` và push.

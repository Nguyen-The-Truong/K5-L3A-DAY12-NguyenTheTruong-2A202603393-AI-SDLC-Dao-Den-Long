# AI Development Log & Token Management · Phase 1

## 1. Công cụ & Quy trình AI
- Sử dụng trợ lý AI để phân tích yêu cầu PRD-0, trích xuất Test Contract v1.0, lập kế hoạch kiến trúc và sinh các kịch bản kiểm thử tự động.

## 2. Tối ưu hóa Context & Tiết kiệm Token
- **Kiến trúc lõi tập trung:** Gom toàn bộ logic vào `src/core/engine.js`. Cả headless runner và giao diện 3D đều dùng chung logic này, giảm thiểu việc sinh code trùng lặp và tiết kiệm đáng kể token khi cần bảo trì.
- **AGENTS.md ngắn gọn:** Tập trung vào lệnh build/test và các quy ước bất biến.
- **Batching thao tác:** Gom các bước kiểm tra và sinh file vào một lượt gọi.

## 3. Nhật ký Phát hiện Lỗi & Cải tiến
- **Xử lý Rising Edge:** Đảm bảo các phím hành động (interact, pulse) chỉ kích hoạt khi giá trị chuyển từ false sang true để tránh kích hoạt liên tục trong nhiều tick.
- **Làm tròn tọa độ:** Đảm bảo mọi tọa độ trong snapshot được làm tròn 3 chữ số thập phân (`round3`).
- **Tất định (Determinism):** Áp dụng thuật toán sinh số giả ngẫu nhiên Mulberry32 với seed cố định để đảm bảo mọi lần chạy kịch bản đều cho kết quả giống hệt nhau.

## 4. Ước tính Token & Chi phí
- Input: ~25,000 tokens
- Output: ~6,000 tokens
- Chi phí ước tính: < $0.01

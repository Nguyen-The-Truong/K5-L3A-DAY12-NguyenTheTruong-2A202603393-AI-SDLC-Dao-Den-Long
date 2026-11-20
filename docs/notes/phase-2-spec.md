# Đặc Tả Kỹ Thuật & Giả Định (Spec & Assumptions) · Phase 2

Tài liệu chi tiết theo TICKET-02 — "Ba hòn đảo" (Contract v1.1).

---

## 1. Tiêu Chí Nghiệm Thu (Acceptance Criteria) Từng Tính Năng

### A. Vật Lý & Điều Khiển Chuẩn Hóa
- **Tốc độ chạy:** `6.0 m/s`. Tăng tốc và dừng tức thì trong $\le 0.1\text{ s}$ (1 tick).
- **Nhảy:** Vận tốc ban đầu $7.0\text{ m/s}$, trọng lực $-20.0\text{ m/s}^2$. Chỉ được nhảy khi đang chạm đất (`grounded === true`).
- **Lướt (Dash):**
  - Tốc độ $14.0\text{ m/s}$, thời gian $0.2\text{ s}$ (12 ticks), hồi chiêu $1.5\text{ s}$ (90 ticks).
  - Lướt theo hướng đang di chuyển; nếu đứng yên thì lướt theo hướng quay mặt.
  - Lướt trên không giữ nguyên độ cao Y ($v_y = 0$).
  - Không bất tử khi lướt.
  - Khi có Bùa Gió (Charm): Hồi chiêu lướt = $0$.
- **Rơi khỏi đảo ($Y < -10$):**
  - Xảy ra đúng 1 lần, bỏ qua bất tử: trừ 1 Ngọn Lửa, rơi toàn bộ đom đóm mang theo.
  - Chờ 60 ticks (không nhặt đom đóm, không bị quỷ chạm).
  - Hồi sinh tại vị trí xuất phát với vận tốc 0 và 90 ticks bất tử.
  - Nếu hết Ngọn Lửa $\rightarrow$ thua ngay lập tức (`no_flames`).

### B. Ba Bản Đồ Hòn Đảo Chuẩn
- **Đêm 1 — Đảo Bến:**
  - 1 đảo tròn bán kính $R = 40\text{ m}$. Đồi thấp thoai thoải ở tâm.
  - 5 Đèn Lồng Lớn. 20 đom đóm ban đầu, trần 30.
  - Bóng Mực sinh từ tick 300 (2 con ban đầu, sau đó mỗi 480 ticks thêm 1 con).
- **Đêm 2 — Đảo Cau:**
  - Hai đảo song sinh bán kính $R = 28\text{ m}$, tâm tại $(-32, 0, 0)$ và $(32, 0, 0)$.
  - Cầu nối dài $16\text{ m}$, rộng $4\text{ m}$ tại độ cao $Y = 0$.
  - 2 Bục nhảy:
    - Vị trí: $(-18, 0, -12)$ hướng sang đảo phải; $(18, 0, 12)$ hướng sang đảo trái.
    - Kích hoạt khi chân Mây cách tâm bục $\le 1.5\text{ m}$.
    - Vận tốc phóng: $v_y = 14.0\text{ m/s}$, vận tốc ngang $24.0\text{ m/s}$ dọc theo hướng cầu nối.
  - 6 Đèn Lồng Lớn (3 đèn mỗi bên đảo).
  - Bùa Gió C1 nằm ở chính giữa cầu $(0, 0, 0)$.
  - Gió Lạc sinh từ tick 360 (chu kỳ 600 ticks).
- **Đêm 3 — Đảo Chuông:**
  - 3 tầng đồng tâm:
    - Tầng 1: $R = 48\text{ m}$, $Y = 0\text{ m}$.
    - Tầng 2: $R = 32\text{ m}$, $Y = 4\text{ m}$.
    - Tầng 3: $R = 16\text{ m}$, $Y = 8\text{ m}$.
    - Tháp Chuông ở đỉnh: $R = 4\text{ m}$, $Y = 12\text{ m}$.
  - 2 Đường dốc thoải (Ramps) kết nối các tầng.
  - 7 Đèn Lồng Lớn rải đều các tầng.
  - Hiệu ứng Gió: Thổi định kỳ từ tâm ra mép đảo với gia tốc ngang $2.5\text{ m/s}^2$ khi Mây ở tầng 2 và 3.
  - Bóng Mực di chuyển nhanh hơn ($4.5\text{ m/s}$).

### C. Thực Thể Mới: Gió Lạc (Drifter) & Bùa Gió (Charm)
- **Gió Lạc (`drifter`):**
  - Định danh: D1, D2, ...
  - AI trạng thái:
    - `idle` / `wander`: Lang thang quanh đảo.
    - `chase`: Khi Mây mang $\ge 5$ đom đóm và khoảng cách $3D \le 15\text{ m}$, chuyển sang đuổi Mây với tốc độ $5.0\text{ m/s}$.
    - `flee`: Khi chạm Mây, đánh cắp $\min(3, \text{carried})$ đom đóm, phát sự kiện `drifter_steal` và bỏ chạy với tốc độ $6.0\text{ m/s}$ ra rìa đảo.
    - Bị Tỏa Sáng (Pulse): Rơi toàn bộ số đom đóm đã trộm tại vị trí hiện tại, phát sự kiện `drifter_drop`.
- **Bùa Gió (`charm`):**
  - Định danh: C1.
  - Khi nhặt (khoảng cách $XZ \le 1.0\text{ m}$): Buff kích hoạt trong 600 ticks (10 giây).
  - Hiệu ứng: Tốc độ Mây tăng lên $7.2\text{ m/s}$, hồi chiêu Lướt bằng 0.
  - Thời gian hồi sinh bùa: 2700 ticks (45 giây).

### D. Cơ Chế Tạm Dừng (Pause)
- Nhấn phím `Esc` để chuyển đổi trạng thái tạm dừng.
- Khi tạm dừng: `sim_tick` ngừng đếm, mọi bộ đếm đóng băng, phát sự kiện `paused`.
- Khi tiếp tục: Khôi phục hoạt động mô phỏng, phát sự kiện `resumed`.

### E. Giao Diện & Âm Thanh (UI & HUD)
- Bộ chuyển đổi trực tiếp Đêm 1 / Đêm 2 / Đêm 3 ngay trên thanh điều khiển.
- Đồng hồ đếm ngược định dạng `mm:ss`, chuyển đỏ nhấp nháy khi thời gian $\le 30\text{ s}$.
- Bộ đếm đom đóm 10 chấm tròn sinh động.
- Card hồi chiêu Lướt và Tỏa Sáng trực quan.
- Hiển thị gợi ý phím bấm khi lại gần Đèn Lồng Lớn.
- Hệ thống âm thanh tổng hợp thời gian thực Web Audio API: tiếng nhảy, tiếng lướt gió, chuông nhặt đom đóm, tiếng nạp đèn và tiếng va chạm quỷ.

---

## 2. Tiêu Chuẩn Hiệu Năng Headless
- Yêu cầu: Chạy 1 đêm đủ 21,600 ticks trong $\le 30\text{ s}$.
- Kết quả đo đạc thực tế: **0.26 giây** (~83,000 ticks/giây).

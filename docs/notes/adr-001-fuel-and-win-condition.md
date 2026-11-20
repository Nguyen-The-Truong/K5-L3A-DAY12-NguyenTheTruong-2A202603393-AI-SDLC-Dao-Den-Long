# ADR 001: Quản lý Nhiên liệu Đèn Lồng (Fuel Decay) & Thay đổi Luật Thắng "Giữ đảo sáng tới bình minh"

- **Trạng thái:** Accepted
- **Ngày:** 2026-11-20
- **Tác giả:** Nguyễn Thế Trường (MSSV: 2A202603393 - Lớp: K5-L3A)
- **Áp dụng cho:** Phase 3 (TICKET-03 — Contract v1.2)

---

## 1. Bối cảnh (Context)
Trong Phase 1 và Phase 2, luật chơi quy định:
- Đèn đã thắp sẽ sáng vĩnh viễn và không nhận thêm đom đóm.
- Trò chơi kết thúc thắng ngay lập tức khi tất cả đèn trên đảo được thắp sáng.
- Bóng Mực (Shade) tuyệt đối không thể xâm nhập vào vùng an toàn bán kính 6.0m của đèn đã thắp.

**Vấn đề:**
Kết quả playtest cho thấy người chơi có kỹ năng có thể thắp toàn bộ đèn chỉ trong vòng 2 phút, dẫn tới việc Đêm kết thúc quá sớm và thiếu đi yếu tố thử thách, căng thẳng ở giai đoạn nửa cuối Đêm.

---

## 2. Quyết định Thiết kế (Design Decisions)

### 2.1. Nhiên liệu Đèn và Cơ chế Hao hụt (Lantern Fuel Decay & Relight)
- **Dung lượng tối đa:** Mỗi đèn lồng có `fuel_max = 100`.
- **Giá trị ban đầu khi thắp:** Khi thắp sáng (lần đầu hoặc thắp lại), `fuel = 100`.
- **Hao hụt tự nhiên:** Đèn đang sáng tiêu hao $1.0\text{ unit/s}$ (tương đương $1/60$ đơn vị mỗi tick logic).
- **Độ chính xác nguyên (Integer-Tick Precision):** Để triệt tiêu sai số dấu phẩy động (floating-point drift) qua hàng chục nghìn ticks mô phỏng, `GameEngine` lưu trữ nhiên liệu dưới dạng đơn vị nguyên `fuel_units` ($6000\text{ units} = 100.0\text{ fuel}$, mỗi tick trừ $1\text{ unit}$).
- **Hết dầu (`fuel <= 0`):** Đèn bị tắt, phát sinh sự kiện `lantern_out { lantern_id }`, chuyển sang trạng thái tắt (`lit = false`, `deposited = 0`). Đèn lưu cờ `ever_lit = true`.
- **Thắp lại (Relight):** Đèn đã từng sáng (`ever_lit = true`) chỉ yêu cầu 5 đom đóm để thắp lại (`relight_cost = 5`), phát sự kiện `lantern_lit { lantern_id, relight: true }` và cộng 40 điểm. Đèn chưa từng sáng vẫn yêu cầu 10 đom đóm.
- **Châm dầu (Refuel):** Người chơi có thể tương tác với đèn đang sáng nếu `fuel < 100`. Số đom đóm sử dụng: $\text{used} = \min(\text{carried}, \lceil (100 - \text{fuel}) / 10 \rceil)$. Mỗi đom đóm hồi 10 fuel. Phát sự kiện `refuel { lantern_id, amount, fuel }`.

### 2.2. Bóng Mực Hút Dầu (Shade Oil Drain)
- **Mất vùng an toàn:** Đèn có `fuel < 30` sẽ mất hoàn toàn vùng an toàn (safe zone radius 6m).
- **Hành vi `drain`:** Bóng Mực ở trạng thái `wander` sẽ ưu tiên tìm đến đèn sáng có `fuel < 30` gần nhất. Khi tiến vào cự ly $\le 2.0\text{m}$ (XZ), Bóng Mực chuyển sang trạng thái mới `drain`, đứng yên và hút $5.0\text{ fuel/s}$ ($5/60$ đơn vị/tick, tương đương 5 units/tick). Đèn đồng thời vẫn bị trừ $1/60$ hao hụt tự nhiên, tổng tốc độ tụt là $6/60\text{ fuel/tick}$.
- **Sự kiện & Điểm thưởng:** Cứ mỗi 60 tick ở trạng thái `drain`, Bóng Mực phát sự kiện `fuel_drain { lantern_id, shade_id, fuel }`. Nếu người chơi dùng Tỏa Sáng (Pulse) trúng Bóng Mực đang drain, nhận thêm điểm thưởng đặc biệt $+15$ điểm (thay vì $+5$).
- **Thoát khỏi `drain`:** Bóng Mực chuyển sang `chase` nếu Mây lại gần $\le 6.0\text{m}$; chuyển về `wander` nếu đèn tắt, nếu đèn được châm dầu $\ge 30$, hoặc bị đẩy xa $> 2.0\text{m}$.

### 2.3. Thay đổi Điều kiện Thắng (Win Condition: "Giữ đảo sáng tới bình minh")
- **Bãi bỏ kết thúc sớm:** Thắp đủ 100% đèn không kết thúc Đêm ngay.
- **Thời lượng Đêm:** Đêm 1: 240s (14,400 ticks), Đêm 2: 270s (16,200 ticks), Đêm 3: 300s (18,000 ticks).
- **Điều kiện Thắng:** Trò chơi chỉ phân định thắng/thua khi hết giờ (bình minh). Người chơi thắng (`result: won`, `reason: dawn_survived`) khi và chỉ khi Mây còn sống (flames > 0) và số đèn đang sáng tại tick cuối cùng đạt tối thiểu $\lceil 0.6 \times \text{tổng đèn} \rceil$:
  - Đêm 1: $\ge 3 / 5$ đèn sáng.
  - Đêm 2: $\ge 4 / 6$ đèn sáng.
  - Đêm 3: $\ge 5 / 7$ đèn sáng.
- **Điều kiện Thua:** Hết Ngọn Lửa (`reason: no_flames`) tại bất kỳ tick nào, hoặc hết giờ mà không đủ ngưỡng đèn sáng tối thiểu (`reason: dawn`).

### 2.4. Sức chứa Tăng dần (Dynamic Mote Capacity)
- Sức chứa đom đóm của Mây mở rộng theo công thức:
  $$\text{capacity} = \min(20, 10 + 2 \times \text{successful\_lights})$$
  với `successful_lights` là số lần thắp sáng đèn thành công (cả lần đầu lẫn thắp lại).

---

## 3. Hệ quả (Consequences)
- **Tác động tích cực:** Trò chơi giữ được nhịp độ căng thẳng xuyên suốt cả màn chơi, buộc người chơi phải liên tục tuần tra, bảo trì nhiên liệu cho các ngọn đèn và xua đuổi Bóng Mực đang rình rập hút dầu.
- **Tác động kiểm thử:** Bộ unit test cũ kỳ vọng game kết thúc ngay khi thắp hết đèn (`scenario_lantern.test.js`) đã được điều chỉnh có chủ đích để mô phỏng sống sót tới bình minh và kiểm chứng `dawn_survived`.
- **Khả năng tương thích:** Test Contract nâng cấp lên `v1.2` hoàn toàn nhất quán giữa engine core, headless runner và giao diện 3D Three.js.

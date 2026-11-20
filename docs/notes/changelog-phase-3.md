# Changelog — Phase 3 (TICKET-03: Change Request "Đèn cạn dầu")

Tất cả các thay đổi cốt lõi, breaking changes và tính năng mới được triển khai trong Phase 3 tuân thủ Test Contract v1.2.

---

## 1. Breaking Changes (Thay đổi Luật Cốt lõi)

| Luật Cũ (Phase 1 & 2) | Luật Mới (Phase 3) | Lý do Thay đổi |
|:---|:---|:---|
| **Đèn đã sáng không nhận thêm đom đóm** | Đèn có nhiên liệu tối đa 100, tiêu hao tự nhiên 1.0 unit/s ($1/60$ tick). Cho phép tương tác châm thêm dầu khi `fuel < 100`. Hết dầu (`fuel <= 0`) đèn sẽ bị tắt. | Tăng tính chiến thuật và yêu cầu người chơi phải tuần tra bảo trì ngọn lửa. |
| **Chi phí thắp đèn luôn cố định 10 đom đóm** | Thắp lần đầu: 10 đom đóm (+100 điểm, `relight: false`). Thắp lại đèn đã từng tắt: chỉ 5 đom đóm (+40 điểm, `relight: true`). | Giảm áp lực gom đom đóm khi thắp lại ngọn đèn bị tắt. |
| **Bóng Mực tuyệt đối không bao giờ vào vùng an toàn 6m** | Đèn có `fuel < 30` mất vùng an toàn. Bóng Mực ở trạng thái `wander` sẽ tiếp cận và chuyển sang `drain`, đứng yên hút 5 fuel/s ($5/60$ tick). | Tạo mối đe dọa trực tiếp lên các ngọn đèn yếu thế. |
| **Thắng ngay khi tất cả đèn trên đảo được thắp sáng** | Không còn thắng sớm. Thời lượng đêm: 240s / 270s / 300s. Thắng khi sống sót tới bình minh và số đèn đang sáng $\ge \lceil 0.6 \times \text{tổng đèn} \rceil$. | Duy trì thử thách liên tục từ đầu tới cuối đêm. |
| **Sức chứa đom đóm cố định 10 con** | Sức chứa mở rộng động: $\text{capacity} = \min(20, 10 + 2 \times \text{successful\_lights})$. | Tưởng thưởng cho nỗ lực thắp đèn liên tục của người chơi. |
| **Công thức tính điểm cũ** | Điểm số chuẩn hóa theo Contract v1.2: Nạp đom đóm: +5/con; Thắp lần đầu: +100; Thắp lại: +40; Pulse trúng: +5 (hoặc +15 nếu trúng bóng đang drain); Bình minh thắng: mỗi đèn sáng $+50 + \lfloor\text{fuel}\rfloor$, mỗi Ngọn Lửa $+50$. Bỏ thưởng thời gian thừa. | Phù hợp với cơ chế giữ đảo sáng tới bình minh. |

---

## 2. New Features & Contract v1.2 Additions

1. **Lantern State Machine:**
   - Trường trạng thái mới: `fuel` ($0.0 \dots 100.0$), `ever_lit` (boolean), `relit_count` (int).
   - Sự kiện mới:
     - `refuel { lantern_id, amount, fuel }`
     - `lantern_out { lantern_id }`
     - `lantern_lit { lantern_id, relight: bool }`
     - `fuel_drain { lantern_id, shade_id, fuel }`
2. **Shade `drain` State:**
   - Trạng thái mới: `drain`. Tự động chuyển đổi mượt mà sang `chase` khi Mây vào trong 6m, hoặc về `wander` khi đèn tắt / fuel $\ge 30$ / khoảng cách $> 2\text{m}$.
   - Tỏa Sáng trúng Bóng Mực đang drain thưởng $+15$ điểm.
3. **Colorblind Accessibility Mode (Chế độ Mù màu):**
   - Tùy chọn "Bảng màu dễ phân biệt" được lưu trong `localStorage`.
   - Viền và mắt Bóng Mực đổi thành `#00B3FF`.
   - Biểu tượng cảnh báo nguy cấp `⚠` kèm chữ màu `#FFFFFF`.
   - Đèn tắt bị xẹp 20% chiều cao (`scale.y = 0.8`).
   - Đèn yếu dầu (`fuel < 30`) và thanh dầu nhấp nháy tần số 1 Hz.
4. **3D UI Fuel Bars:**
   - Thanh nhiên liệu 3D hiển thị trực tiếp trên đầu mỗi ngọn đèn lồng đang sáng, tự động billboard hướng về camera người chơi.
5. **Headless CLI Compatibility:**
   - Tham số `--out` trở thành tùy chọn. Khi không truyền `--out`, công cụ sẽ chạy benchmark toàn bộ ticks và in bảng số liệu chi tiết.

# Phase 1 Specification & Assumptions · Đảo Đèn Lồng

Tài liệu giải thích các giả định kỹ thuật và thông số cho Phase 1 (PRD-0).

## 1. Không gian & Tọa độ
- **Đảo Bến:** Đảo hình tròn có bán kính 38 mét, tâm tại (0, 0, 0), mặt đất tại Y = 0.
- **Hệ trục:** Trục Y hướng lên; XZ là mặt phẳng ngang. Người chơi xuất phát tại vị trí (0, 0, 0).
- **Quy đổi góc camera:** Với góc quay theta (cam_yaw_deg), vector di chuyển thế giới được tính theo công thức:
  - x' = x * cos(theta) + z * sin(theta)
  - z' = -x * sin(theta) + z * cos(theta)

## 2. Thông số điều chỉnh (Tuning)
Các giá trị được cấu hình trong `game.contract.json`:
- `player_speed`: 6.0 m/s
- `carry_capacity`: 5 đom đóm
- `lantern_cost`: 3 đom đóm để thắp sáng 1 đèn
- `lantern_count_night1`: 5 Đèn Lồng Lớn
- `pickup_radius`: 2.0 mét
- `interact_radius`: 2.5 mét
- `pulse_cost`: 1 đom đóm
- `pulse_radius`: 6.0 mét
- `pulse_stun_s`: 3.0 giây
- `pulse_push_m`: 2.0 mét
- `pulse_cooldown_s`: 1.0 giây
- `night1_duration_s`: 180 giây (3 phút)
- `flames`: 3 ngọn lửa (máu)
- `invuln_s`: 2.0 giây bất tử sau va chạm
- `hit_drop_ratio`: 0.5 (rơi 50% số đom đóm khi bị chạm)
- `safe_radius`: 4.0 mét quanh đèn đã thắp
- `shade_speed`: 3.2 m/s
- `shade_hit_radius`: 1.2 mét
- `fall_enabled`: false

## 3. Cơ chế Điểm & Điều kiện Kết thúc
- Nhặt đom đóm: +10 điểm
- Thắp sáng đèn: +100 điểm
- Làm choáng Bóng Mực: +20 điểm
- Thưởng thắng: +5 điểm mỗi giây còn lại, +50 điểm mỗi ngọn lửa còn lại.
- Thắng: cả 5 đèn đều lit (all_lit).
- Thua: hết ngọn lửa (no_flames) hoặc hết thời gian (dawn).

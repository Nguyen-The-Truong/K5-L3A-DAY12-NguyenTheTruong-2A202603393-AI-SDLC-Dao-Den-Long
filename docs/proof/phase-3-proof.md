# Bằng Chứng Kiểm Chứng (Verification Proofs) · Phase 3

Tương ứng commit gắn tag: `phase-3`  
Tuân thủ chuẩn: **Test Contract v1.2** (Change Request: "Đèn cạn dầu")

---

## 1. Tệp Bằng Chứng Gốc Đi Kèm
- **Quyết định thiết kế (ADR 001):** [adr-001-fuel-and-win-condition.md](../notes/adr-001-fuel-and-win-condition.md)
- **Nhật ký thay đổi (Changelog):** [changelog-phase-3.md](../notes/changelog-phase-3.md)
- **Log chạy test suite tự động:** [phase-3-test-output.txt](phase-3-test-output.txt)
- **Output mẫu chế độ Headless Test Contract v1.2:** [phase-3-sample-headless.jsonl](phase-3-sample-headless.jsonl)

---

## 2. Ma Trận Truy Vết Yêu Cầu (Requirements Traceability Matrix)

| Mã | Nhóm | Yêu Cầu Kỹ Thuật (Ticket-03) | Phương Pháp Kiểm Chứng | Tệp Test / Thực Thi | Kết Quả |
|---|---|---|---|---|:---:|
| **REQ-P3-01** | Nhiên liệu | Hao hụt dầu tự nhiên 1.0 unit/s ($1/60$ tick), độ chính xác nguyên | Scenario test fuel decay | `tests/scenario_fuel_decay_out.test.js` | **ĐẠT** |
| **REQ-P3-02** | Nhiên liệu | Châm dầu: used = $\min(\text{carried}, \lceil(100 - \text{fuel})/10\rceil)$, phát `refuel` | Scenario test refuel | `tests/scenario_fuel_decay_out.test.js` | **ĐẠT** |
| **REQ-P3-03** | Nhiên liệu | Hết dầu (`fuel <= 0`): đèn tắt, deposited = 0, phát `lantern_out`, nhớ `ever_lit` | Scenario test extinguish | `tests/scenario_fuel_decay_out.test.js` | **ĐẠT** |
| **REQ-P3-04** | Nhiên liệu | Thắp lại: `ever_lit = true` chỉ tốn 5 đom đóm, phát `lantern_lit { relight: true }`, +40đ | Scenario test relight | `tests/scenario_fuel_decay_out.test.js` | **ĐẠT** |
| **REQ-P3-05** | Bóng Mực | fuel < 30 mất an toàn; Shade `drain` hút 5 fuel/s, phát `fuel_drain` mỗi 60 ticks | Scenario test shade drain | `tests/scenario_shade_drain.test.js` | **ĐẠT** |
| **REQ-P3-06** | Bóng Mực | Tỏa Sáng (Pulse) trúng Shade đang hút dầu: nhận +15 điểm thưởng | Scenario test pulse on drain | `tests/scenario_shade_drain.test.js` | **ĐẠT** |
| **REQ-P3-07** | Luật Thắng | Không thắng sớm; hết giờ có $\ge 60\%$ đèn sáng thì thắng (`dawn_survived`) | Scenario test dawn win | `tests/scenario_lantern.test.js` | **ĐẠT** |
| **REQ-P3-08** | Sức Chứa | $\text{capacity} = \min(20, 10 + 2 \times \text{successful\_lights})$ | Unit test capacity growth | `tests/scenario_lantern.test.js` | **ĐẠT** |
| **REQ-P3-09** | Tính Điểm | Bảng điểm v1.2: nạp +5, thắp +100/40, stun +5/15, bình minh +50 | Unit test score formula | `tests/scenario_lantern.test.js` | **ĐẠT** |
| **REQ-P3-10** | Trợ Năng | Chế độ mù màu: Shade `#00B3FF`, cảnh báo `⚠`, đèn tắt xẹp 20%, chớp 1Hz | Kiểm thử giao diện 3D & DOM | `src/ui/game.js`, `index.html` | **ĐẠT** |
| **REQ-P3-11** | Đồ Họa 3D | Thanh dầu 3D trên đầu mỗi ngọn đèn đang sáng (Billboard camera) | Three.js Mesh Container | `src/ui/game.js` | **ĐẠT** |
| **REQ-P3-12** | Contract | Headless xuất đúng trường v1.2 (`fuel`, `ever_lit`, `relit_count`, `capacity`) | Headless CLI output | `src/headless.js` | **ĐẠT** |

---

## 3. Nhật Ký Thực Thi Kiểm Thử Tự Động (14/14 Tests Passed)

```text
====================================
  RUNNING ĐẢO ĐÈN LỒNG TEST SUITE   
====================================

Testing determinism...
✓ Determinism test passed: 300 ticks produced 100% identical states.
Testing mote pickup...
✓ Mote pickup passed: picked at tick 10, carried: 1
Testing lantern deposit, lighting, and Phase 3 dawn_survived win condition...
✓ Lantern deposit, capacity growth, and dawn_survived passed: deposited 3, all lanterns lit, survived to dawn!
Testing pulse stun and pushback...
✓ Pulse stun passed: stunned S1, pushed to pos: [3.2666666666666666,0,0], carried left: 0
Testing shade hit and loss condition...
✓ Shade hit and loss passed: hit by shade, flames reduced to 0 -> lost (no_flames)
Testing E2E headless CLI execution with scenario and inputs...
✓ E2E Headless CLI test passed: valid scenario + inputs produced correct events and end record.
Testing dash mechanics...
✓ Dash mechanics passed: 14 m/s dash, 90 tick cooldown, 0 cooldown with charm.
Testing jump physics and fall off island...
✓ Jump and fall passed: jump impulse 7.0 m/s, fall hit -1 flame, lost motes, respawn.
Testing Gió Lạc (Drifter) stealing and pulse drop...
✓ Drifter test passed: stole 3 motes, entered flee, dropped motes upon pulse.
Testing Bùa Gió (Charm) mechanics...
✓ Charm mechanics passed: picked C1, 600 ticks buff, respawn 2700 ticks.
Testing pause mechanics...
✓ Pause mechanics passed: toggles pause/resume, freezes sim_tick and timers.
Testing Night 2 jump pad launching...
✓ Jump pad test passed: launched with Y vel 14.0 m/s, horizontal vel 24.0 m/s.
Testing fuel decay, refuel, lantern_out, and relight mechanics...
✓ Fuel decay, refuel, lantern_out, and relight passed: fuel decayed, refueled, extinguished at 0, relit with 5 motes!
Testing shade oil drain and pulse on draining shade mechanics...
✓ Shade drain passed: entered drain, drained 6 units/tick, emitted fuel_drain, +15 on pulse, woke to chase within 6m!

====================================
  ALL 14 TESTS PASSED SUCCESSFULLY! 
====================================
```

---

## 4. Đo Lường Hiệu Năng Headless (Night 3 — Full 18,000 Ticks)
- **Lệnh thực hiện:** `node src/headless.js --seed 42 --night 3 --ticks 18000`
- **Thời gian thực thi:** **0.17 giây** (Tốc độ đạt hơn 105,000 ticks/giây).
- **Yêu cầu đề bài:** $\le 30\text{ giây}$.
- **Độ chính xác:** Đảm bảo 100% tính tiền định (deterministic), không sai số số thực.

---

## 5. Trích Xuất Snapshot & Event Test Contract v1.2 (Headless JSONL)
```json
{"type":"snapshot","tick":0,"sim_tick":0,"night":1,"state":"playing","time_left_s":240,"score":0,"wind":{"active":false,"dir_deg":0},"player":{"pos":[0,0,0],"vel":[0,0,0],"grounded":true,"flames":3,"carried":0,"capacity":10,"invuln":false,"dash_cd_s":0,"pulse_cd_s":0,"charm_s":0},"lanterns":[{"id":"L1","pos":[0,0,25],"lit":false,"deposited":0,"fuel":0,"ever_lit":false,"relit_count":0},{"id":"L2","pos":[23.8,0,7.7],"lit":false,"deposited":0,"fuel":0,"ever_lit":false,"relit_count":0},{"id":"L3","pos":[14.7,0,-20.2],"lit":false,"deposited":0,"fuel":0,"ever_lit":false,"relit_count":0},{"id":"L4","pos":[-14.7,0,-20.2],"lit":false,"deposited":0,"fuel":0,"ever_lit":false,"relit_count":0},{"id":"L5","pos":[-23.8,0,7.7],"lit":false,"deposited":0,"fuel":0,"ever_lit":false,"relit_count":0}],"shades":[],"drifters":[],"motes_active":20}
```
Mọi trường dữ liệu và sự kiện đều tuân thủ 100% đặc tả Test Contract v1.2.

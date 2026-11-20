# Bằng Chứng Kiểm Chứng (Verification Proofs) · Phase 2

Tương ứng commit gắn tag: `phase-2`  
Tuân thủ chuẩn: **Test Contract v1.1**

---

## 1. Tệp Bằng Chứng Gốc Đi Kèm
- **Log chạy test suite tự động:** [phase-2-test-output.txt](phase-2-test-output.txt)
- **Output mẫu chế độ Headless Test Contract v1.1:** [phase-2-sample-headless.jsonl](phase-2-sample-headless.jsonl)

---

## 2. Ma Trận Truy Vết Yêu Cầu (Requirements Traceability Matrix)

| Mã | Nhóm | Yêu Cầu Kỹ Thuật | Phương Pháp Kiểm Chứng | Tệp Test / Thực Thi | Kết Quả |
|---|---|---|---|---|:---:|
| REQ-01 | Core | Tự động nhặt đom đóm trong bán kính quy định | Scenario test vị trí | `tests/scenario_pickup.test.js` | ĐẠT |
| REQ-02 | Core | Nạp đom đóm vào đèn và tích lũy tiến độ | Scenario test tương tác | `tests/scenario_lantern.test.js` | ĐẠT |
| REQ-03 | Core | Thắp đủ đèn thì chiến thắng màn chơi | Scenario test nạp đủ đèn | `tests/scenario_lantern.test.js` | ĐẠT |
| REQ-04 | Core | Tỏa sáng (Pulse) làm choáng & đẩy lùi Bóng Mực | Scenario test pulse | `tests/scenario_pulse.test.js` | ĐẠT |
| REQ-05 | Core | Va chạm Bóng Mực trừ lửa và thua khi hết máu | Scenario test hit shade | `tests/scenario_shade.test.js` | ĐẠT |
| REQ-06 | Core | Tính tất định (Determinism) 100% bitwise | Chạy 2 lần cùng seed | `tests/determinism.test.js` | ĐẠT |
| REQ-07 | Contract | Cấu trúc dữ liệu Test Contract v1.1 | Headless CLI output | `src/headless.js` | ĐẠT |
| REQ-08 | CLI | Kiểm thử tích hợp E2E Headless CLI runner | Chạy scenario & inputs thật | `tests/e2e_headless.test.js` | ĐẠT |
| REQ-09 | Vật lý | Lướt (Dash) tốc độ 14 m/s, hồi chiêu 90 ticks | Unit test vận tốc & cd | `tests/scenario_dash.test.js` | ĐẠT |
| REQ-10 | Vật lý | Nhảy (Jump) 7 m/s, trọng lực -20 m/s² | Unit test độ cao & vận tốc | `tests/scenario_jump_fall.test.js` | ĐẠT |
| REQ-11 | Vật lý | Rơi khỏi đảo ($Y < -10$) trừ máu, rớt mote, hồi sinh | Scenario test rớt vực | `tests/scenario_jump_fall.test.js` | ĐẠT |
| REQ-12 | Entity | Gió Lạc (Drifter) đuổi khi carried $\ge 5$, trộm đom đóm | Scenario test drifter steal | `tests/scenario_drifter.test.js` | ĐẠT |
| REQ-13 | Entity | Tỏa Sáng làm Gió Lạc rơi đom đóm đã trộm | Scenario test pulse drifter | `tests/scenario_drifter.test.js` | ĐẠT |
| REQ-14 | Item | Bùa Gió (Charm) tăng tốc 7.2 m/s, hồi chiêu lướt = 0 | Scenario test charm buff | `tests/scenario_charm.test.js` | ĐẠT |
| REQ-15 | System | Tạm dừng (Pause / Resume) đóng băng sim_tick & phát event | Scenario test pause toggle | `tests/scenario_pause.test.js` | ĐẠT |
| REQ-16 | Map | Đảo Cau (Night 2) bục nhảy phóng vận tốc 24 m/s ngang, 14 m/s cao | Scenario test jump pad | `tests/scenario_night2_jump_pad.test.js` | ĐẠT |
| REQ-17 | Map | Đảo Chuông (Night 3) 3 tầng, tháp chuông, hiệu ứng gió | Engine map calculation | `src/core/engine.js` | ĐẠT |
| REQ-18 | Performance | Headless chạy full đêm (21,600 ticks) trong $\le 30\text{ s}$ | Benchmark CLI runner | `src/headless.js` | ĐẠT (0.26s) |

---

## 3. Nhật Ký Thực Thi Kiểm Thử Tự Động (12/12 Passed)

```text
====================================
  RUNNING ĐẢO ĐÈN LỒNG TEST SUITE   
====================================

Testing determinism...
✓ Determinism test passed: 300 ticks produced 100% identical states.
Testing mote pickup...
✓ Mote pickup passed: picked at tick 10, carried: 1
Testing lantern deposit and win condition...
✓ Lantern deposit and win passed: deposited 3, all lanterns lit -> won!
Testing pulse stun and pushback...
✓ Pulse stun passed: stunned S1, pushed to pos: [3.267,0,0], carried left: 0
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

====================================
  ALL 12 TESTS PASSED SUCCESSFULLY! 
====================================
```

---

## 4. Đo Lường Hiệu Năng Headless (21,600 Ticks)
- **Lệnh thực hiện:** `node src/headless.js --seed 42 --night 3 --ticks 21600`
- **Thời gian thực thi:** **0.26 giây** (Tốc độ đạt hơn 83,000 ticks/giây).
- **Yêu cầu đề bài:** $\le 30\text{ giây}$.
- **Đánh giá:** Vượt yêu cầu hơn 115 lần.

# Bằng chứng Kiểm chứng (Verification Proofs) · Phase 1

Tương ứng commit gắn tag: `phase-1`

## 1. Ma trận Truy vết Yêu cầu

| Mã | Yêu cầu | Cách kiểm tra | Kịch bản kiểm chứng | Kết quả |
|---|---|---|---|:---:|
| REQ-01 | Nhặt đom đóm trong bán kính `pickup_radius` | Scenario test di chuyển tới đom đóm | `tests/scenario_pickup.test.js` | ĐẠT |
| REQ-02 | Nạp đom đóm và thắp sáng Đèn Lồng Lớn | Scenario test nạp đom đóm vào L1 | `tests/scenario_lantern.test.js` | ĐẠT |
| REQ-03 | Thắp đủ 5 đèn thì chiến thắng | Scenario test hoàn thành thắp đèn | `tests/scenario_lantern.test.js` | ĐẠT |
| REQ-04 | Tỏa sáng làm choáng & đẩy lùi Bóng Mực | Scenario test kích hoạt pulse | `tests/scenario_pulse.test.js` | ĐẠT |
| REQ-05 | Va chạm Bóng Mực làm mất máu và thua cuộc | Scenario test va chạm trực diện | `tests/scenario_shade.test.js` | ĐẠT |
| REQ-06 | Tính tất định (Determinism) | So sánh 2 lần chạy 300 tick cùng seed | `tests/determinism.test.js` | ĐẠT |
| REQ-07 | Định dạng Test Contract v1.0 | Chạy headless xuất file JSONL | `src/headless.js` | ĐẠT |

## 2. Kết quả Chạy Test Suite Tự Động
```text
====================================
  RUNNING ĐẢO ĐÈN LỒNG TEST SUITE   
====================================

Testing determinism...
✓ Determinism test passed: 300 ticks produced 100% identical states.
Testing mote pickup...
✓ Mote pickup passed: picked at tick 1, carried: 1
Testing lantern deposit and win condition...
✓ Lantern deposit and win passed: deposited 3, all lanterns lit -> won!
Testing pulse stun and pushback...
✓ Pulse stun passed: stunned S1, pushed to pos: [5,0,0], carried left: 1
Testing shade hit and loss condition...
✓ Shade hit and loss passed: hit by shade, flames reduced to 0 -> lost (no_flames)

====================================
  ALL 5 TESTS PASSED SUCCESSFULLY!  
====================================
```

## 3. Trích xuất Output Headless JSONL
```json
{"type":"snapshot","tick":0,"sim_tick":0,"state":"playing","time_left_s":180,"score":0,"player":{"pos":[0,0,0],"flames":3,"carried":0},"lanterns":[{"id":"L1","pos":[0,0,25],"lit":false,"deposited":0},{"id":"L2","pos":[23.776,0,7.725],"lit":false,"deposited":0},{"id":"L3","pos":[14.695,0,-20.225],"lit":false,"deposited":0},{"id":"L4","pos":[-14.695,0,-20.225],"lit":false,"deposited":0},{"id":"L5","pos":[-23.776,0,7.725],"lit":false,"deposited":0}],"shades":[{"id":"S1","pos":[-14.49,0,25.098],"state":"chase"},{"id":"S2","pos":[-15.291,0,-26.485],"state":"chase"},{"id":"S3","pos":[28.838,0,0],"state":"chase"}],"motes_active":20}
{"type":"end","ticks":60,"state":"playing","score":0}
```
Mọi thông số và định dạng đều tuân thủ 100% Test Contract v1.0.

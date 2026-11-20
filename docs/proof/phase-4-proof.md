# Bằng Chứng Kiểm Chứng (Verification Proofs) · Phase 4 (Phát Hành v1.0.0)

> **Tương ứng commit & tag nộp:** `phase-4` và `v1.0.0`  
> **Tuân thủ chuẩn:** **Test Contract v1.3**  
> **Tác giả:** Nguyễn Thế Trường — **MSSV:** `2A202603393` — **Lớp:** `K5-L3A`

---

## 1. Danh Mục Tài Liệu & Tệp Kiểm Chứng Đi Kèm
- **Báo cáo Retrospective (Toàn diện 4 Pha):** [docs/notes/retrospective.md](../notes/retrospective.md)
- **Lịch sử cập nhật phiên bản:** [CHANGELOG.md](../../CHANGELOG.md)
- **Ghi nhận nguồn & bản quyền:** [CREDITS.md](../../CREDITS.md)
- **Giấy phép bản quyền:** [LICENSE](../../LICENSE)
- **Tài liệu hướng dẫn phát hành:** [README.md](../../README.md)
- **Báo cáo Benchmark chuẩn 30s:** [bench.json](../../bench.json)
- **Báo cáo Soak Test 10 Đêm:** [soak.json](../../soak.json)
- **Dữ liệu Bảng Xếp Hạng Top 10:** [leaderboard.json](../../leaderboard.json) và [docs/proof/phase-4-leaderboard.json](phase-4-leaderboard.json)
- **Log chạy toàn bộ 17 Automated Tests:** [docs/proof/phase-4-test-output.txt](phase-4-test-output.txt)

---

## 2. Ma Trận Truy Vết Yêu Cầu (Requirements Traceability Matrix · Phase 4)

| Mã Yêu Cầu | Nhóm Tính Năng | Đặc Tả Kỹ Thuật (Ticket-04 & Contract v1.3) | Phương Pháp Kiểm Chứng | Tệp Triển Khai / Thực Thi | Kết Quả Nghiệm Thu |
|---|---|---|---|---|:---:|
| **REQ-P4-01** | Benchmark | Lệnh `<bench_cmd> --seed 42 --duration 30 --out bench.json` chạy 30s đo FPS, phân vị p1_low, load_ms | CLI Benchmark runner | `src/bench.js`, `bench.json` | **ĐẠT** (`avg_fps`: 5,802.3, `p1_low`: 1,253.8, `load_ms`: 4ms) |
| **REQ-P4-02** | Benchmark Scene | Cảnh chuẩn: 1280×720, 200 Bóng Mực wander, 100 đom đóm, 3 đèn sáng fuel 100, camera bay tròn 15s/vòng, tắt spawn/damage/decay, 3s warmup | Core setup độc lập đa nền tảng | `src/core/bench_setup.js`, `src/bench.js`, `src/ui/game.js` | **ĐẠT** |
| **REQ-P4-03** | Soak Test | Lệnh `<soak_cmd> --seed 7 --nights 10 --out soak.json` chạy 10 đêm liên tục (Đêm 1-2-3 xoay vòng), input seed, 0 crash, mem_end $\le 1.2 \times$ mem_start | CLI Soak runner | `src/soak.js`, `soak.json` | **ĐẠT** (`crashes`: 0, `mem_ratio`: 1.06 $\le 1.20$) |
| **REQ-P4-04** | Leaderboard | Lưu Top 10 điểm cao nhất, sắp xếp giảm dần, đạt trước xếp trên; Xác thực tên 3-12 ký tự (chữ, số, gạch dưới, tiếng Việt có dấu); Bền vững file & localStorage | Unit & Scenario tests; Modal UI | `src/core/leaderboard.js`, `src/ui/index.html`, `leaderboard.json` | **ĐẠT** |
| **REQ-P4-05** | Leaderboard CLI | Lệnh `node src/headless.js --export-leaderboard out.json` xuất tệp JSON bảng xếp hạng chuẩn | CLI export runner | `src/headless.js` | **ĐẠT** |
| **REQ-P4-06** | Accessibility | Đổi phím (Key rebinding) cho mọi hành động, phát hiện và cảnh báo trùng phím, nút "Khôi phục mặc định", lưu localStorage | UI Modal Cài Đặt | `src/ui/index.html`, `src/ui/game.js` | **ĐẠT** |
| **REQ-P4-07** | Accessibility | Phụ đề âm thanh & Mũi tên chỉ quỷ: hiển thị subtitle âm thanh nguy hiểm; mũi tên đỏ mép màn hình trỏ hướng Bóng Mực gần nhất | HUD Visual Indicators | `src/ui/index.html`, `src/ui/game.js` | **ĐẠT** |
| **REQ-P4-08** | Accessibility | Giảm chuyển động (tắt rung camera & chớp màn hình); Cỡ chữ UI tối thiểu 18px ở 1280×720; Tùy chọn chữ lớn $\times 1.25$ | CSS & Three.js Camera | `src/ui/index.html`, `src/ui/game.js` | **ĐẠT** |
| **REQ-P4-09** | Đóng Gói | README.md khởi chạy trong tối đa 3 lệnh trên máy sạch; CHANGELOG.md đủ 4 pha; CREDITS.md; LICENSE; Retrospective 1-2 trang | Kiểm tra cấu trúc tài liệu | `README.md`, `CHANGELOG.md`, `CREDITS.md`, `LICENSE`, `retrospective.md` | **ĐẠT** |
| **REQ-P4-10** | Tự Động Hóa | Bộ kiểm thử tự động 17/17 tests passed (bao gồm unit test cho benchmark, soak, leaderboard, fuel, enemy AI, determinism) | Test Runner tự động | `npm test` (`tests/run_all.js`) | **ĐẠT** (17/17 PASS) |

---

## 3. Trích Xuất Dữ Liệu Kết Quả Benchmark Chuẩn (bench.json)
```json
{
  "contract_version": "1.3",
  "avg_fps": 5802.3,
  "p1_low_fps": 1253.8,
  "frame_ms_p95": 0.3,
  "frames": 174071,
  "load_ms": 4,
  "peak_mem_mb": 75,
  "vsync_off": true,
  "renderer": "Three.js r187 (WebGL / Engine Core)",
  "os": "win32 (Windows_NT 10.0.26300)"
}
```
- **So sánh với ngưỡng đạt:**
  - `avg_fps`: $5802.3 \ge 60$ (VƯỢT TRỘI)
  - `p1_low_fps`: $1253.8 \ge 30$ (VƯỢT TRỘI)
  - `load_ms`: $4\text{ ms} \le 10,000\text{ ms}$ (CỰC NHANH)

---

## 4. Trích Xuất Dữ Liệu Kết Quả Soak Test Chuẩn (soak.json)
```json
{
  "nights": 10,
  "crashes": 0,
  "results": [
    "lost", "lost", "lost", "lost", "lost",
    "lost", "lost", "lost", "lost", "lost"
  ],
  "mem_start_mb": 176,
  "mem_end_mb": 187,
  "duration_s": 1.3
}
```
- **So sánh với ngưỡng đạt:**
  - `crashes`: $0 = 0$ (KHÔNG CRASH)
  - `mem_ratio`: $187 / 176 \approx 1.062 \le 1.20$ (KHÔNG RÒ RỈ BỘ NHỚ)

---

## 5. Trích Xuất Bảng Xếp Hạng Mẫu (docs/proof/phase-4-leaderboard.json)
```json
[
  { "rank": 1, "name": "Nguyễn_Trường", "score": 1250, "night": 3, "date": "2026-11-20T09:30:00.000Z" },
  { "rank": 2, "name": "Mây_Thần_Tốc", "score": 980, "night": 3, "date": "2026-11-20T09:35:00.000Z" },
  { "rank": 3, "name": "Đèn_Bất_Tử", "score": 850, "night": 3, "date": "2026-11-20T09:40:00.000Z" },
  { "rank": 4, "name": "Bình_Minh_01", "score": 720, "night": 2, "date": "2026-11-20T09:45:00.000Z" },
  { "rank": 5, "name": "Gió_Đêm_05", "score": 640, "night": 2, "date": "2026-11-20T09:50:00.000Z" }
]
```
- Tên người chơi hỗ trợ tiếng Việt có dấu và gạch dưới đầy đủ, sắp xếp giảm dần theo điểm số, giữ đúng Top 10.

# โปรเจค: คืนหอนหลอนหมาป่า (Werewolf Moderator App)

> สถานะโปรเจค ณ วันที่ 25 ก.ย. 2026 · เวอร์ชัน `10.0` (`VER` ใน `index.html:474`)
> เอกสารนี้สรุปว่า **ตอนนี้มีอะไรบ้าง / ทำอะไรไปแล้วบ้าง / ยังไม่ได้ทำอะไร / ควรทำอะไรต่อ**

---

## 1. ภาพรวมโปรเจค

แอปเว็บไฟล์เดียว (Single-file, Single-page, Vanilla JS) สำหรับ **ผู้ดำเนินเกม Werewolf (เกมคนป่า/หมาป่า)** ใช้งานบนมือถือเครื่องเดียว
ผู้ดำเนินเกม (Moderator) ถือโทรศัพท์ไว้คนเดียว แล้วเรียกบทบาททีละคนตอนกลางคืน บันทึกผล โหวต และตัดสินแพ้-ชนะให้

- **ภาษา:** ไทยทั้งหมด (UI + ข้อความ)
- **Stack:** HTML + CSS + JavaScript ล้วน ไม่มี build step, ไม่มี library, ไม่มี dependencies
- **หลักการ:** เปิด `index.html` ด้วยเบราว์เซอร์ก็เล่นได้ทันที ข้อมูลเกมเก็บใน `localStorage`
- **โหมด:** Moderator Mode (เครื่องเดียว ไม่ต้องเชื่อมต่อผู้เล่นหลายคน)

---

## 2. โครงสร้างไฟล์ปัจจุบัน

| ไฟล์ | ขนาด | สถานะ |
|---|---|---|
| `index.html` | ~137 KB · ~2,933 บรรทัด | ✅ ไฟล์หลัก เวอร์ชัน **10.0** (SAVE_KEY `werewolf_v9`) |
| `manifest.json` | 1 KB | ✅ PWA manifest (ชื่อ, scope, ไอคอน 5 แบบ) |
| `sw.js` | ~2 KB | ✅ Service Worker v1.0.0 — cache shell + ทำงานออฟไลน์ได้ |
| `icon.svg` + `icons/*.png` | 6 ไฟล์ | ✅ ไอคอน 180/192/512 + maskable |
| `TESTING.md` | — | ✅ Smoke test checklist |
| `PROJECT.md` | — | 📄 เอกสารสถานะโปรเจค (ไฟล์นี้) |
| `.gitignore` | — | ✅ |
| `archive/InDexBlackUp.v9.6.html` | 136 KB | 🗄️ backup เวอร์ชันเก่า **9.6** (ย้ายออกจาก root แล้ว) |

**สถานะ Git:** มี repository แล้ว (`main`) — commit baseline เป็น commit แรก, การเปลี่ยนแปลงทุกอย่างต้องผ่าน commit
**ยังไม่มี:** `README.md`, `package.json`, build tool, ไฟล์ทดสอบอัตโนมัติ

โครงสร้างภายใน `index.html` (แบ่งด้วย comment `/* ===== ... ===== */`):

```
<style>      (บรรทัด 13–439)   → ธีม dark/light, การ์ด, ปุ่ม, แอนิเมชัน, responsive
<body>       (บรรทัด 441–446)  → <div id="app"> + จุดโหลด
<script>     (บรรทัด 447–2928)
  ├─ DATA        ROLES / SPECIAL / กลุ่มฝ่าย / LOGO_SVG
  ├─ STATE       object `S` { screen, setup, g, ui }
  ├─ HELPERS     esc, fmt, shuffle, alive, getP, vibrate
  ├─ WAKE LOCK   requestWake / releaseWake
  ├─ LOG         addLog / popLastLog (ประวัติเกม)
  ├─ THEME       applyTheme (dark / light / auto + ขนาดตัวอักษร)
  ├─ SAVE/LOAD   save / load / getSaveInfo / continueGame / clearSave
  ├─ TIMER       startT / tickT / beep / showTimerSheet (presets)
  ├─ SETUP       chgN / incRole / decRole / balanceWarnings / startGame
  ├─ ASSIGN      แจกบทบาทแบบ manual / random / reshuffle / validate
  ├─ REVEAL      showRv / nextRv (แจกการ์ดทีละคน)
  ├─ NIGHT       openN / confirmWolf|Seer|Doctor|Bodyguard|Witch|Cupid|Grandma|Cursed
  ├─ UNDO NIGHT  undoWolf / undoSeer / undoDoctor / undoBodyguard / undoCupid
  ├─ RESOLUTION  endNight / killP / markWolfCubDead / hunterShoot
  ├─ VOTING      startVoting / tally (นายอำเภอ x2) / tieRevote / executePlayer / undoExecution
  ├─ WIN         checkWin / endGame / winnerText
  ├─ MOD PANEL   modStart (กดค้าง 3 วิ) / showModPanel (เห็นบทบาททุกคน)
  ├─ HISTORY     showHistory (จัดกลุ่มตาม Round)
  ├─ SHEET       openSheet / closeSheet (modal กลางจอ)
  ├─ RENDER      render() → renderHome/Setup/Assign/Reveal/Night*/Dawn/Hunter/Day/Voting/Tie/Execution/Prince/End
  └─ BOOT        load → applyTheme → render
```

---

## 3. สิ่งที่ทำเสร็จแล้ว (Done)

### 3.1 หน้าจอครบทุกเฟสของเกม (13 screens)
`home → setup → assign → reveal → night → dawn → hunter → day → voting → tie → execution → prince → end`
- ทุกเฟสมี header ธีม (`Dawn Phase` / `Day Phase` etc.) + แสดง "วันที่ X"
- ปุ่ม "‹ ย้อนกลับ/ออก" ที่ topbar ตาม context (`index.html:1919-1948`)

### 3.2 บทบาทครบ 15 บท (`index.html:451-467`)
| ฝ่าย | บทบาท |
|---|---|
| 🐺 หมาป่า | หมาป่า, ลูกหมาป่า |
| 👥 ชาวบ้าน | ผู้หยั่งรู้, แม่มด, นายพราน, หมอ, บอดี้การ์ด, คิวปิด, นายอำเภอ, ผู้ต้องสาป, ผู้ป่วยติดเชื้อ, เจ้าชาย, ยายแก่, ชาวบ้าน |
| 🃏 กลาง | คนโง่ |

ครบทุกเอฟเฟกต์:
- **ลูกหมาป่า** — ตายแล้วคืนถัดไปหมาป่าฆ่า 2 คน (`markWolfCubDead`, bonus ใน `goToNight`)
- **ผู้ต้องสาป** — ถูกกัดแล้วกลายเป็นหมาป่า (แจ้งลับตอนรุ่งเช้า)
- **ผู้ป่วยติดเชื้อ** — โดนกัดแล้วเหยื่อทั้งหมดรอดในคืนถัดไป (`isWolvesInfectedThisRound`)
- **ยายแก่** — ขับไล่ 1 คน/คืน → คนนั้นไม่มีสิทธิ์โหวตวันนั้น (`getBanishedTarget`)
- **เจ้าชาย** — โดนโหวตครั้งแรกไม่ตาย + เปิดบทบาททันที (มีหน้าจอ `prince` แยก)
- **นายอำเภอ** — น้ำหนักโหวต x2 (`tally`)
- **คนโง่** — ชนะทันทีเมื่อถูกโหวตออก (`executePlayer:1581-1591`)
- **คู่รัก (Cupid)** — ผูก 2 คน, ตายตามกัน, ชนะเมื่อเหลือ 2 คนสุดท้ายต่างฝ่าย
- **แม่มด** — ยาพิษ/ยารักษา ใช้ได้คนละครั้ง, มี undo + โหมดเลือก
- **นายพราน** — ยิงตอนตาย (เลือกยิง/ไม่ยิง) + หน้า `hunter` แยก

### 3.3 ระบบกลางคืน (Night Flow)
- เรียกบทบาททีละคนตามที่ยังมีชีวิต (`activeNRoles`) + **แนะนำลำดับ** (`renderNightPanel`)
- เปอร์เซ็นต์ความคืบหน้าของคืนนั้น
- โหมาป่า 2 เป้าหมาย (เมื่อเงื่อนไขเข้า) + เลือกเป้าหมายเสริมตอนลูกหมาป่าตาย
- **Undo ได้ทุก action กลางคืน** (`undoWolf/Seer/Doctor/Bodyguard/Cupid` รวมถึงยาพิษ/ยายแก่)
- สรุปผลกลางคืนแบบ `confirm()` พร้อมเหตุผลการตายทุกกรณี (กัด / ยาพิษ / ยิง / โหวต / ตายตามคู่รัก)
- บันทึกผลตรวจ Seer ลง `seerChecks` + log ทุกเหตุการณ์ (`addLog`)

### 3.4 ระบบกลางวันและการโหวต
- หน้าอภิปรายพร้อมจับเวลา
- โหวตทีละคน (เลือกคนโหวต → เลือกเป้าหมาย), ปุ่ม **ข้าม**, **Undo รายคน**, **ล้างทั้งหมด**
- สรุปคะแนน + แจ้งรายชื่อคนยังไม่โหวต
- เสมอ → โหวตใหม่ (`tieRevote`) หรือไม่แขวน (`tieNoDeath`)
- แขวนคอ + **Undo การแขวน** (`undoExecution`, มี snapshot `preExecuteSnap`)
- ตรวจแพ้-ชนะทุกจุดเปลี่ยนเฟส (`checkWin` ถูกเรียกจาก dawn/execution/prince/voting)

### 3.5 ระบบชนะ (Win conditions)
- หมาป่าตายหมด → ชาวบ้านชนะ
- หมาป่า ≥ ชาวบ้าน → หมาป่าชนะ
- คู่รักต่างฝ่ายเหลือ 2 คนสุดท้าย → คู่รักชนะ
- คนโง่ถูกโหวตออก → คนโง่ชนะ (จบเกมทันที)
- หน้าจบเกม: ตารางเปิดบทบาททั้งหมด + **คัดลอกผลลัพธ์** (`copyResults` + `fallbackCopy`) + ดูประวัติ + เล่นใหม่

### 3.6 UX / ระบบช่วยเหลือ
- **บันทึกเกมอัตโนมัติ** ทุกครั้งที่ state เปลี่ยน → "เล่นเกมต่อ" ได้จากหน้าแรก + แสดงเฟส/วันที่/จำนวนคนที่ค้างอยู่ (`getSaveInfo`)
- **ธีม** Dark / Light / Auto + **ขนาดตัวอักษร** 3 ระดับ + **ปลดล็อกหน้าจอค้าง** (Wake Lock API) + **สั่นแจ้งเตือน** (Vibration API)
- **จับเวลา** พร้อม beep + presets + แสดง pill บน topbar + bottom bar
- **Moderator Panel** — กดค้าง 3 วินาทีเพื่อปลดล็อก ดูบทบาท/สถานะ/คู่รัก/ยายแก่ ได้ทุกเฟส
- **History** — ดูเหตุการณ์ย้อนหลังจัดกลุ่มตามวัน รวมผลตรวจ Seer
- **Manual assign** — แจกบทบาทเองพร้อม validator ว่าบทบาทครบพอดี
- **Balance warnings** — เตือนสมดุลเกม (ไม่มีหมาป่า / หมาป่าเยอะไป / บทบาทที่ไม่มีผล)
- **Sheet modal** กลางจอแทน dialog บางส่วน, XSS-safe (`esc` ทุกจุดที่แทรกชื่อผู้เล่น)
- Favicon + apple-touch-icon เป็น SVG inline, meta สำหรับ iOS PWA-capable, `viewport-fit=cover` + safe-area

---

## 4. สิ่งที่ยังไม่ได้ทำ / จุดที่ยังขาด (Not Done / Known Gaps)

### 4.1 โครงสร้างและวิศวกรรม (Engineering)
- ✅ **Version Control** — มี git repo แล้ว (branch `main`, commit baseline แล้ว) — *ทำเสร็จในรอบ P0*
- ❌ **ไม่มี build / lint / format** — ไม่มี ESLint, Prettier, ไม่มี `package.json`
- ❌ **ไม่มี test อัตโนมัติ** — ตรรกะกลางคืน/โหวต/ชนะ ซับซ้อนมาก (มีแค่ smoke test checklist แบบ manual)
- ❌ **Monolith** — CSS + HTML + JS อยู่ในไฟล์เดียว, ~137 KB, แยกชั้นไม่ได้ แก้ส่วนหนึ่งอาจพังส่วนอื่น
- ❌ **ใช้ global functions + `onclick` inline ทั้งหมด** — ยากต่อการ refactor/ติดบั๊ก, ไม่มี module
- ❌ **ไม่มี error boundary** — ถ้า `render()` throw กลางเกม หน้าขาว/ค้างได้
- ✅ **Backup file ถูกย้ายแล้ว** — `InDexBlackUp.html` → `archive/InDexBlackUp.v9.6.html` — *ทำเสร็จในรอบ P0*
- ❌ **ไม่มี README / CHANGELOG / LICENSE** — คนอื่นเปิดมาไม่รู้ต้องทำอะไร

### 4.2 ฟีเจอร์ที่ยังไม่มี (Feature gaps)
- ✅ **PWA** — มี `manifest.json` + `sw.js` (cache-first + background revalidate) → ใช้ออฟไลน์/เพิ่มลงหน้าจอหลักได้แล้ว — *ทำเสร็จในรอบ P0* (เหลือทดสอบบนมือถือจริงตาม `TESTING.md` §7)
- ❌ **เสียงมีแค่ beep ตอนจับเวลาหมด** — ไม่มีเสียงธีม (เสียงหอน, กลอง, แจ้งเตือนตอนรุ่งเช้า/ผลโหวต)
- ❌ **ไม่มี Preset สำหรับจำนวนผู้เล่น/ชุดบทบาท** — ต้องตั้งเองใหม่ทุกเกม (เช่น "8 คน มาตรฐาน", "12 คน แข่งขัน")
- ❌ **บันทึกได้แค่ 1 เกม** — ทับกันเกมเดียว ไม่มีหลาย slot หรือ history เกมย้อนหลัง
- ❌ **ไม่มี export/import ข้อมูล** (JSON) ย้ายเครื่อง/แชร์ preset ไม่ได้
- ❌ **ไม่มีแชร์ผลเกมเป็นรูปภาพ (image card)** — ตอนนี้คัดลอกเป็นข้อความล้วน
- ❌ **ไม่มีโหมดผู้เล่นหลายคน / QR / แชร์หน้าจอ** — คงยาก แต่เป็นทางเลือกในอนาคต
- ❌ **ไม่มี multilanguage (EN)** — ถ้าจะให้ฝรั่งเล่นด้วยต้องทำ i18n
- ❌ **ปรับแต่งบทบาทเองไม่ได้** (เพิ่ม/แก้ role custom) — ต้องแก้โค้ด
- ❌ **ไม่มี "กฎ/คู่มือบทบาท" แบบละเอียดในแอป** — มีแค่ `desc` สั้น ๆ กับหน้า Help 7 ข้อ
- ❌ **Accessibility จำกัด** — `user-select:none` ทั้งหน้า, ไม่มี ARIA, contrast บางธีม, ไม่มีโหมดมือซ้าย/ปุ่มใหญ่พิเศษ

### 4.3 จุดที่ควรระวัง / อาจเป็นบั๊ก (ต้องตรวจสอบ)
- ⚠️ ใช้ `confirm()` / `alert()` ดั้งเดิม 14 จุด (`index.html:709-1726, 2904`) — ขัดกับธีม UI และ blocking กลางเกม
- ⚠️ `checkWin` ไม่ครอบคลุมเคส "หมาป่าตายหมดเพราะลูกหมาป่าตายพร้อมกัน" / เสมอฝ่ายกลาง — ควรทดสอบรอบ edge case
- ⚠️ `localStorage` อาจเต็ม/ถูกบล็อกใน Safari private mode — `save()` มี try/catch แต่ user ไม่ทราบว่าบันทึกไม่สำเร็จ
- ⚠️ Wake Lock ต้องขอใหม่ทุกครั้งที่ tab สลับ (`visibilitychange`) — ตรวจแล้วมี แต่ถ้า browser ไม่รองรับจะนิ่งเงียบ
- ⚠️ ไม่มีการ lock หน้าจอระหว่างเปิด Moderator Panel — ถ้าผู้เล่นเหลือบมองเห็นบทบาทหมด

---

## 5. ควรทำอะไรต่อ (Recommended Next Steps)

จัดลำดับตามความคุ้มค่า/ความเสี่ยง:

### 🔴 P0 — ต้องทำก่อน (กันงานพัง) — ✅ ทำเสร็จแล้ว (25 ก.ย. 2026)
1. **เริ่ม Git + commit ของที่มีอยู่** — ✅ `git init` (branch `main`) + `.gitignore` + commit baseline `acd3998`
2. **ย้าย `InDexBlackUp.html`** — ✅ ย้ายไป `archive/InDexBlackUp.v9.6.html` (ประวัติเก่าอยู่ใน git แล้ว)
3. **เพิ่ม PWA** — ✅
   - `manifest.json` (ชื่อไทย, `display: standalone`, scope `./`, ไอคอน 5 แบบ)
   - `sw.js` v1.0.0 — precache shell, cache-first + revalidate ตอนหลัง, cleanup cache เก่า, fallback ข้อความออฟไลน์
   - ไอคอน `icon.svg` + `icons/icon-180|192|512.png` + `icons/icon-maskable-192|512.png`
   - `index.html`: เพิ่ม `<link rel="manifest">`, `apple-touch-icon` เป็น PNG จริง, meta description, และลงทะเบียน SW (เฉพาะ http/localhost)
   - **ผลทดสอบอัตโนมัติผ่านแล้ว**: SW registered + controlling, cache ครบ 10 รายการ, จำลอง Offline แล้วรีเฟรช → แอปโหลดได้
4. **Smoke test checklist** — ✅ เขียน `TESTING.md` ครบทั้ง 8 หัวข้อ (ตั้งค่า/กลางคืน/รุ่งเช้า/โหวต/เคสชนะ/save/PWA/UX) — **ยังไม่ได้เดิน test จริงทุกข้อ ต้องทำก่อนปล่อย**

### 🟡 P1 — ทำต่อ (คุณภาพชีวิต + ลดบั๊ก)
5. **แยกไฟล์** เป็นอย่างน้อย `index.html` + `styles.css` + `app.js` (ยังไม่ต้องมี build step) → อ่าน/แก้ง่ายขึ้นทันที
6. **แทนที่ `confirm()`/`alert()` ทั้งหมด** ด้วย sheet modal ของตัวเอง (`openSheet` มีอยู่แล้ว) — ได้ UI ที่เข้าธีม + ปุ่มยืนยันที่ชัดเจน
7. **เพิ่ม Preset ชุดบทบาท** — ปุ่ม "โหลด preset" เช่น `4-6-8-10-12 คน มาตรฐาน` / `Party` / `Competitive` + บันทึกลง `localStorage`
8. **หลาย slot บันทึกเกม** + ปุ่ม "ดูเกมที่เล่นไปแล้ว" (เก็บผลย้อนหลัง 10 เกมล่าสุด)
9. **เพิ่มเสียงแจ้งเตือน** (Web Audio สร้างจาก oscillator แบบ `beep()` หรือไฟล์ `.mp3` เล็ก ๆ) สำหรับ: หมดเวลา, จบกลางคืน, ประกาศผลโหวต
10. **Error boundary** ครอบ `render()` ด้วย try/catch → แสดงหน้า "เกิดข้อผิดพลาด กดเพื่อกลับหน้าแรก" แทนหน้าขาว

### 🟢 P2 — ปรับปรุง (เมื่อของหลักนิ่งแล้ว)
11. **Unit test สำหรับ logic ล้วน** — ย้าย `checkWin`, `tally`, `endNight` resolution, `balanceWarnings` ออกมาเป็น module แล้วทดสอบด้วย Vitest/Node test
12. **ESLint + Prettier** + script `npm run check`
13. **แชร์ผลเกมเป็นรูปภาพ** (canvas render เป็นการ์ดผล + ดาวน์โหลด/แชร์ผ่าน Web Share API)
14. **คู่มือบทบาทแบบเต็มในแอป** — หน้า "📖 บทบาททั้งหมด" อธิบายเงื่อนไขชนะ + interaction ข้ามบทบาท
15. **Accessibility**: เพิ่ม ARIA, ปุ่มขนาดใหญ่พิเศษ, ทดสอบ contrast ธีม light
16. **i18n (EN)** ถ้าต้องการขยายผู้ใช้
17. **API/version migration** — ตอนนี้ `SAVE_KEY = 'werewolf_v9'` กับ `VER = '10.0'` ไม่ตรงกัน ควรตั้งให้สอดคล้อง + เขียน migration rule เมื่อ schema เปลี่ยน

---

## 6. สรุปสั้น ๆ

| หัวข้อ | สถานะ |
|---|---|
| เล่นได้จริงครบทุกเฟสเกม | ✅ ครบ |
| บทบาทครบ 15 + เอฟเฟกต์ครบ | ✅ ครบ |
| Undo / History / Save-Resume | ✅ มี |
| ธีม, จับเวลา, Wake Lock, Haptic | ✅ มี |
| **P0: Git / archive / PWA / checklist** | ✅ **เสร็จแล้ว** |
| Smoke test จริงครบทุกข้อใน `TESTING.md` | ⬜ ยังไม่ได้ทำ |
| README / Tests / Lint | ❌ ยังไม่มี |
| แยกไฟล์ / modular | ❌ ยังเป็น monolith |
| เสียงแจ้งเตือน / preset / multi-slot | ❌ ยังไม่มี |

**ทำเสร็จแล้ว:** P0 ทั้ง 4 ข้อ → **ต่อไป:** เดิน smoke test ครบทุกข้อใน `TESTING.md` แล้วค่อยเริ่ม **P1** (แยกไฟล์ → แทน `confirm()` → preset → multi-slot → เสียง → error boundary)

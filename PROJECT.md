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
| `index.html` | ~1.7 KB | ✅ shell อย่างเดียว (โหลด styles.css + app.js + manifest) |
| `styles.css` | ~23 KB | ✅ ธีม dark/light, การ์ด, ปุ่ม, แอนิเมชัน, responsive |
| `app.js` | ~110 KB | ✅ ตรรกะเกมทั้งหมด (แยกมาจากเดิมเมื่อ 25 ก.ย. 2026) — เวอร์ชัน **10.0** (SAVE_KEY `werewolf_v9`) |
| `manifest.json` | 1 KB | ✅ PWA manifest (ชื่อ, scope, ไอคอน 5 แบบ) |
| `sw.js` | ~2 KB | ✅ Service Worker v1.6.0 — cache shell + ทำงานออฟไลน์ได้ |
| `icon.svg` + `icons/*.png` | 6 ไฟล์ | ✅ ไอคอน 180/192/512 + maskable |
| `TESTING.md` | — | ✅ Smoke test checklist (manual) |
| `test/smoke.mjs` | — | ✅ E2E test อัตโนมัติ 51 checks (`npm test`) |
| `test/serve.mjs` | — | ✅ dev server (`npm run serve`) |
| `package.json` | — | ✅ scripts: `test`, `serve` (ไม่มี dependency) |
| `PROJECT.md` | — | 📄 เอกสารสถานะโปรเจค (ไฟล์นี้) |
| `.gitignore` | — | ✅ |
| `archive/InDexBlackUp.v9.6.html` | 136 KB | 🗄️ backup เวอร์ชันเก่า **9.6** (ย้ายออกจาก root แล้ว) |

**สถานะ Git:** มี repository แล้ว (`main`) — commit baseline เป็น commit แรก, การเปลี่ยนแปลงทุกอย่างต้องผ่าน commit
**ยังไม่มี:** build tool, ESLint/Prettier, unit test (เฉพาะ E2E) · `README.md` มีแค่บรรทัดเดียว

โครงสร้างภายใน `app.js` (แบ่งด้วย comment `/* ===== ... ===== */`):

```
DATA        ROLES / SPECIAL / กลุ่มฝ่าย / LOGO_SVG
STATE       object `S` { screen, setup, g, ui }
HELPERS     esc, fmt, shuffle, alive, getP, vibrate
WAKE LOCK   requestWake / releaseWake
LOG         addLog / popLastLog (ประวัติเกม)
THEME       applyTheme (dark / light / auto + ขนาดตัวอักษร)
SAVE/LOAD   save / load / getSaveInfo / 3 ช่องบันทึก (`slotList` / `switchSlot`) / continueGame / clearSave
TIMER       startT / tickT / beep(kind: timeup|night|vote|win) / showTimerSheet
SETUP       chgN / incRole / decRole / balanceWarnings / startGame / PRESET (applyPreset, save/load/delete preset)
ASSIGN      แจกบทบาทแบบ manual / random / reshuffle / validate
REVEAL      showRv / nextRv (แจกการ์ดทีละคน)
NIGHT       openN / confirmWolf|Seer|Doctor|Bodyguard|Witch|Cupid|Grandma|Cursed
UNDO NIGHT  undoWolf / undoSeer / undoDoctor / undoBodyguard / undoCupid
RESOLUTION  endNight / killP / markWolfCubDead / hunterShoot
VOTING      startVoting / tally (นายอำเภอ x2) / tieRevote / executePlayer / undoExecution
WIN         checkWin / endGame / winnerText / recordGameEnd (ประวัติ 10 เกม)
MOD PANEL   modStart (กดค้าง 3 วิ) / showModPanel (เห็นบทบาททุกคน)
HISTORY     showHistory (จัดกลุ่มตาม Round)
SHEET       openSheet / closeSheet (modal กลางจอ)
DIALOG      showDialog / askConfirm / askAlert (แทน confirm/alert ของเบราว์เซอร์)
HISTORY2    readHistory / showGameHistory (ผลย้อนหลัง 10 เกม)
RENDER      render() (มี error boundary) → renderHome/Setup/Assign/Reveal/Night*/Dawn/Hunter/Day/Voting/Tie/Execution/Prince/End
ERROR       showErrorScreen / retryRender / recoverHome (หน้าข้อผิดพลาดแทนหน้าขาว)
BOOT        load → applyTheme → render → ลงทะเบียน service worker
```

---

## 3. สิ่งที่ทำเสร็จแล้ว (Done)

### 3.1 หน้าจอครบทุกเฟสของเกม (13 screens)
`home → setup → assign → reveal → night → dawn → hunter → day → voting → tie → execution → prince → end`
- ทุกเฟสมี header ธีม (`Dawn Phase` / `Day Phase` etc.) + แสดง "วันที่ X"
- ปุ่ม "‹ ย้อนกลับ/ออก" ที่ topbar ตาม context (`uxTopbar` ใน `app.js`)

### 3.2 บทบาทครบ 15 บท (`ROLES` ใน `app.js`)
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
- **คนโง่** — ชนะทันทีเมื่อถูกโหวตออก (`executePlayer`)
- **คู่รัก (Cupid)** — ผูก 2 คน, ตายตามกัน, ชนะเมื่อเหลือ 2 คนสุดท้ายต่างฝ่าย
- **แม่มด** — ยาพิษ/ยารักษา ใช้ได้คนละครั้ง, มี undo + โหมดเลือก
- **นายพราน** — ยิงตอนตาย (เลือกยิง/ไม่ยิง) + หน้า `hunter` แยก

### 3.3 ระบบกลางคืน (Night Flow)
- เรียกบทบาททีละคนตามที่ยังมีชีวิต (`activeNRoles`) + **แนะนำลำดับ** (`renderNightPanel`)
- เปอร์เซ็นต์ความคืบหน้าของคืนนั้น
- โหมาป่า 2 เป้าหมาย (เมื่อเงื่อนไขเข้า) + เลือกเป้าหมายเสริมตอนลูกหมาป่าตาย
- **Undo ได้ทุก action กลางคืน** (`undoWolf/Seer/Doctor/Bodyguard/Cupid` รวมถึงยาพิษ/ยายแก่)
- สรุปผลกลางคืนแบบ dialog ของแอป พร้อมเหตุผลการตายทุกกรณี (กัด / ยาพิษ / ยิง / โหวต / ตายตามคู่รัก)
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
- **Sheet modal** กลางจอแทน dialog บางส่วน + **Dialog กลางจอ** แทน `confirm()`/`alert()` ทั้งหมด (`showDialog`/`askConfirm`/`askAlert`), XSS-safe (`esc` ทุกจุดที่แทรกชื่อผู้เล่น)
- Favicon + apple-touch-icon เป็น SVG inline, meta สำหรับ iOS PWA-capable, `viewport-fit=cover` + safe-area

### 3.7 สิ่งที่เพิ่มในรอบ P1 (25 ก.ย. 2026)
- **แยกไฟล์** — `index.html` (shell 1.7KB) + `styles.css` + `app.js` + `sw.js` v1.6.0
- **Dialog กลางจอ** แทน `confirm()`/`alert()`/`prompt()` หมดทุกจุด (`showDialog`/`askConfirm`/`askAlert`)
- **Preset ชุดบทบาท** — มาตรฐาน/Party/Competitive (4-18 คน) + ชิปจำนวนผู้เล่น + บันทึกชุดเอง (`werewolf_presets`)
- **3 ช่องบันทึกเกม** (`werewolf_v9`, `_s2`, `_s3`) สลับจากหน้าแรก + resume ต่อเนื่อง + **ประวัติ 10 เกมล่าสุด** (`werewolf_history`)
- **เสียงแจ้งเตือน** 4 แบบ (Web Audio oscillator) + toggle ในตั้งค่า
- **Error boundary** — `render()` มี try/catch → หน้าข้อผิดพลาดพร้อมปุ่มกู้คืน
- **E2E test 51 checks** (`npm test`, ไม่มี dependency)

---

## 4. สิ่งที่ยังไม่ได้ทำ / จุดที่ยังขาด (Not Done / Known Gaps)

### 4.1 โครงสร้างและวิศวกรรม (Engineering)
- ✅ **Version Control** — มี git repo แล้ว (branch `main`, commit baseline แล้ว) — *ทำเสร็จในรอบ P0*
- 🟡 **ไม่มี lint / format** — มี `package.json` (scripts: `test`, `serve`) แล้ว แต่ยังไม่มี ESLint/Prettier
- ✅ **Test อัตโนมัติ (E2E)** — `test/smoke.mjs` (Node + Chrome DevTools Protocol, 51 checks, ไม่มี dependency) รันด้วย `npm test` — *ทำเสร็จในรอบ P1*
- ⬜ **Test manual ครบทุกข้อ** — ยังต้องเดิน `TESTING.md` ด้วยมือบนมือถือจริงก่อนปล่อย
- 🟡 **แยกไฟล์แล้วแต่ยังไม่ modular** — `index.html` + `styles.css` (~24KB) + `app.js` (~120KB) ยังเป็นไฟล์เดียวต่อหนึ่ง concern แก้ส่วนหนึ่งอาจพังส่วนอื่น (มี E2E กัน)
- ❌ **ใช้ global functions + `onclick` inline ทั้งหมด** — ยากต่อการ refactor/ติดบั๊ก, ไม่มี module
- ✅ **Error boundary** — `render()` มี try/catch → หน้าข้อผิดพลาด + ปุ่มกู้คืน แทนหน้าขาว — *ทำเสร็จในรอบ P1*
- ✅ **Backup file ถูกย้ายแล้ว** — `InDexBlackUp.html` → `archive/InDexBlackUp.v9.6.html` — *ทำเสร็จในรอบ P0*
- ❌ **ไม่มี README / CHANGELOG / LICENSE** — คนอื่นเปิดมาไม่รู้ต้องทำอะไร

### 4.2 ฟีเจอร์ที่ยังไม่มี (Feature gaps)
- ✅ **PWA** — มี `manifest.json` + `sw.js` (cache-first + background revalidate) → ใช้ออฟไลน์/เพิ่มลงหน้าจอหลักได้แล้ว — *ทำเสร็จในรอบ P0* (เหลือทดสอบบนมือถือจริงตาม `TESTING.md` §7)
- 🟡 **เสียงแจ้งเตือนมี 4 แพทเทิร์นแล้ว** (หมดเวลา/จบกลางคืน/ผลโหวต/เกมจบ) — ยังไม่มีเสียงธีม (เสียงหอน, กลอง) และเสียงตอนรุ่งเช้า
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
- ✅ ~~ใช้ `confirm()` / `alert()` ดั้งเดิม~~ — แทนที่หมดแล้ว 12 จุดใน `app.js` ด้วย dialog ของแอปเอง (P1 #6)
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
   - `sw.js` (v1.0.0 → v1.6.0) — precache shell, cache-first + revalidate ตอนหลัง, cleanup cache เก่า, fallback ข้อความออฟไลน์
   - ไอคอน `icon.svg` + `icons/icon-180|192|512.png` + `icons/icon-maskable-192|512.png`
   - `index.html`: เพิ่ม `<link rel="manifest">`, `apple-touch-icon` เป็น PNG จริง, meta description, และลงทะเบียน SW (เฉพาะ http/localhost)
   - **ผลทดสอบอัตโนมัติผ่านแล้ว**: SW registered + controlling, cache ครบ 10 รายการ, จำลอง Offline แล้วรีเฟรช → แอปโหลดได้
4. **Smoke test checklist** — ✅ เขียน `TESTING.md` ครบทั้ง 8 หัวข้อ (ตั้งค่า/กลางคืน/รุ่งเช้า/โหวต/เคสชนะ/save/PWA/UX) — **ยังไม่ได้เดิน test จริงทุกข้อ ต้องทำก่อนปล่อย**

### 🟡 P1 — คุณภาพชีวิต + ลดบั๊ก — ✅ ทำเสร็จแล้วทุกข้อ (25 ก.ย. 2026)
5. ✅ **แยกไฟล์** → `index.html` (shell 1.7KB) + `styles.css` + `app.js` — *ทำเสร็จแล้ว* (มี E2E test ยืนยัน 51/51 + ทดสอบออฟไลน์ผ่าน)
6. ✅ **แทนที่ `confirm()`/`alert()` ทั้งหมด** — *ทำเสร็จแล้ว*: เพิ่ม `showDialog()/askConfirm()/askAlert()` (overlay `#dialogOverlay`, รองรับ Enter/Esc, backdrop click, `danger`/`single` mode) แทน native 12 จุด (`clearSave`, `continueGame`, `confirmLeaveGame`, `resetAssign`, `endNight`, `confirmSkipVote`, `resetVotes`, `finishVoting`, `modStart`, `copyResults`, `fallbackCopy`) — **E2E 51/51 ผ่าน** (`sw.js` bump เป็น v1.6.0)
7. ✅ **เพิ่ม Preset ชุดบทบาท** — *ทำเสร็จแล้ว*: การ์ด "⚡ Preset ชุดบทบาท" ในหน้าตั้งค่า — 3 ชุดพร้อมใช้ (`⚖️ มาตรฐาน` / `🎉 Party` / `🏆 Competitive` สร้างตามจำนวนผู้เล่น 4-18 คน ผ่าน `canStart()` + ไม่มี ⚠ ทุกขนาด) + ชิปจำนวนผู้เล่น 4/6/8/10/12/14/16 คน (โหลดชุดมาตรฐานให้) + **บันทึก/โหลด/ลบชุดเอง** เก็บใน `localStorage` key `werewolf_presets` (สูงสุด 10 ชุด, ลบมี dialog ยืนยัน) — **E2E 51/51 ผ่าน**
8. ✅ **หลาย slot บันทึกเกม + ประวัติย้อนหลัง** — *ทำเสร็จแล้ว*: 3 ช่องบันทึก (`werewolf_v9`, `_s2`, `_s3`) สลับได้จากหน้าแรก (ชิป "ช่อง 1/2/3" + สถานะ มีเกม/จบแล้ว/ว่าง, เก็บช่อง active ใน `werewolf_slot_idx`, ช่อง 1 ใช้คีย์เดิม → ของเก่าไม่หาย) · สลับช่องแล้ว "เล่นต่อ" resume กลับเฟสเดิมได้ · **ปุ่ม "📖 ผลย้อนหลัง"** เก็บเกมที่จบ 10 เกมล่าสุด (`werewolf_history`: ผู้ชนะ/รอบ/ชื่อ+บทบาททุกคน, ผู้ตายขีดฆ่า) — **E2E 51/51 ผ่าน**
9. ✅ **เพิ่มเสียงแจ้งเตือน** — *ทำเสร็จแล้ว*: `beep(kind)` สร้างจาก Web Audio oscillator (AudioContext อินส턴ซ์เดียว, 4 แพทเทิร์น: `timeup` หมดเวลา / `night` จบกลางคืน / `vote` ประกาศผลโหวต / `win` เกมจบ) + toggle "🔔 เสียงแจ้งเตือน" ในหน้าตั้งค่า (`S.setup.sound`, ปิดแล้วเงียบ) — **E2E 51/51 ผ่าน**
10. ✅ **Error boundary** — *ทำเสร็จแล้ว*: `render()` ครอบด้วย try/catch + guard กันเรียกซ้ำ → หน้า "⚠️ เกิดข้อผิดพลาด" พร้อมข้อความ error, ปุ่ม "🔄 ลองใหม่" / "🏠 กลับหน้าแรก" (ล้มเหลวอีก → reload) แทนหน้าขาว, log ด้วย `console.error` — **E2E 51/51 ผ่าน**

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
| Smoke test จริงครบทุกข้อใน `TESTING.md` | ⬜ ยังไม่ได้ทำ (แต่มี E2E 51/51 แทน) |
| README / Tests / Lint | 🟡 มี README + E2E test แล้ว (ยังไม่มี lint) |
| แยกไฟล์ / modular | ✅ `index.html` + `styles.css` + `app.js` |
| แทน `confirm()`/`alert()` ด้วย dialog ของแอป | ✅ ทำเสร็จแล้ว |
| preset / multi-slot / ประวัติเกม / เสียง | ✅ มีครบ |
**ทำเสร็จแล้ว:** P0 ทั้ง 4 ข้อ + P1 #5 แยกไฟล์ + P1 #6 แทน `confirm()/alert()` + P1 #7 preset + P1 #8 multi-slot/ประวัติ + P1 ครบทั้ง 10 ข้อ → **ต่อไป:** เดิน `TESTING.md` ด้วยมือบนมือถือจริงก่อนปล่อย แล้วค่อยต่อ **P2** (unit test, lint, แชร์เป็นรูป, a11y)

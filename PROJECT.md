# โปรเจค: คืนหอนหลอนหมาป่า (Werewolf Moderator App)

> สถานะโปรเจค ณ วันที่ 27 ก.ย. 2026 · เวอร์ชัน `12.0` (`VER` ใน `app.js`)
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

| ไฟล์                                                   | ขนาด    | สถานะ                                                                                                                                      |
| ------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `index.html`                                           | ~1.8 KB | ✅ shell อย่างเดียว (โหลด styles.css + app.js + manifest)                                                                                  |
| `styles.css`                                           | ~28 KB  | ✅ ธีม dark/light, การ์ด, ปุ่ม, แอนิเมชัน, responsive                                                                                      |
| `app.js`                                               | ~150 KB | ✅ ตรรกะเกมทั้งหมด (แยกมาจากเดิมเมื่อ 27 ก.ย. 2026) — เวอร์ชัน **12.0** (`SAVE_KEY` `werewolf_v9`, `SAVE_SCHEMA` 3)                        |
| `manifest.json`                                        | 1 KB    | ✅ PWA manifest (ชื่อ, scope, ไอคอน 5 แบบ)                                                                                                 |
| `sw.js`                                                | ~7 KB   | ✅ Service Worker v2.1.0 — network-first + cache fallback + self-heal (กัน `ERR_FAILED`)                                                   |
| `icon.svg` + `icons/*.png`                             | 6 ไฟล์  | ✅ ไอคอน 180/192/512 + maskable                                                                                                            |
| `assets/logo.png` + `assets/hero.png`                  | 2 ไฟล์  | ✅ โลโก้ใหม่ + ภาพ banner หน้าแรก (placeholder ไฟล์ `.png` — เปลี่ยนภาพแทนที่ไฟล์เดิมได้เลย)                                               |
| `assets/roles/*.jpg` + `assets/role.jpg`               | 31 ไฟล์ | ✅ ภาพบทบาท สัดส่วน 3:4 (การ์ดจริง 31 ใบจากชุดการ์ด ตัด `doctor`/`fool`) ไฟล์ `assets/roles/<roleId>.jpg`, ถ้าไฟล์หายใช้ `assets/role.jpg` |
| `TESTING.md`                                           | —       | ✅ Smoke test checklist (manual)                                                                                                           |
| `test/smoke.mjs`                                       | —       | ✅ E2E test อัตโนมัติ 68 checks (`npm test`)                                                                                               |
| `test/serve.mjs`                                       | —       | ✅ dev server (`npm run serve`)                                                                                                            |
| `package.json`                                         | —       | ✅ scripts: `test`, `serve`, `check`, `lint`, `format`, `deploy`, `preview` — runtime ไม่มี dependency (devDeps แค่ ESLint + Prettier)     |
| `eslint.config.js` / `.prettierrc` / `.prettierignore` | —       | ✅ lint + format (`npm run check`)                                                                                                         |
| `README.md`                                            | —       | ✅ เอกสารเริ่มต้นใช้งาน                                                                                                                    |
| `PROJECT.md`                                           | —       | 📄 เอกสารสถานะโปรเจค (ไฟล์นี้)                                                                                                             |
| `.gitignore`                                           | —       | ✅ (`node_modules/`, `.wrangler/`, `dist/` ถูก ignore)                                                                                     |
| `wrangler.jsonc`                                       | —       | ✅ config deploy ขึ้น Cloudflare Workers (assets = repo root)                                                                              |
| `schemas/wrangler-config-schema.json`                  | 356 KB  | ✅ schema ของ `wrangler.jsonc` ฝังใน repo (กัน VS Code บล็อก `$schema` จาก CDN) — อยู่ใน `.assetsignore` ไม่อัปขึ้น Workers                |
| `.assetsignore`                                        | —       | ✅ กัน `node_modules` (workerd 127MB) ไม่ให้อัป — **บังคับมีไม่งั้น deploy พัง**                                                           |
| `archive/InDexBlackUp.v9.6.html`                       | 136 KB  | 🗄️ backup เวอร์ชันเก่า **9.6** (ย้ายออกจาก root แล้ว)                                                                                      |

**สถานะ Git:** มี repository แล้ว (`main`) — commit baseline เป็น commit แรก, การเปลี่ยนแปลงทุกอย่างต้องผ่าน commit
**ยังไม่มี:** build tool, unit test (มีแค่ E2E) · **มีแล้ว:** ESLint + Prettier (`npm run check`) · `README.md` เขียนครบแล้ว

**Deploy:** Cloudflare Workers (static assets) — `npx wrangler deploy` (มี script `npm run deploy` / `npm run preview`)

- config อยู่ใน `wrangler.jsonc` (`assets.directory: "."`) + `.assetsignore` ตัดไฟล์ development ออก
- ⚠️ ห้ามลบ `.assetsignore` — `node_modules/workerd` (~127MB) เกินโควตา 25MB ของ Workers แล้ว build จะพัง (ทดสอบแล้ว)
- เส้นทาง: push → Cloudflare build (`bun install` มีแค่ devDependencies) → `npx wrangler deploy`

โครงสร้างภายใน `app.js` (แบ่งด้วย comment `/* ===== ... ===== */`):

```
DATA        ROLES / SPECIAL / กลุ่มฝ่าย / LOGO_IMG / HERO_IMG
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

### 3.2 บทบาทครบ 32 บท (`ROLES` ใน `app.js`)

| ฝ่าย       | บทบาท                                                                                                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🐺 หมาป่า  | หมาป่า, ลูกหมาป่า, บริวารหมาป่า, นางปีศาจ (หมาป่า), หมาป่าเดียวดาย                                                                                                                                   |
| 🔵 ชาวบ้าน | เทพพยากรณ์, เทพพยากรณ์ฝึกหัด, แม่มด, นายกเทศมนตรี, บอดี้การ์ด, นักบวช, นักสืบเอกชน, ยาจก, ผู้ต้องคำสาป, ไลแคน, เจ้าชาย, ผี, นักเวท, ตัวป่วน, กามเทพ, ผู้รักสันติ, เวอร์จิเนีย วูล์ฟ, ชาวบ้าน, ยายแก่ |
| ⚫ กลาง    | ยาจก, เจ้าลัทธิ, แวมไพร์, นักเลง                                                                                                                                                                     |

คะแนนสมดุล `bp` ต่อบทบาท (ใช้ใน `balanceScore()` → แสดงเป็น "📊 คะแนนสมดุล" ในหน้าตั้งค่า, ใกล้ 0 = สมดุล, + = ฝั่งชาวบ้านได้เปรียบ):

- **Wolf team**: `werewolf -6, wolfcub -8, minion -6, sorceress -3, lone_wolf -5`
- **Village**: `villager +1, seer +7, apprentice_seer +4, witch +4, hunter +3, bodyguard +3, priest +3, pi +3, tough_guy +3, infected +3, prince +3, mayor +2, ghost +2, spellcaster +1, grandma +1, cupid +1, cursed -2, lycan -1, pacifist -1, virginia_woolf -2, troublemaker -3`
- **Neutral**: `tanner -2, cult_leader +1, vampire -7, hoodlum 0`

ครบทุกเอฟเฟกต์:

- **ลูกหมาป่า** — ตายแล้วคืนถัดไปหมาป่าฆ่า 2 คน (`markWolfCubDead`, bonus ใน `goToNight`)
- **ผู้ต้องสาป** — ถูกกัดแล้วกลายเป็นหมาป่า (แจ้งลับตอนรุ่งเช้า)
- **ผู้ป่วยติดเชื้อ** — โดนกัดแล้วเหยื่อทั้งหมดรอดในคืนถัดไป (`isWolvesInfectedThisRound`)
- **ยายแก่** — ขับไล่ 1 คน/คืน → คนนั้นไม่มีสิทธิ์โหวตวันนั้น (`getBanishedTarget`)
- **เจ้าชาย** — โดนโหวตครั้งแรกไม่ตาย + เปิดบทบาททันที (มีหน้าจอ `prince` แยก)
- **นายอำเภอ** — น้ำหนักโหวต x2 (`tally`)
- **คนโง่ / ผู้ขายหนัง** — ชนะทันทีเมื่อถูกโหวตออก (`executePlayer`); ผู้ขายหนังชนะเมื่อ **ถูกกำจัดจากทุกทาง** รวมถึงโดนกัดกลางคืน (`endNight`)
- **คู่รัก (Cupid)** — ผูก 2 คน, ตายตามกัน, ชนะเมื่อเหลือ 2 คนสุดท้ายต่างฝ่าย
- **แม่มด** — ยาพิษ/ยารักษา ใช้ได้คนละครั้ง, มี undo + โหมดเลือก
- **นายพราน** — ยิงตอนตาย (เลือกยิง/ไม่ยิง) + หน้า `hunter` แยก
- **ผู้หยั่งรู้ฝึกหัด** — เมื่อผู้หยั่งรู้ตาย เลื่อนขั้นตรวจแทน (`seerPlayer`/`isSeerPromoted`)
- **ลีแคน** — ถูกผู้หยั่งรู้อ่านผลเป็น "หมาป่า" เสมอ
- **นักบวช** — คุ้มกัน 1 คน **ครั้งเดียวตลอดเกม** (`priestTarget` + `usedPriest`)
- **นักสืบเอกชน** — ตรวจนัดเดียว: บอกว่า "เป้าหมาย + เพื่อนบ้านซ้าย/ขวา" มีหมาป่าไหม (`piChecks`)
- **นักเลงทนทาน** — โดนกัดไม่ตายทันที แต่ **แผลเลื่อนตายคืนถัดไป** (`wounded`/`woundRound`)
- **นักเวท** — ปิดปาก 1 คน/คืน → ห้ามพูดตลอดวันนั้น (`silenceTarget`)
- **จอมเวทหญิง (หมาป่า)** — ค้นว่าใครเป็นผู้หยั่งรู้ (`sorcChecks`)
- **เวอร์จิเนีย วูล์ฟ** — คืนแรกเลือก 1 คนให้ "กลัว"; ถ้าเธอถูกกำจัด เขาตายตามทันที (`vwTarget` → `killP` cause `fear`)
- **ตัวป่วน** — 1 ครั้ง/เกม บังคับให้ทุกคนโหวตวันรุ่งขึ้น ห้ามข้าม (`forceVoteRound`)
- **ผู้รักสันติ** — โหวต "ไม่ฆ่า" เสมอ (`confirmVote` บังคับเป็น skip)
- **ผี** — เสียชีวิตตั้งแต่คืนแรก (ยังให้เบาะแสผ่าน History ได้)
- **หัวหน้าลัทธิ** — ชวน 1 คน/คืน; ชนะเมื่อทุกคนอยู่ในลัทธิ (`cultRecruitables`/`cultCount`)
- **แวมไพร์** — กัด 1 คน/คืน → เหยื่อ **ตายวันรุ่งขึ้น** (`bitten`/`biteRound`), หมาป่ากัดแวมไพร์ไม่ตาย; ชนะเมื่อเหลือรอดคนสุดท้าย
- **นักเลง (hoodlum)** — คืนแรกเลือก 2 เป้า; ชนะเมื่อทั้งคู่ตายและตัวเองรอด
- **หมาป่าโดดเดี่ยว** — เล่นคนเดียว; ชนะเมื่อเหลือรอดคนสุดท้าย และ **suppress กฎ parity** ของหมาป่าระหว่างที่ยังมีชีวิต (กันเกมค้าง)

### 3.3 ระบบกลางคืน (Night Flow)

- เรียกบทบาททีละคนตามที่ยังมีชีวิต (`activeNRoles`) + **แนะนำลำดับ** (`renderNightPanel`)
- **หน้าเลือกเป้าหมายกลาง ๆ** (`renderPickN` + `N_ACTIONS`) ใช้ร่วมกันกับบทบาทใหม่ทุกตัว (นักบวช/นักสืบ/นักเวท/นางปีศาจ/ลัทธิ/แวมไพร์/ตัวป่วน/เวอร์จิเนีย วูล์ฟ/นักเลง) — เลือก N เป้า, ปุ่มข้าม (ถ้ามี), แก้ไข/undo ต่อ role (`undoN`)
- เปอร์เซ็นต์ความคืบหน้าของคืนนั้น
- โหมาป่า 2 เป้าหมาย (เมื่อเงื่อนไขเข้า) + เลือกเป้าหมายเสริมตอนลูกหมาป่าตาย
- **Undo ได้ทุก action กลางคืน** (`undoWolf/Seer/Bodyguard/Cupid` + `undoN(role)` ของบทบาทใหม่)
- สรุปผลกลางคืนแบบ dialog ของแอป พร้อมเหตุการณ์คืนนั้นทั้งหมด (กัด / ยาพิษ / คุ้มกันนักบวช / ปิดปาก / ฝีกัดแวมไพร์ / บังคับโหวต / ผีคืนแรก)
- **การตายเลื่อนเวลา** — แผลนักเลง + ฝีกัดแวมไพร์ถูก resolve ที่ต้น `endNight` ของรอบถัดไป (`woundRound`/`biteRound`) พร้อม cause ใหม่ `wound`/`bite`/`fear`/`ghost`
- บันทึกผลตรวจ Seer ลง `seerChecks` + log ทุกเหตุการณ์ (`addLog`)

### 3.4 ระบบกลางวันและการโหวต

- หน้าอภิปรายพร้อมจับเวลา (+ เตือนปิดปาก / บังคับโหวต / มีผู้รักสันติ)
- โหวตทีละคน (เลือกคนโหวต → เลือกเป้าหมาย), ปุ่ม **ข้าม** (ถูกบล็อกในวันที่ตัวป่วนบังคับ), **Undo รายคน**, **ล้างทั้งหมด**
- **ผู้รักสันติ** บังคับเป็น "ไม่ฆ่า" เสมอ + `finishVoting` ตรวจว่าทุกคนโหวตครบในวันบังคับ
- สรุปคะแนน + แจ้งรายชื่อคนยังไม่โหวต
- เสมอ → โหวตใหม่ (`tieRevote`) หรือไม่แขวน (`tieNoDeath`)
- แขวนคอ + **Undo การแขวน** (`undoExecution`, มี snapshot `preExecuteSnap`)
- ตรวจแพ้-ชนะทุกจุดเปลี่ยนเฟส (`checkWin` ถูกเรียกจาก dawn/execution/prince/voting)

### 3.5 ระบบชนะ (Win conditions)

- หมาป่าตายหมด → ชาวบ้านชนะ
- หมาป่า ≥ ชาวบ้าน → หมาป่าชนะ (**ยกเว้น** ระหว่างที่ หมาป่าเดียวดาย ยังมีชีวิตและชาวบ้านมากกว่า 0 → ยังไม่จบ)
- คู่รักต่างฝ่ายเหลือ 2 คนสุดท้าย → คู่รักชนะ
- ยาจกถูกโหวตออก → ยาจกชนะ (จบเกมทันที)
- ทุกคนอยู่ในลัทธิ (+ หัวหน้าลัทธิรอด) → ลัทธิชนะ
- นักเลง: 2 เป้าตาย + ตัวรอด → นักเลงชนะ (เช็คก่อนชาวบ้าน/หมาป่า)
- เหลือ 1 คน = หมาป่าเดียวดาย / แวมไพร์ → ฝั่งนั้นชนะ
- หน้าจบเกม: ตารางเปิดบทบาททั้งหมด + **คัดลอกผลลัพธ์** (`copyResults` + `fallbackCopy`) + ดูประวัติ + เล่นใหม่

### 3.6 UX / ระบบช่วยเหลือ

- **บันทึกเกมอัตโนมัติ** ทุกครั้งที่ state เปลี่ยน → "เล่นเกมต่อ" ได้จากหน้าแรก + แสดงเฟส/วันที่/จำนวนคนที่ค้างอยู่ (`getSaveInfo`)
- **ธีม** Dark / Light / Auto + **ขนาดตัวอักษร** 3 ระดับ + **ปลดล็อกหน้าจอค้าง** (Wake Lock API) + **สั่นแจ้งเตือน** (Vibration API)
- **จับเวลา** พร้อม beep + presets + แสดง pill บน topbar + bottom bar
- **แถบเครื่องมือล่าง (`.ux-bottom`)** — 5 ปุ่ม: 📜 ประวัติ · ⏱ เวลา/หยุด · 🎛️ **ผู้ดูแล (FAB กลมยกนูนกลางจอ)** · 🌙/☀️ กลางคืน-กลางวัน (เลื่อนขึ้นบน) · ❓ วิธีใช้ (มีจุดแจ้งเตือนเมื่อหมาป่าติดเชื้อ)
- **Moderator Panel** — กดค้าง 3 วินาทีเพื่อปลดล็อก ดูบทบาท/สถานะ/คู่รัก/ยายแก่ ได้ทุกเฟส
- **History** — ดูเหตุการณ์ย้อนหลังจัดกลุ่มตามวัน รวมผลตรวจ Seer
- **Manual assign** — แจกบทบาทเองพร้อม validator ว่าบทบาทครบพอดี
- **Balance warnings** — เตือนสมดุลเกม (ไม่มีหมาป่า / หมาป่าเยอะไป / บทบาทที่ไม่มีผล)
- **Sheet modal** กลางจอแทน dialog บางส่วน + **Dialog กลางจอ** แทน `confirm()`/`alert()` ทั้งหมด (`showDialog`/`askConfirm`/`askAlert`), XSS-safe (`esc` ทุกจุดที่แทรกชื่อผู้เล่น)
- Favicon = `assets/logo.png` + apple-touch-icon `icons/icon-180.png`, meta สำหรับ iOS PWA-capable, `viewport-fit=cover` + safe-area

### 3.7 สิ่งที่เพิ่มในรอบ P1 (25 ก.ย. 2026)

- **แยกไฟล์** — `index.html` (shell 1.7KB) + `styles.css` + `app.js` + `sw.js` v2.0.0
- **Dialog กลางจอ** แทน `confirm()`/`alert()`/`prompt()` หมดทุกจุด (`showDialog`/`askConfirm`/`askAlert`)
- **Preset ชุดบทบาท** — คลาสสิก/ปาร์ตี้/แข่งขัน (4-18 คน, ชิปแสดงตัวเลขล้วน 8 ปุ่ม) + บันทึกชุดเอง (`werewolf_presets`)
- **3 ช่องบันทึกเกม** (`werewolf_v9`, `_s2`, `_s3`) สลับจากหน้าแรก + resume ต่อเนื่อง + **ประวัติ 10 เกมล่าสุด** (`werewolf_history`)
- **เสียงแจ้งเตือน** 4 แบบ (Web Audio oscillator) + toggle ในตั้งค่า
- **Error boundary** — `render()` มี try/catch → หน้าข้อผิดพลาดพร้อมปุ่มกู้คืน
- **E2E test 56 checks** (`npm test`, test เองไม่มี dependency)

### 3.8 ดีไซน์รอบใหม่ + ปรับ dock (26 ก.ย. 2026)

- **Design token ใหม่** — dark `#0a0a0f` / light `#f6f6f8`, surface + border บาง 1px, การ์ดมุม 18px, ปุ่มสูง 50px, topbar แบบ glass, dock ลอยมุม 22px (ทั้ง 2 ธีม)
- **ฟอนต์** — Inter + Noto Sans Thai จาก Google Fonts แบบ `media="print"` (ไม่บล็อกตอนออฟไลน์) + fallback ระบบ
- **โลโก้ PNG ใหม่ทั้งชุด** — `assets/logo.png` (512), `icons/*.png` (any + maskable), `icon.svg` + `assets/hero.png` เป็นภาพ banner placeholder (เปลี่ยนแทนที่ไฟล์เดิมได้เลย)
- **แถบล่าง 5 ปุ่ม + FAB ผู้ดูแล** — ปุ่ม "จบกลางคืน" ยก `bottom` 126px + `#app:has(.ux-bottom)` เพิ่ม padding ล่าง กัน FAB ทับปุ่ม/เนื้อหา
- **Preset chips** — ชื่อไทยล้วน (คลาสสิก/ปาร์ตี้/แข่งขัน), ชิปจำนวนคนเป็นตัวเลขล้วน 8 ปุ่ม (4-18) เรียงเต็ม 4×2, ชิป preset ไฮไลต์ + ✓ อัตโนมัติเมื่อบทบาทตรงกับชุดนั้น (`activePresetKind()`)
- **ภาพบทบาทแทนอิโมจิ** — `roleImg(roleId)` ใส่ `<img>` สัดส่วน 3:4 ทุกจุดที่เคยขึ้น `R.icon` (หน้าแจกบทบาท 200px, การ์ดกลางคืน 46px, badge 22px, ชิปประวัติ 16px, ตารางตั้งค่า/ม็อด/หน้าจบเกม) — ไฟล์ `assets/roles/<roleId>.jpg` + fallback `assets/role.jpg` (`onerror`), `sw` precache ภาพกลางไว้ใช้ออฟไลน์
- ตรวจแล้ว: `npm run check` + `npm test` **68/68 ผ่าน**

---

## 4. สิ่งที่ยังไม่ได้ทำ / จุดที่ยังขาด (Not Done / Known Gaps)

### 4.1 โครงสร้างและวิศวกรรม (Engineering)

- ✅ **Version Control** — มี git repo แล้ว (branch `main`, commit baseline แล้ว) — _ทำเสร็จในรอบ P0_
- ✅ **Lint + format** — ESLint 10 (flat config) + Prettier 3 เป็น devDependencies, `npm run check` รัน `eslint .` + `prettier --check .` (โค้ดที่ deploy ยังไม่มี dependency) — _ทำเสร็จแล้ว_
- ✅ **Test อัตโนมัติ (E2E)** — `test/smoke.mjs` (Node + Chrome DevTools Protocol, 68 checks, test เองไม่มี dependency) รันด้วย `npm test` — _ทำเสร็จในรอบ P1_
- ⬜ **Test manual ครบทุกข้อ** — ยังต้องเดิน `TESTING.md` ด้วยมือบนมือถือจริงก่อนปล่อย
- 🟡 **แยกไฟล์แล้วแต่ยังไม่ modular** — `index.html` + `styles.css` (~28KB) + `app.js` (~150KB) ยังเป็นไฟล์เดียวต่อหนึ่ง concern แก้ส่วนหนึ่งอาจพังส่วนอื่น (มี E2E กัน)
- ❌ **ใช้ global functions + `onclick` inline ทั้งหมด** — ยากต่อการ refactor/ติดบั๊ก, ไม่มี module
- ✅ **Error boundary** — `render()` มี try/catch → หน้าข้อผิดพลาด + ปุ่มกู้คืน แทนหน้าขาว — _ทำเสร็จในรอบ P1_
- ✅ **Backup file ถูกย้ายแล้ว** — `InDexBlackUp.html` → `archive/InDexBlackUp.v9.6.html` — _ทำเสร็จในรอบ P0_
- 🟡 **README มีแล้ว แต่ยังไม่มี CHANGELOG / LICENSE** — คนอื่นเปิดมาเริ่มได้จาก `README.md` แล้ว

### 4.2 ฟีเจอร์ที่ยังไม่มี (Feature gaps)

- ✅ **PWA** — มี `manifest.json` + `sw.js` (cache-first + background revalidate) → ใช้ออฟไลน์/เพิ่มลงหน้าจอหลักได้แล้ว — _ทำเสร็จในรอบ P0_ (เหลือทดสอบบนมือถือจริงตาม `TESTING.md` §7)
- 🟡 **เสียงแจ้งเตือนมี 4 แพทเทิร์นแล้ว** (หมดเวลา/จบกลางคืน/ผลโหวต/เกมจบ) — ยังไม่มีเสียงธีม (เสียงหอน, กลอง) และเสียงตอนรุ่งเช้า
- ✅ **Preset ชุดบทบาท** — คลาสสิก/ปาร์ตี้/แข่งขัน + บันทึกชุดเองแล้ว — _ทำเสร็จในรอบ P1 (P1 #7)_
- ✅ **บันทึกหลายเกม + ประวัติย้อนหลัง** — 3 ช่อง + ประวัติ 10 เกมล่าสุดแล้ว — _ทำเสร็จในรอบ P1 (P1 #8)_
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
- ✅ ~~`localStorage` เต็ม/ถูกบล็อกใน Safari private mode แล้ว user ไม่รู้~~ — `save()` คืนค่า + เตือนครั้งเดียวตอนเกิด (`warnSaveFailed`) + แสดง `⚠️ บันทึกไม่สำเร็จ` ที่หน้าแรก
- ⚠️ Wake Lock ต้องขอใหม่ทุกครั้งที่ tab สลับ (`visibilitychange`) — ตรวจแล้วมี แต่ถ้า browser ไม่รองรับจะนิ่งเงียบ
- ⚠️ ไม่มีการ lock หน้าจอระหว่างเปิด Moderator Panel — ถ้าผู้เล่นเหลือบมองเห็นบทบาทหมด
- ⚠️ **`icon.svg` ต้องเล็ก (KB)** — เคยมีไฟล์ 39MB (PNG ถูก vectorize เป็น `<rect>` 1×1 ล้านชิ้น) แล้ว Chrome โหลด/parse ตอนอ่าน manifest → main thread ค้าง → E2E timeout หลายจุด (`Page.captureScreenshot`/`evaluate` ไม่ตอบ) — ตอนนี้เปลี่ยนเป็น **artwork ชุดใหม่ (หัวหมาป่าสายไซเบอร์) ฝังเป็น base64 PNG 512×512 ภายใน SVG → 129 KB** ถ้าจะอัปเดตไอคอนให้ export PNG ≤512 แล้วฝังแบบเดิม (อย่า vectorize เป็น rect)

---

## 5. ควรทำอะไรต่อ (Recommended Next Steps)

จัดลำดับตามความคุ้มค่า/ความเสี่ยง:

### 🔴 P0 — ต้องทำก่อน (กันงานพัง) — ✅ ทำเสร็จแล้ว (25 ก.ย. 2026)

1. **เริ่ม Git + commit ของที่มีอยู่** — ✅ `git init` (branch `main`) + `.gitignore` + commit baseline `acd3998`
2. **ย้าย `InDexBlackUp.html`** — ✅ ย้ายไป `archive/InDexBlackUp.v9.6.html` (ประวัติเก่าอยู่ใน git แล้ว)
3. **เพิ่ม PWA** — ✅
   - `manifest.json` (ชื่อไทย, `display: standalone`, scope `./`, ไอคอน 5 แบบ)
   - `sw.js` (v1.0.0 → v1.7.0) — precache shell, network-first สำหรับ navigation (fallback cache ถ้าเน็ตขาด), cache-first + revalidate ตอนหลัง สำหรับ asset, cleanup cache เก่า, **ทุก path จับ error ครบ → ไม่มีทาง reject เป็น `ERR_FAILED`**, มีหน้า self-heal (unregister SW แล้ว reload) เป็นตาข่ายสุดท้าย
   - ไอคอน `icon.svg` + `icons/icon-180|192|512.png` + `icons/icon-maskable-192|512.png`
   - `index.html`: เพิ่ม `<link rel="manifest">`, `apple-touch-icon` เป็น PNG จริง, meta description, และลงทะเบียน SW (เฉพาะ http/localhost)
   - **ผลทดสอบอัตโนมัติผ่านแล้ว**: SW registered + controlling, cache ครบ 10 รายการ, จำลอง Offline แล้วรีเฟรช → แอปโหลดได้
4. **Smoke test checklist** — ✅ เขียน `TESTING.md` ครบทั้ง 8 หัวข้อ (ตั้งค่า/กลางคืน/รุ่งเช้า/โหวต/เคสชนะ/save/PWA/UX) — **ยังไม่ได้เดิน test จริงทุกข้อ ต้องทำก่อนปล่อย**

### 🟡 P1 — คุณภาพชีวิต + ลดบั๊ก — ✅ ทำเสร็จแล้วทุกข้อ (25 ก.ย. 2026)

5. ✅ **แยกไฟล์** → `index.html` (shell 1.7KB) + `styles.css` + `app.js` — _ทำเสร็จแล้ว_ (มี E2E test ยืนยัน 56/56 + ทดสอบออฟไลน์ผ่าน)
6. ✅ **แทนที่ `confirm()`/`alert()` ทั้งหมด** — _ทำเสร็จแล้ว_: เพิ่ม `showDialog()/askConfirm()/askAlert()` (overlay `#dialogOverlay`, รองรับ Enter/Esc, backdrop click, `danger`/`single` mode) แทน native 12 จุด (`clearSave`, `continueGame`, `confirmLeaveGame`, `resetAssign`, `endNight`, `confirmSkipVote`, `resetVotes`, `finishVoting`, `modStart`, `copyResults`, `fallbackCopy`) — **E2E 51/51 ผ่าน** (`sw.js` bump เป็น v1.6.0)
7. ✅ **เพิ่ม Preset ชุดบทบาท** — _ทำเสร็จแล้ว_: การ์ด "⚡ Preset ชุดบทบาท" ในหน้าตั้งค่า — 3 ชุดพร้อมใช้ (`⚖️ คลาสสิก` / `🎉 ปาร์ตี้` / `🏆 แข่งขัน` สร้างตามจำนวนผู้เล่น 4-18 คน ผ่าน `canStart()` + ไม่มี ⚠ ทุกขนาด) + ชิปจำนวนผู้เล่น 4-18 (ตัวเลขล้วน 8 ปุ่ม เรียงเต็ม 4x2, ไฮไลต์ปุ่มที่ตรงกับจำนวนปัจจุบัน + ชิป preset ขึ้น ✓ เมื่อบทบาทตรงกับชุดนั้น) + **บันทึก/โหลด/ลบชุดเอง** เก็บใน `localStorage` key `werewolf_presets` (สูงสุด 10 ชุด, ลบมี dialog ยืนยัน) — **E2E 51/51 ผ่าน**
8. ✅ **หลาย slot บันทึกเกม + ประวัติย้อนหลัง** — _ทำเสร็จแล้ว_: 3 ช่องบันทึก (`werewolf_v9`, `_s2`, `_s3`) สลับได้จากหน้าแรก (ชิป "ช่อง 1/2/3" + สถานะ มีเกม/จบแล้ว/ว่าง, เก็บช่อง active ใน `werewolf_slot_idx`, ช่อง 1 ใช้คีย์เดิม → ของเก่าไม่หาย) · สลับช่องแล้ว "เล่นต่อ" resume กลับเฟสเดิมได้ · **ปุ่ม "📖 ผลย้อนหลัง"** เก็บเกมที่จบ 10 เกมล่าสุด (`werewolf_history`: ผู้ชนะ/รอบ/ชื่อ+บทบาททุกคน, ผู้ตายขีดฆ่า) — **E2E 51/51 ผ่าน**
9. ✅ **เพิ่มเสียงแจ้งเตือน** — _ทำเสร็จแล้ว_: `beep(kind)` สร้างจาก Web Audio oscillator (AudioContext อินส턴ซ์เดียว, 4 แพทเทิร์น: `timeup` หมดเวลา / `night` จบกลางคืน / `vote` ประกาศผลโหวต / `win` เกมจบ) + toggle "🔔 เสียงแจ้งเตือน" ในหน้าตั้งค่า (`S.setup.sound`, ปิดแล้วเงียบ) — **E2E 51/51 ผ่าน**
10. ✅ **Error boundary** — _ทำเสร็จแล้ว_: `render()` ครอบด้วย try/catch + guard กันเรียกซ้ำ → หน้า "⚠️ เกิดข้อผิดพลาด" พร้อมข้อความ error, ปุ่ม "🔄 ลองใหม่" / "🏠 กลับหน้าแรก" (ล้มเหลวอีก → reload) แทนหน้าขาว, log ด้วย `console.error` — **E2E 51/51 ผ่าน**

### 🟢 P2 — ปรับปรุง (เมื่อของหลักนิ่งแล้ว)

11. **Unit test สำหรับ logic ล้วน** — ย้าย `checkWin`, `tally`, `endNight` resolution, `balanceWarnings` ออกมาเป็น module แล้วทดสอบด้วย Vitest/Node test
12. ✅ **ESLint + Prettier** + script `npm run check` — _ทำเสร็จแล้ว_ (ESLint 10 flat config, Prettier 3, devDependencies เท่านั้น)
13. **แชร์ผลเกมเป็นรูปภาพ** (canvas render เป็นการ์ดผล + ดาวน์โหลด/แชร์ผ่าน Web Share API)
14. **คู่มือบทบาทแบบเต็มในแอป** — หน้า "📖 บทบาททั้งหมด" อธิบายเงื่อนไขชนะ + interaction ข้ามบทบาท
15. **Accessibility**: เพิ่ม ARIA, ปุ่มขนาดใหญ่พิเศษ, ทดสอบ contrast ธีม light
16. **i18n (EN)** ถ้าต้องการขยายผู้ใช้
17. ✅ **Save schema / migration rule** — _ทำเสร็จแล้ว_: แยก 3 ตัวแปรให้หน้าที่ชัดเจน — `SAVE_KEY` (ชื่อคีย์, เปลี่ยนเฉพาะตอนล้างข้อมูลเก่า), `VER` (เวอร์ชันแอป = `package.json`), `SAVE_SCHEMA` (โครงสร้าง payload, +1 ทุกครั้งที่ shape เปลี่ยน) + ย้าย logic เติม field ตอนโหลดออกจาก `load()` ไปไว้ **`migrateSave()`** — กฎอยู่ใน `README.md`
18. ✅ **ระบบบทบาทใหม่ 17 บท (รวม 32 บท)** — _ทำเสร็จแล้ว_: เพิ่ม `bp` ทุกบทบาท + `balanceScore()`/`balanceMeter()` ในหน้าตั้งค่า · หน้าเลือกเป้าหมายกลาง `renderPickN` + `N_ACTIONS` (นักบวช/นักสืบ/นักเวท/นางปีศาจ/ลัทธิ/แวมไพร์/ตัวป่วน/เวอร์จิเนีย วูล์ฟ/นักเลง) + `undoN` · การตายเลื่อนเวลา (`woundRound`/`biteRound` resolve ใน `endNight` รอบถัดไป) · vampire รอดหมาป่า + `tough_guy` mark wounded + ghost ตายคืนแรก + lycan อ่านเป็นหมาป่า + นักบวชคุ้มกันครั้งเดียว + นักเวทปิดปาก + `forceVoteRound` บังคับโหวต + ผู้รักสันติโหวตสุภาพอัตโนมัติ · เงื่อนไขชนะใหม่ (lone wolf parity suppress, hoodlum, cult, vampire last-survivor, tanner ทุกทาง) · `DEATH_CAUSE_LABEL` ใหม่ + moderator panel สถานะใหม่ · รูป 31 การ์ด · **E2E 68/68 ผ่าน** (`sw.js` bump เป็น v2.1.0, `SAVE_SCHEMA` 3)
19. ✅ **ปรับปรุงชื่อบทบาท + ป้ายฝ่ายใหม่ + ตัดหมอ/คนโง่** — เปลี่ยนชื่อตามขอของผู้ใช้ (เทพพยากรณ์, กามเทพ ฯ) + ป้ายฝ่ายใหม่ `🔴 ฝ่ายหมาป่า (Werewolf Team)` / `🔵 ฝ่ายชาวบ้าน (Villager Team)` / `⚫ ฝ่ายอิสระ` + ป้าย GM เปลี่ยนเป็น `ผู้ดำเนินเกม (GM)` + ลบบทบาท `หมอ` และ `คนโง่` ออกจากเกม + มี migration สำหรับบทบาทเดิม + ลบไฟล์ `doctor.jpg`/`fool.jpg`
20. ✅ **หน้าตั้งค่า: ชาวบ้านหลายตัว + สุ่มตามสมดุล + สรุปก่อนเริ่มเกม** — แก้ `SINGLETON_ROLES` ไม่ให้จำกัดชาวบ้านไว้ 1 (เพิ่ม/ลดได้หลายตัว) · รูปบทบาทเหลือ 360×480px (เลื่อนไม่ยาว) · ปุ่ม `🎲 สุ่มบทบาทตามสมดุล` (`autoBalanceRoles()` เลือกบทบาทตามจำนวนผู้เล่น 4-18 + ปล่อยว่าง ≥2 ให้ชาวบ้าน) · การ์ด `📋 สรุปบทบาทในเกม` แสดงครบก่อนกดเริ่ม + dialog ยืนยัน (`confirmStartGame()`) สรุปทุกฝ่าย/จำนวน/คะแนนสมดุลก่อนเข้ากลางคืน · **E2E 71/71 ผ่าน** (`sw.js` bump เป็น v2.2.0)

---

## 6. สรุปสั้น ๆ

| หัวข้อ                                                                                                                                                                                                                                                        | สถานะ                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| เล่นได้จริงครบทุกเฟสเกม                                                                                                                                                                                                                                       | ✅ ครบ                                    |
| บทบาทครบ 31 + เอฟเฟกต์ครบ                                                                                                                                                                                                                                     | ✅ ครบ                                    |
| Undo / History / Save-Resume                                                                                                                                                                                                                                  | ✅ มี                                     |
| ธีม, จับเวลา, Wake Lock, Haptic                                                                                                                                                                                                                               | ✅ มี                                     |
| **P0: Git / archive / PWA / checklist**                                                                                                                                                                                                                       | ✅ **เสร็จแล้ว**                          |
| Smoke test จริงครบทุกข้อใน `TESTING.md`                                                                                                                                                                                                                       | ⬜ ยังไม่ได้ทำ (แต่มี E2E 68/68 แทน)      |
| README / Tests / Lint                                                                                                                                                                                                                                         | ✅ มีครบ                                  |
| แยกไฟล์ / modular                                                                                                                                                                                                                                             | ✅ `index.html` + `styles.css` + `app.js` |
| แทน `confirm()`/`alert()` ด้วย dialog ของแอป                                                                                                                                                                                                                  | ✅ ทำเสร็จแล้ว                            |
| preset / multi-slot / ประวัติเกม / เสียง                                                                                                                                                                                                                      | ✅ มีครบ                                  |
| เตือนตอนบันทึกไม่สำเร็จ + save schema / migration rule                                                                                                                                                                                                        | ✅ ทำเสร็จแล้ว                            |
| **ทำเสร็จแล้ว:** P0 ทั้ง 4 ข้อ + P1 ครบทั้ง 10 ข้อ + P2 #12 lint/format + P2 #17 save schema + **บทบาทใหม่ 17 บท (รวม 31 บท) + รูปการ์ด 31 ใบ** → **ต่อไป:** เดิน `TESTING.md` ด้วยมือบนมือถือจริงก่อนปล่อย แล้วค่อยต่อ **P2** (unit test, แชร์เป็นรูป, a11y) |

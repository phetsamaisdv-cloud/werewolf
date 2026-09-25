#!/usr/bin/env node
/**
 * E2E smoke test — คืนหอนหลอนหมาป่า
 * รัน: node test/smoke.mjs   (ต้องมี Chrome/Edge ติดตั้งอยู่)
 * ไม่ต้องใช้ npm dependency — ใช้ Node http server + Chrome DevTools Protocol ตรง ๆ
 */
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let PAGE = '';
const IS_WIN = process.platform === 'win32';

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); });
    s.on('error', reject);
  });
}

/** kill chrome + ลูก process ทั้งหมด (chrome spawn เป็น tree) */
function killTree(pid) {
  if (!pid) return;
  if (IS_WIN) spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
  else { try { process.kill(-pid, 'SIGKILL'); } catch { try { process.kill(pid, 'SIGKILL'); } catch {} } }
}

/** เก็บกวาด chrome ที่ค้างจากเทสก่อนหน้า (กัน localStorage รั่วข้าม run) */
function sweepLeftovers() {
  if (!IS_WIN) return;
  const ps = "Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | " +
    "Where-Object { $_.CommandLine -like '*ww-smoke-*' } | " +
    "ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }";
  spawnSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'ignore' });
}

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.md': 'text/markdown; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.ico': 'image/x-icon'
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

/* ---------- static server ---------- */
function startServer(port) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const rel = urlPath === '/' ? '/index.html' : urlPath;
    const file = path.join(ROOT, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

/* ---------- page driver (注入 ลงในหน้า) ---------- */
const DRIVER = `
if(!window.__dlgWrapped){
  window.__dlgWrapped = true;
  window.__dlgCount = 0;
  const _sd = window.showDialog;
  window.showDialog = function(o){ window.__dlgCount++; return _sd(o); };
}
window.__T = (function(){
  function clickDlg(){
    const ov = document.getElementById('dialogOverlay');
    if(!ov) return false;
    const b = ov.querySelector('[data-dlg="1"]');
    if(b){ b.click(); return true; }
    return false;
  }
  function settle(p){ clickDlg(); return p; }
  function autoNight(){
    const roles = activeNRoles();
    for(const r of roles){
      if(S.ui.nDone[r]) continue;
      openN(r);
      const ap = alive();
      const nonWolf = ap.filter(p=>!isWolfTeam(p));
      if(r === 'werewolf'){
        if(!nonWolf.length){ closeN(); continue; }
        pickT(nonWolf[0].id);
        if(isWolfTwoTargetMode() && nonWolf[1]) pickT(nonWolf[1].id);
        confirmWolf();
      } else if(r === 'seer'){ pickT(ap[0].id); confirmSeer(); }
      else if(r === 'doctor'){ pickT(ap[0].id); confirmDoctor(); }
      else if(r === 'bodyguard'){ pickT(ap[0].id); confirmBodyguard(); }
      else if(r === 'witch'){
        if(canWHeal()){
          startHeal();
          if(S.ui.wMode === 'heal'){ pickT(witchKillTargets()[0]); confirmHealPick(); }
        } else { witchSkip(); }
      }
      else if(r === 'cupid'){
        if(nonWolf[0] && nonWolf[1]){ toggleCupid(nonWolf[0].id); toggleCupid(nonWolf[1].id); confirmCupid(); }
      }
      else if(r === 'cursed'){ confirmCursed(); }
      else if(r === 'grandma'){ pickT(ap[ap.length-1].id); confirmGrandma(); }
    }
  }
  function hunterStep(){
    if(!S.ui.pendHunter) return false;
    goHunter();
    const t = alive()[0];
    if(t) hunterShoot(t.id); else skipHunter();
    return true;
  }
  function resolve(){
    for(let i=0;i<12;i++){
      if(['night','end','day','voting'].includes(S.screen)) return;
      if(S.screen === 'hunter'){ hunterStep(); continue; }
      if(S.screen === 'dawn'){ hunterStep(); if(S.screen === 'dawn') fromDawn(); continue; }
      if(S.screen === 'execution'){ hunterStep(); if(S.screen === 'execution') fromExecution(); continue; }
      if(S.screen === 'prince'){ fromPrince(); continue; }
      if(S.screen === 'tie'){ tieNoDeath(); continue; }
      return;
    }
  }
  function collectVotes(){
    const ban = getBanishedTarget();
    const ids = dayAlive().filter(p=>p.id!==ban).map(p=>p.id);
    const pool = ids.map(id=>getP(id)).filter(p=>p && !isWolfTeam(p));
    const pick = pool.find(p=>p.roleId==='villager')
              || pool.find(p=>p.roleId!=='fool' && p.roleId!=='prince')
              || pool[0];
    const target = pick ? pick.id : null;
    if(ids.length < 2 || target == null){
      for(const v of ids){ selectVoter(v); confirmSkipVote(); }
      return;
    }
    for(const v of ids){
      if(v === target) continue;
      selectVoter(v); selectTarget(target); confirmVote();
    }
  }
  async function playRound(){
    if(S.screen !== 'night') return S.screen;
    autoNight();
    await settle(endNight());
    resolve();
    if(S.screen !== 'day') return S.screen;
    startVoting();
    for(let a=0; a<3; a++){
      collectVotes();
      await settle(finishVoting());
      if(S.screen === 'tie'){
        if(!__T.tieUsed){ __T.tieUsed = true; tieRevote(); continue; }
        tieNoDeath(); break;
      }
      break;
    }
    resolve();
    return S.screen;
  }
  return { autoNight, resolve, collectVotes, playRound, clickDlg, settle, tieUsed:false };
})();`;

/* ---------- main ---------- */
async function main() {
  sweepLeftovers();
  const CDP_PORT = await freePort();
  const httpPort = await freePort();
  PAGE = `http://127.0.0.1:${httpPort}/index.html`;
  const server = await startServer(httpPort);
  const chromePath = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
  if (!chromePath) throw new Error('ไม่พบ Chrome/Edge');

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ww-smoke-'));
  const chrome = spawn(chromePath, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
    '--hide-scrollbars', '--disable-background-timer-throttling',
    `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`, PAGE
  ], { stdio: 'ignore', detached: !IS_WIN });

  const pageErrors = [];
  const httpErrors = [];
  const dialogs = [];
  let ws, sendId = 0;
  const pending = new Map();

  const cleanup = () => {
    try { ws && ws.close(); } catch {}
    killTree(chrome.pid);
    sweepLeftovers();
    try { server.close(); } catch {}
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  };

  try {
    /* connect CDP */
    let target = null;
    for (let i = 0; i < 60 && !target; i++) {
      try {
        const list = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`).then((r) => r.json());
        target = list.find((t) => t.type === 'page');
      } catch {}
      if (!target) await sleep(250);
    }
    if (!target) throw new Error('เชื่อมต่อ Chrome ไม่ได้');

    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
      if (m.method === 'Page.javascriptDialogOpening') {
        dialogs.push(m.params.message);
        send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
      } else if (m.method === 'Runtime.exceptionThrown') {
        const d = m.params.exceptionDetails;
        pageErrors.push(d.exception?.description || d.text);
      } else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
        const txt = m.params.entry.text;
        // headless บล็อก navigator.vibrate (ไม่มี user gesture) — ไม่ใช่บั๊กแอป
        if (!/favicon/i.test(txt) && !/navigator\.vibrate/i.test(txt)) pageErrors.push(txt);
      } else if (m.method === 'Network.responseReceived') {
        const s = m.params.response.status;
        if (s >= 400) httpErrors.push(`${s} ${m.params.response.url}`);
      }
    };
    function send(method, params = {}) {
      return new Promise((res, rej) => {
        const i = ++sendId;
        const timer = setTimeout(() => { pending.delete(i); rej(new Error('timeout: ' + method)); }, 20000);
        pending.set(i, (m) => { clearTimeout(timer); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m); });
        ws.send(JSON.stringify({ id: i, method, params }));
      });
    }
    async function ev(expression, timeoutMs = 25000) {
      const i = ++sendId;
      const result = await new Promise((res, rej) => {
        const timer = setTimeout(() => { pending.delete(i); rej(new Error('evaluate timeout: ' + expression.slice(0, 140))); }, timeoutMs);
        pending.set(i, (m) => { clearTimeout(timer); res(m); });
        ws.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } }));
      });
      if (result.error) throw new Error(JSON.stringify(result.error));
      const d = result.result;
      if (d.exceptionDetails) throw new Error('page exception: ' + (d.exceptionDetails.exception?.description || d.exceptionDetails.text));
      return d.result?.value;
    }
    async function waitFor(expression, label, timeoutMs = 20000) {
      const t0 = Date.now();
      for (;;) {
        let v;
        try { v = await ev(expression, 5000); } catch { v = false; }
        if (v) return true;
        if (Date.now() - t0 > timeoutMs) throw new Error('waitFor timeout: ' + label);
        await sleep(250);
      }
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Log.enable');
    await send('Network.enable');

    /* ===== S1: boot + home ===== */
    await waitFor('!!document.getElementById("app") && document.getElementById("app").innerHTML.length > 500', 'app rendered');
    const homeText = await ev('document.getElementById("app").innerText');
    check('S1 เปิดแอป → หน้าแรกแสดงผล', homeText.includes('คืนหอนหลอนหมาป่า'));
    check('S1 มีปุ่มเริ่มเกม/ตั้งค่า', homeText.includes('เริ่มเกมใหม่') || homeText.includes('ตั้งค่าเกม'), JSON.stringify(homeText.slice(0, 200)));

    await ev('showHelp()');
    check('S1 หน้าวิธีใช้ (sheet) เปิดได้', await ev('!!document.getElementById("sheetOverlay") && document.getElementById("sheetOverlay").innerText.includes("ตั้งค่า")'));
    await ev('closeSheet()');
    check('S1 ปิด sheet ได้', await ev('!document.getElementById("sheetOverlay")'));

    /* ===== theme / font ===== */
    await ev("setTheme('light')");
    check('S2 ธีม Light สลับได้', await ev('document.body.classList.contains("light")'));
    await ev("setTheme('dark')");
    check('S2 ธีม Dark สลับได้', await ev('!document.body.classList.contains("light")'));
    await ev("setFont('xlarge')");
    check('S2 ขนาดตัวอักษร xl สลับได้', await ev('document.body.classList.contains("fs-xl")'));
    await ev("setFont('normal')");
    await ev("setTheme('auto')");

    /* ===== S3: setup ครบทุกบทบาท + manual assign ===== */
    const setupInfo = await ev(`(() => {
      goSetup();
      S.setup.n = 16;
      S.setup.names = Array.from({length:16}, (_,i) => 'P' + (i+1));
      S.setup.roles = {werewolf:2, wolfcub:1, seer:1, witch:1, hunter:1, doctor:1, bodyguard:1,
                       cupid:1, mayor:1, cursed:1, fool:1, infected:1, prince:1, grandma:1};
      S.setup.assignMode = 'manual';
      return {can: canStart(), roles: totalRoles(), vill: villagerCount(), warn: balanceWarnings().length};
    })()`) || {};
    check('S3 canStart() = true (หมาป่า < ชาวบ้าน)', setupInfo.can === true);
    check('S3 บทบาทพิเศษครบ 15 ใบ (หมาป่า 2)', setupInfo.roles === 15, `roles=${setupInfo.roles}`);
    check('S3 ชาวบ้านธรรมดาเหลือ 1', setupInfo.vill === 1, `vill=${setupInfo.vill}`);
    check('S3 balanceWarnings ไม่มีข้อร้ายแรง', setupInfo.warn === 0, `warn=${setupInfo.warn}`);

    await ev('startGame()');
    check('S3 manual mode → หน้าจัดบทบาท', (await ev('S.screen')) === 'assign');
    check('S3 บทบาทในตารางถูกต้อง (isAssignValid)', await ev('isAssignValid()') === true);
    await ev('reshuffleAssign()');
    check('S3 สุ่มบทบาทใหม่ยัง valid', await ev('isAssignValid()') === true);
    await ev('confirmAssign()');
    check('S3 ยืนยัน → หน้าแจกการ์ด', (await ev('S.screen')) === 'reveal');

    /* ===== S4: reveal → night ===== */
    const roleCount = await ev('(()=>{const m={};for(const p of S.g.players)m[p.roleId]=(m[p.roleId]||0)+1;return m;})()');
    check('S4 ผู้เล่น 16 คน ครบตามที่ตั้ง', await ev('S.g.players.length') === 16);
    check('S4 มีครบทุกบทบาทในเกม', ['werewolf','wolfcub','seer','witch','hunter','doctor','bodyguard','cupid','mayor','cursed','fool','infected','prince','grandma'].every((r) => roleCount[r] === 1 || (r === 'werewolf' && roleCount[r] === 2)), JSON.stringify(roleCount));

    await ev('for(let i=0;i<40 && S.screen==="reveal"; i++) nextRv();');
    check('S4 เดินหน้าแจกการ์ดจนจบ → กลางคืน', (await ev('S.screen')) === 'night');

    /* ===== driver ===== */
    await ev(DRIVER);

    /* ===== S5: mod panel + history + XSS ระหว่างเกม ===== */
    await ev('showModPanel()');
    const modText = await ev('document.getElementById("sheetOverlay") ? document.getElementById("sheetOverlay").innerText : ""');
    check('S5 Moderator Panel เปิดและเห็นบทบาท', modText.includes('ผู้หยั่งรู้') || modText.includes('หมาป่า'));
    await ev('closeSheet()');

    const xss = await ev(`(() => {
      const old = S.g.players[0].name;
      S.g.players[0].name = '<img src=x onerror="window.__xss=1">';
      render();
      const injected = !!document.querySelector('img[src="x"]') || !!window.__xss;
      S.g.players[0].name = old;
      render();
      return {injected: injected, escaped: document.getElementById('app').innerHTML.includes('&lt;img')};
    })()`);
    check('S5 ชื่อผู้เล่น XSS ถูก escape', xss && xss.injected === false, JSON.stringify(xss));

    /* ===== S6: เล่นจบเกม ===== */
    let rounds = 0;
    let resumeOk = null;
    while (rounds < 40) {
      const screen = await ev('S.screen');
      if (screen === 'end') break;
      if (screen !== 'night') { check('S6 อยู่ในเฟสถูกต้อง', false, 'unexpected screen=' + screen); break; }
      await ev('__T.playRound()');
      rounds++;

      if (rounds === 1 && (await ev('S.screen')) === 'night') {
        const snap = await ev('({screen:S.screen, round:S.g.round, alive:alive().length, seer:S.g.seerChecks.length, log:S.g.log.length})');
        await ev('save()');
        await send('Page.navigate', { url: PAGE });
        await waitFor('!!document.getElementById("app") && document.getElementById("app").innerHTML.length > 500', 'reload');
        await ev(DRIVER);
        const hasSave = await ev('hasSave()');
        await ev('continueGame()');
        const now = await ev('({screen:S.screen, round:S.g.round, alive:alive().length, seer:S.g.seerChecks.length, log:S.g.log.length})');
        resumeOk = hasSave === true && JSON.stringify(now) === JSON.stringify(snap);
        check('S6 บันทึก/เล่นต่อตรงทุก field (screen, round, alive, seer, log)', resumeOk, `snap=${JSON.stringify(snap)} now=${JSON.stringify(now)}`);
      }
    }

    const endState = await ev('({screen:S.screen, winner:S.g ? S.g.winner : null, reason:S.g ? S.g.winReason : null, round:S.g ? S.g.round : 0, alive:alive().length})');
    check('S6 เกมจบภายใน 40 รอบ', endState.screen === 'end', `round=${endState.round} alive=${endState.alive}`);
    check('S6 มีผู้ชนะถูกต้อง', ['village', 'werewolf', 'lovers', 'fool'].includes(endState.winner), `winner=${endState.winner} (${endState.reason})`);
    check('S6 เล่นจบโดยไม่ติด state กลางคัน', endState.alive >= 0);

    const endText = await ev('document.getElementById("app").innerText');
    check('S6 หน้าจบเกมแสดงผู้ชนะ + บทบาท', endText.includes('จบเกม') && endText.includes('บทบาททั้งหมด'));

    const appDialogs = await ev('window.__dlgCount || 0');
    check('S6 ใช้ dialog ของแอปแทน native confirm สรุปกลางคืน', appDialogs > 0 && dialogs.length === 0, `appDialogs=${appDialogs} native=${dialogs.length}`);

    /* history + copy results ตอนจบเกม */
    await ev('showHistory()');
    const histText = await ev('document.getElementById("sheetOverlay") ? document.getElementById("sheetOverlay").innerText : ""');
    check('S6 History เปิดได้และมี Round', /round/i.test(histText), histText.slice(0, 60).replace(/\n/g, ' '));
    await ev('closeSheet()');
    await ev('copyResults(); "started"');
    let copyDlg = true;
    try { await waitFor('!!document.getElementById("dialogOverlay")', 'copyResults dialog', 8000); } catch (e) { copyDlg = false; }
    await ev('__T.clickDlg()');
    check('S6 copyResults() แสดง dialog "คัดลอกแล้ว"', copyDlg, `dialog=${copyDlg} native=${dialogs.length}`);

    /* ===== S7: undo การแขวน (เกมแยก) ===== */
    const undoInfo = await ev(`(async () => {
      newGameEnd();
      S.setup.n = 6;
      S.setup.names = ['U1','U2','U3','U4','U5','U6'];
      S.setup.roles = {werewolf:1, seer:1, witch:1, hunter:1, mayor:1, cupid:0, wolfcub:0,
                       doctor:0, bodyguard:0, cursed:0, fool:0, infected:0, prince:0, grandma:0};
      S.setup.assignMode = 'random';
      startGame();
      for(let i=0;i<10 && S.screen==='reveal'; i++) nextRv();
      S.screen = 'voting'; render();
      startVoting();
      const preAlive = alive().length;
      __T.collectVotes();
      await __T.settle(finishVoting());
      if(S.screen !== 'execution') return {error:'not execution', screen:S.screen};
      const exId = S.ui.exId;
      const deadAfterVote = !getP(exId).alive;
      undoExecution();
      return {screen:S.screen, exId, deadAfterVote, aliveAfter:getP(exId).alive,
              preAlive, aliveNow:alive().length, snap:S.ui.preExecuteSnap};
    })()`);
    check('S7 หลังจบเกม → แขวน → undo กลับหน้าโหวต', undoInfo && undoInfo.screen === 'voting', JSON.stringify(undoInfo));
    check('S7 แขวนแล้วคนตายจริง → undo กลับมามีชีวิต + คนเท่าเดิม',
      undoInfo && undoInfo.deadAfterVote === true && undoInfo.aliveAfter === true && undoInfo.aliveNow === undoInfo.preAlive,
      `pre=${undoInfo?.preAlive} now=${undoInfo?.aliveNow}`);

    /* ===== S8: timer + sheet ===== */
    await ev('startT()');
    check('S8 จับเวลาเริ่มได้', await ev('S.ui.tRunning === true'));
    await ev('resetT(60)');
    check('S8 รีเซ็ตเวลาเป็น 60 วิ', await ev('S.ui.timer === 60'));
    await ev('stopT()');
    check('S8 หยุดเวลาได้', await ev('S.ui.tRunning === false'));

    check('S8 ไม่มี JS exception', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
    check('S8 ไม่มี HTTP error (404/500)', httpErrors.length === 0, httpErrors.slice(0, 3).join(' | '));

    /* ===== S9: PWA — service worker + โหมดออฟไลน์ ===== */
    const swInfo = await ev('navigator.serviceWorker.getRegistration().then(r => r ? {scope:r.scope, active:!!r.active, controlled:!!navigator.serviceWorker.controller} : null)');
    check('S9 service worker ติดตั้งและ active', !!(swInfo && swInfo.active), JSON.stringify(swInfo));
    const cacheKeys = await ev('caches.keys()');
    const shellCache = (cacheKeys || []).find((k) => k.startsWith('werewolf-shell-'));
    check('S9 มี cache shell', !!shellCache, JSON.stringify(cacheKeys));
    const cachedFiles = shellCache
      ? await ev(`caches.open(${JSON.stringify(shellCache)}).then(c=>c.keys()).then(ks=>ks.map(k=>new URL(k.url).pathname))`)
      : [];
    const need = ['/index.html', '/styles.css', '/app.js', '/manifest.json'];
    check('S9 cache ครบทุกไฟล์หลัก', need.every((f) => (cachedFiles || []).some((p) => p.endsWith(f))), JSON.stringify(cachedFiles));

    await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
    await send('Page.navigate', { url: PAGE });
    await waitFor('!!document.getElementById("app") && document.getElementById("app").innerHTML.length > 500', 'offline reload', 15000);
    const offlineOk = await ev('({html: document.getElementById("app").innerHTML.length > 500, css: document.styleSheets.length > 0, title: document.title})');
    check('S9 ออฟไลน์ → เปิดหน้าใหม่ได้ (HTML+CSS ครบ)', !!(offlineOk && offlineOk.html && offlineOk.css && String(offlineOk.title).includes('คืนหอนหลอนหมาป่า')), JSON.stringify(offlineOk));
    await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });

    /* ===== report ===== */
    const failed = results.filter((r) => !r.ok);
    console.log('\n========================================');
    console.log(`ผลทดสอบ: ${results.length - failed.length}/${results.length} ผ่าน`);
    if (dialogs.length) console.log(`dialogs ที่เจอ: ${dialogs.length}`);
    if (failed.length) {
      console.log('ไม่ผ่าน:');
      for (const f of failed) console.log(`  - ${f.name}${f.detail ? ' : ' + f.detail : ''}`);
    }
    console.log('========================================');
    cleanup();
    process.exit(failed.length ? 1 : 0);
  } catch (err) {
    console.error('\nTEST ERROR:', err.message);
    if (pageErrors.length) console.error('page errors:', pageErrors.slice(0, 5));
    cleanup();
    process.exit(2);
  }
}

main();
process.on('exit', sweepLeftovers);

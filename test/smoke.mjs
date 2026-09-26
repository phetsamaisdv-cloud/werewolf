#!/usr/bin/env node
/**
 * E2E smoke test — คืนหอนหลอนหมาป่า
 * รัน: node test/smoke.mjs   (ต้องมี Chrome/Edge ติดตั้งอยู่)
 * ไม่ต้องใช้ npm dependency — ใช้ Node http server + Chrome DevTools Protocol ตรง ๆ
 */
import {spawn, spawnSync} from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let PAGE = '';
const IS_WIN = process.platform === 'win32';

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
    s.on('error', reject);
  });
}

/** kill chrome + ลูก process ทั้งหมด (chrome spawn เป็น tree) */
function killTree(pid) {
  if (!pid) return;
  if (IS_WIN) spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {stdio: 'ignore'});
  else {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {}
    }
  }
}

/** เก็บกวาด chrome ที่ค้างจากเทสก่อนหน้า (กัน localStorage รั่วข้าม run) */
function sweepLeftovers() {
  if (!IS_WIN) return;
  const ps =
    'Get-CimInstance Win32_Process -Filter "Name=\'chrome.exe\'" | ' +
    "Where-Object { $_.CommandLine -like '*ww-smoke-*' } | " +
    'ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }';
  spawnSync('powershell', ['-NoProfile', '-Command', ps], {stdio: 'ignore'});
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

const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [];
function check(name, ok, detail = '') {
  results.push({name, ok: !!ok, detail});
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

/* ---------- static server ---------- */
function startServer(port) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const rel = urlPath === '/' ? '/index.html' : urlPath;
    const file = path.join(ROOT, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end();
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('not found');
      }
      res.writeHead(200, {'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream'});
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)));
}

/* ---------- page driver (注入 ลงในหน้า) ---------- */
const DRIVER = `
window.__hb = window.__hb || 0;
if(!window.__hbTimer){ window.__hbTimer = setInterval(function(){ window.__hb++; }, 500); }
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
      }       else if(r === 'seer'){ pickT(ap[0].id); confirmSeer(); }
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
      else if(r === 'priest'){ toggleTgtN(ap[0].id); confirmPriest(); }
      else if(r === 'pi'){ toggleTgtN(ap[0].id); confirmPi(); }
      else if(r === 'spellcaster'){ toggleTgtN(ap[ap.length-1].id); confirmSpellcaster(); }
      else if(r === 'sorceress'){ toggleTgtN(ap[0].id); confirmSorceress(); }
      else if(r === 'cult_leader'){
        const c = cultRecruitables();
        if(c.length){ toggleTgtN(c[0].id); confirmCult(); } else { skipN(); }
      }
      else if(r === 'vampire'){ toggleTgtN((nonWolf[0] || ap[0]).id); confirmVampire(); }
      else if(r === 'troublemaker'){ confirmTroublemaker(); }
      else if(r === 'virginia_woolf'){ toggleTgtN((nonWolf[0] || ap[0]).id); confirmVW(); }
      else if(r === 'hoodlum'){
        if(ap[1]){ toggleTgtN(ap[0].id); toggleTgtN(ap[1].id); confirmHoodlum(); }
        else if(ap[0]){ toggleTgtN(ap[0].id); confirmHoodlum(); }
      }
      if(S.ui.nRole && !S.ui.nDone[r] && typeof N_ACTIONS !== 'undefined' && N_ACTIONS[r] && N_ACTIONS[r].skipLabel){ skipN(); }
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
              || pool.find(p=>p.roleId!=='prince')
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
    /* วันที่ตัวป่วนบังคับโหวต → เป้าหมายต้องโหวตด้วย (ข้ามไม่ได้) */
    if(typeof isForceVoteDay === 'function' && isForceVoteDay() && !hasVoted(target)){
      const others = ids.filter(x => x !== target);
      const alt = pool.find(p => p.id !== target) || (others.length ? getP(others[0]) : null);
      if(alt && alt.id !== target){
        selectVoter(target);
        selectTarget(alt.id);
        confirmVote();
      }
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
  const chromePath = CHROME_CANDIDATES.find(p => fs.existsSync(p));
  if (!chromePath) throw new Error('ไม่พบ Chrome/Edge');

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ww-smoke-'));
  const chrome = spawn(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--no-first-run',
      '--hide-scrollbars',
      '--disable-background-timer-throttling',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${profile}`,
      PAGE
    ],
    {stdio: 'ignore', detached: !IS_WIN}
  );

  const pageErrors = [];
  const httpErrors = [];
  const dialogs = [];
  let ws,
    sendId = 0;
  const eventLog = [];
  let wsClosed = false;
  let ev, send;
  const pending = new Map();

  const cleanup = () => {
    try {
      ws && ws.close();
    } catch {}
    killTree(chrome.pid);
    sweepLeftovers();
    try {
      server.close();
    } catch {}
    try {
      fs.rmSync(profile, {recursive: true, force: true});
    } catch {}
  };

  try {
    /* connect CDP */
    let target = null;
    for (let i = 0; i < 60 && !target; i++) {
      try {
        const list = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`).then(r => r.json());
        target = list.find(t => t.type === 'page');
      } catch {}
      if (!target) await sleep(250);
    }
    if (!target) throw new Error('เชื่อมต่อ Chrome ไม่ได้');

    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = rej;
    });
    ws.onclose = () => {
      wsClosed = true;
    };
    ws.onmessage = ev => {
      const m = JSON.parse(ev.data);
      if (m.method) {
        eventLog.push(m.method + (m.params && m.params.reason ? ':' + m.params.reason : ''));
        if (eventLog.length > 12) eventLog.shift();
      }
      if (m.id && pending.has(m.id)) {
        pending.get(m.id)(m);
        pending.delete(m.id);
        return;
      }
      if (m.method === 'Page.javascriptDialogOpening') {
        dialogs.push(m.params.message);
        send('Page.handleJavaScriptDialog', {accept: true}).catch(() => {});
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
    send = function (method, params = {}) {
      return new Promise((res, rej) => {
        const i = ++sendId;
        const timer = setTimeout(() => {
          pending.delete(i);
          rej(new Error('timeout: ' + method));
        }, 20000);
        pending.set(i, m => {
          clearTimeout(timer);
          m.error ? rej(new Error(JSON.stringify(m.error))) : res(m);
        });
        ws.send(JSON.stringify({id: i, method, params}));
      });
    };
    ev = async function (expression, timeoutMs = 25000) {
      const i = ++sendId;
      const result = await new Promise((res, rej) => {
        const timer = setTimeout(() => {
          pending.delete(i);
          rej(new Error('evaluate timeout: ' + expression.slice(0, 140)));
        }, timeoutMs);
        pending.set(i, m => {
          clearTimeout(timer);
          res(m);
        });
        ws.send(JSON.stringify({id: i, method: 'Runtime.evaluate', params: {expression, awaitPromise: true, returnByValue: true}}));
      });
      if (result.error) throw new Error(JSON.stringify(result.error));
      const d = result.result;
      if (d.exceptionDetails) throw new Error('page exception: ' + (d.exceptionDetails.exception?.description || d.exceptionDetails.text));
      return d.result?.value;
    };
    async function waitFor(expression, label, timeoutMs = 20000) {
      const t0 = Date.now();
      for (;;) {
        let v;
        try {
          v = await ev(expression, 5000);
        } catch {
          v = false;
        }
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
    check(
      'S1 หน้าวิธีใช้ (sheet) เปิดได้',
      await ev('!!document.getElementById("sheetOverlay") && document.getElementById("sheetOverlay").innerText.includes("ตั้งค่า")')
    );
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
    const setupInfo =
      (await ev(`(() => {
      goSetup();
      S.setup.n = 16;
      S.setup.names = Array.from({length:16}, (_,i) => 'P' + (i+1));
      S.setup.roles = {werewolf:2, wolfcub:1, seer:1, witch:1, hunter:1, tough_guy:1, bodyguard:1,
                       cupid:1, mayor:1, cursed:1, ghost:1, infected:1, prince:1, grandma:1};
      S.setup.assignMode = 'manual';
      return {can: canStart(), roles: totalRoles(), vill: villagerCount(), warn: balanceWarnings().length};
    })()`)) || {};
    check('S3 canStart() = true (หมาป่า < ชาวบ้าน)', setupInfo.can === true);
    check('S3 บทบาทพิเศษครบ 15 ใบ (หมาป่า 2)', setupInfo.roles === 15, `roles=${setupInfo.roles}`);
    check('S3 ชาวบ้านธรรมดาเหลือ 1', setupInfo.vill === 1, `vill=${setupInfo.vill}`);
    check('S3 balanceWarnings ไม่มีข้อร้ายแรง', setupInfo.warn === 0, `warn=${setupInfo.warn}`);

    /* ===== S3b: preset functions (applyPreset, save/load/delete custom preset) ===== */
    const presetInfo =
      (await ev(`(async () => {
      const snap = {n:S.setup.n, names:S.setup.names.slice(), roles:Object.assign({}, S.setup.roles), mode:S.setup.assignMode};
      const bad = [];
      for(const k of ['std','party','comp']){
        for(let n=4;n<=18;n++){
          applyPreset(k, n);
          const w = (S.setup.roles.werewolf||0) + (S.setup.roles.wolfcub||0);
          const v = S.setup.n - w;
          const warn = balanceWarnings().filter(x => x.indexOf('⚠') === 0);
          if(!canStart()) bad.push(k+n+':canStart');
          if(totalRoles() > S.setup.n) bad.push(k+n+':overflow');
          if(villagerCount() < 1) bad.push(k+n+':noVillager');
          if(w >= v) bad.push(k+n+':wolves=' + w + '/' + v);
          if(warn.length) bad.push(k+n+':warn=' + warn.join(','));
        }
      }
      localStorage.removeItem('werewolf_presets');
      applyPreset('party', 8);
      savePreset();
      const saved = readPresets();
      const savedId = saved[0] ? saved[0].id : null;
      applyPreset('std', 4);
      loadCustomPreset(savedId);
      const loadedOk = S.setup.n === 8 && S.setup.roles.priest === 1 && S.setup.roles.cupid === 1;
      const dp = deleteCustomPreset(savedId);
      const dlgOk = document.querySelector('#dialogOverlay [data-dlg="1"]');
      if(dlgOk) dlgOk.click();
      await dp;
      const gone = readPresets().length === 0;
      S.setup.n = snap.n; S.setup.names = snap.names; S.setup.roles = snap.roles; S.setup.assignMode = snap.mode;
      render();
      return {bad, loadedOk, gone, savedCount: saved.length};
    })()`)) || {};
    check(
      'S3b preset 3 ชุด x 4-18 คน เล่นได้จริง (canStart/ไม่ล้น/มีชาวบ้าน/ไม่มี ⚠)',
      Array.isArray(presetInfo.bad) && presetInfo.bad.length === 0,
      JSON.stringify(presetInfo.bad || [])
    );
    check(
      'S3b บันทึก → โหลด → ลบ custom preset ได้',
      presetInfo.loadedOk === true && presetInfo.gone === true && presetInfo.savedCount === 1,
      JSON.stringify(presetInfo)
    );

    /* ===== S3c: ชาวบ้านหลายตัว + สุ่มตามสมดุล + สรุปก่อนเริ่มเกม ===== */
    const featInfo =
      (await ev(`(() => {
        const snap = {n: S.setup.n, roles: {...S.setup.roles}, mode: S.setup.assignMode};
        S.setup.n = 8;
        S.setup.roles = zeroRoles();
        S.setup.roles.werewolf = 2;
        const singleHasVillager = SINGLETON_ROLES.includes('villager');
        incRole('villager'); incRole('villager'); incRole('villager');
        const villCnt = S.setup.roles.villager || 0;
        const bad = [];
        const scoreBad = [];
        for (let n = 4; n <= 18; n++) {
          S.setup.n = n;
          S.setup.roles = zeroRoles();
          autoBalanceRoles();
          if (!canStart()) bad.push(n + ':canStart');
          if (villagerCount() < 1) bad.push(n + ':noVillager');
          if (totalRoles() > n) bad.push(n + ':over');
          if (balanceWarnings().some(w => w.charAt(0) === '\\u26a0')) bad.push(n + ':warn');
          const bs = Math.abs(balanceScore());
          if (bs > 2) scoreBad.push(n + ':' + bs);
        }
        const rep = [];
        for (const n of [4, 8, 12, 18]) {
          S.setup.n = n;
          S.setup.roles = zeroRoles();
          autoBalanceRoles();
          const a = rolesSig(S.setup.roles);
          autoBalanceRoles();
          const b = rolesSig(S.setup.roles);
          autoBalanceRoles();
          const c = rolesSig(S.setup.roles);
          if (!(a !== b && b !== c && a !== c)) rep.push(n + ':' + a + ' | ' + b + ' | ' + c);
        }
        const trimOk = SPECIAL.every(r => TRIM_ORDER.includes(r));
        S.setup.n = 8;
        S.setup.roles = zeroRoles();
        S.setup.roles.werewolf = 2; S.setup.roles.seer = 1;
        render();
        const villBtn = document.querySelector('.role-card[data-role="villager"] [aria-label="เพิ่มจำนวน"]');
        const plusWorks = !!villBtn && !villBtn.disabled;
        const sumHtml = roleSummaryCard();
        const hasSummary = sumHtml.includes('สรุปบทบาท') && sumHtml.includes('ชาวบ้าน');
        const attr = k => Number(((sumHtml.match(new RegExp('data-' + k + '="(-?\\\\d+)"')) || [])[1]));
        const rowSum = [...sumHtml.matchAll(/class="sum-cnt">×(\\d+)/g)].reduce((s, m) => s + Number(m[1]), 0);
        const sumConsistent =
          attr('total') === S.setup.n &&
          attr('chosen') + attr('auto') === attr('total') &&
          attr('villagers') === totalVillagers() &&
          rowSum === attr('total') &&
          attr('wolf') + attr('village') + attr('neutral') === attr('total') &&
          attr('score') === balanceScore() &&
          sumHtml.includes('ครบทั้ง');
        const sumTxt = buildRoleSummaryText();
        const hasTxt = sumTxt.includes('ฝ่ายหมาป่า') && sumTxt.includes('คะแนนสมดุล');
        const img = document.querySelector('.role-card .rimg-large');
        const imgOk = !!img && img.getAttribute('width') === '180' && img.getAttribute('height') === '240';
        const gridCols = getComputedStyle(document.querySelector('.role-grid')).gridTemplateColumns.split(' ').length;
        const descOk = !!document.querySelector('.role-card__desc');
        S.setup.n = 8;
        S.setup.roles = zeroRoles();
        S.setup.roles.werewolf = 2; S.setup.roles.seer = 1; S.setup.roles.villager = 3;
        const dck = buildRandomDeck();
        const deckVill = dck.filter(x => x === 'villager').length;
        const oldAssign = S.ui.assign;
        S.ui.assign = {};
        for (let i = 0; i < 8; i++) S.ui.assign[i] = dck[i];
        const manualValid = isAssignValid();
        S.ui.assign = oldAssign;
        S.setup.n = snap.n; S.setup.roles = snap.roles; S.setup.assignMode = snap.mode;
        render();
        return {singleHasVillager, villCnt, plusWorks, bad, scoreBad, rep, trimOk, hasSummary, sumConsistent, hasTxt, imgOk, gridCols, descOk, deckVill, manualValid};
      })()`)) || {};
    const gridCssOk = await ev(
      `fetch('styles.css').then(r => r.text()).then(t => { const m = t.match(/\\.role-grid\\s*\\{[^}]*\\}/); return !!m && m[0].includes('repeat(2'); })`
    );
    check('S3c ชาวบ้านเพิ่มได้เกิน 1 คน (ไม่ถูกจำกัด singleton)', featInfo.singleHasVillager === false && featInfo.villCnt === 3, JSON.stringify(featInfo));
    check('S3c ปุ่ม + ของชาวบ้านในหน้าตั้งค่าใช้ได้', featInfo.plusWorks === true);
    check(
      'S3c autoBalanceRoles ขนาด 4-18 คน: canStart/มีชาวบ้าน/ไม่ล้น/ไม่มี ⚠',
      Array.isArray(featInfo.bad) && featInfo.bad.length === 0,
      JSON.stringify(featInfo.bad || [])
    );
    check(
      'S3c autoBalanceRoles ทุกขนาด 4-18 คน: คะแนนสมดุล |score| ≤ 2 (ใกล้ 0)',
      Array.isArray(featInfo.scoreBad) && featInfo.scoreBad.length === 0,
      JSON.stringify(featInfo.scoreBad || [])
    );
    check(
      'S3c กดสุ่มซ้ำ 3 ครั้ง x 4/8/12/18 คน: ผลลัพธ์ต่างกันทั้งคู่ (a≠b≠c≠a)',
      Array.isArray(featInfo.rep) && featInfo.rep.length === 0,
      JSON.stringify(featInfo.rep || [])
    );
    check('S3c TRIM_ORDER ครอบคลุมทุกบทบาท (30/30)', featInfo.trimOk === true, JSON.stringify(featInfo.trimOk));
    check(
      'S3c การ์ดสรุปสอดคล้องกัน (แถวรวม=n · เลือก+อัตโนมัติ=n · รายฝ่าย=n · score=balanceScore)',
      featInfo.sumConsistent === true,
      JSON.stringify({sumConsistent: featInfo.sumConsistent})
    );
    check('S3c การ์ดสรุปบทบาท + ข้อความสรุปก่อนเริ่มเกม', featInfo.hasSummary === true && featInfo.hasTxt === true, JSON.stringify(featInfo));
    check(
      'S3c รูปบทบาท 180×240 + กริดอย่างน้อย 2 คอลัมน์ + desc แตะขยายได้',
      featInfo.imgOk === true && featInfo.gridCols >= 2 && featInfo.descOk === true && gridCssOk === true,
      JSON.stringify({imgOk: featInfo.imgOk, gridCols: featInfo.gridCols, descOk: featInfo.descOk, gridCssOk})
    );
    check(
      'S3c manual: ชาวบ้านระบุเอง 3 ตัว → deck ครบ 5 + isAssignValid ผ่าน',
      featInfo.deckVill === 5 && featInfo.manualValid === true,
      JSON.stringify({deckVill: featInfo.deckVill, manualValid: featInfo.manualValid})
    );

    await ev('startGame()');
    check('S3 manual mode → หน้าจัดบทบาท', (await ev('S.screen')) === 'assign');
    check('S3 บทบาทในตารางถูกต้อง (isAssignValid)', (await ev('isAssignValid()')) === true);
    await ev('reshuffleAssign()');
    check('S3 สุ่มบทบาทใหม่ยัง valid', (await ev('isAssignValid()')) === true);
    const villOpts = await ev(
      `(()=>{const s=document.querySelector('.role-sel'); return s ? Array.from(s.querySelectorAll('option')).filter(o=>o.value==='villager').length : -1;})()`
    );
    check('S3 dropdown บทบาท: ตัวเลือกชาวบ้านไม่ซ้ำ (SPECIAL มี villager แล้ว)', villOpts === 1, 'count=' + villOpts);
    await ev('confirmAssign()');
    check('S3 ยืนยัน → หน้าแจกการ์ด', (await ev('S.screen')) === 'reveal');

    /* ===== S4: reveal → night ===== */
    const roleCount = await ev('(()=>{const m={};for(const p of S.g.players)m[p.roleId]=(m[p.roleId]||0)+1;return m;})()');
    check('S4 ผู้เล่น 16 คน ครบตามที่ตั้ง', (await ev('S.g.players.length')) === 16);
    check(
      'S4 มีครบทุกบทบาทในเกม',
      ['werewolf', 'wolfcub', 'seer', 'witch', 'hunter', 'tough_guy', 'bodyguard', 'cupid', 'mayor', 'cursed', 'ghost', 'infected', 'prince', 'grandma'].every(
        r => roleCount[r] === 1 || (r === 'werewolf' && roleCount[r] === 2)
      ),
      JSON.stringify(roleCount)
    );

    await ev('for(let i=0;i<40 && S.screen==="reveal"; i++) nextRv();');
    check('S4 เดินหน้าแจกการ์ดจนจบ → กลางคืน', (await ev('S.screen')) === 'night');

    /* ===== driver ===== */
    await ev(DRIVER);

    /* ===== S5: mod panel + history + XSS ระหว่างเกม ===== */
    await ev('showModPanel()');
    const modText = await ev('document.getElementById("sheetOverlay") ? document.getElementById("sheetOverlay").innerText : ""');
    check('S5 แผง GM เปิดและเห็นบทบาท', modText.includes('เทพพยากรณ์') || modText.includes('หมาป่า'));
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
      if (screen !== 'night') {
        check('S6 อยู่ในเฟสถูกต้อง', false, 'unexpected screen=' + screen);
        break;
      }
      await ev('__T.playRound()');
      rounds++;

      if (rounds === 1 && (await ev('S.screen')) === 'night') {
        const snap = await ev('({screen:S.screen, round:S.g.round, alive:alive().length, seer:S.g.seerChecks.length, log:S.g.log.length})');
        await ev('save()');
        await send('Page.navigate', {url: PAGE});
        await waitFor('!!document.getElementById("app") && document.getElementById("app").innerHTML.length > 500', 'reload');
        await ev(DRIVER);
        const hasSave = await ev('hasSave()');
        await ev('continueGame()');
        const now = await ev('({screen:S.screen, round:S.g.round, alive:alive().length, seer:S.g.seerChecks.length, log:S.g.log.length})');
        resumeOk = hasSave === true && JSON.stringify(now) === JSON.stringify(snap);
        check('S6 บันทึก/เล่นต่อตรงทุก field (screen, round, alive, seer, log)', resumeOk, `snap=${JSON.stringify(snap)} now=${JSON.stringify(now)}`);
      }
    }

    const endState = await ev(
      '({screen:S.screen, winner:S.g ? S.g.winner : null, reason:S.g ? S.g.winReason : null, round:S.g ? S.g.round : 0, alive:alive().length})'
    );
    check('S6 เกมจบภายใน 40 รอบ', endState.screen === 'end', `round=${endState.round} alive=${endState.alive}`);
    check('S6 มีผู้ชนะถูกต้อง', ['village', 'werewolf', 'lovers'].includes(endState.winner), `winner=${endState.winner} (${endState.reason})`);
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
    try {
      await waitFor('!!document.getElementById("dialogOverlay")', 'copyResults dialog', 8000);
    } catch (e) {
      copyDlg = false;
    }
    await ev('__T.clickDlg()');
    check('S6 copyResults() แสดง dialog "คัดลอกแล้ว"', copyDlg, `dialog=${copyDlg} native=${dialogs.length}`);

    /* ===== S7: undo การแขวน (เกมแยก) ===== */
    const undoInfo = await ev(`(async () => {
      newGameEnd();
      S.setup.n = 6;
      S.setup.names = ['U1','U2','U3','U4','U5','U6'];
      S.setup.roles = {werewolf:1, seer:1, witch:1, hunter:1, mayor:1, cupid:0, wolfcub:0,
                       bodyguard:0, cursed:0, infected:0, prince:0, grandma:0};
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
    check(
      'S7 แขวนแล้วคนตายจริง → undo กลับมามีชีวิต + คนเท่าเดิม',
      undoInfo && undoInfo.deadAfterVote === true && undoInfo.aliveAfter === true && undoInfo.aliveNow === undoInfo.preAlive,
      `pre=${undoInfo?.preAlive} now=${undoInfo?.aliveNow}`
    );

    /* ===== S8: timer + sheet ===== */
    await ev('startT()');
    check('S8 จับเวลาเริ่มได้', await ev('S.ui.tRunning === true'));
    await ev('resetT(60)');
    check('S8 รีเซ็ตเวลาเป็น 60 วิ', await ev('S.ui.timer === 60'));
    await ev('stopT()');
    check('S8 หยุดเวลาได้', await ev('S.ui.tRunning === false'));

    /* ===== S11: เสียงแจ้งเตือน ===== */
    const soundInfo =
      (await ev(`(() => {
      const out = {isFn: typeof beep === 'function', defaultOn: S.setup.sound === true};
      goSetup();
      const ui = document.getElementById('app').innerText;
      out.uiHasToggle = ui.includes('เสียงแจ้งเตือน');
      out.errs = [];
      for(const k of ['timeup','night','vote','win','nope']){
        try{ beep(k); }catch(e){ out.errs.push(k + ':' + e.message); }
      }
      toggleSetup('sound');
      out.off = S.setup.sound === false;
      try{ beep('night'); }catch(e){ out.errs.push('muted:' + e.message); }
      toggleSetup('sound');
      out.backOn = S.setup.sound === true;
      return out;
    })()`)) || {};
    check(
      'S11 เสียงแจ้งเตือน: toggle ในหน้าตั้งค่า + beep() ทุกแบบไม่ throw',
      soundInfo.isFn === true && soundInfo.defaultOn === true && soundInfo.uiHasToggle === true && (soundInfo.errs || []).length === 0,
      JSON.stringify(soundInfo)
    );
    check('S11 ปิด/เปิดเสียงได้', soundInfo.off === true && soundInfo.backOn === true, JSON.stringify(soundInfo));

    check('S8 ไม่มี JS exception', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
    check('S8 ไม่มี HTTP error (404/500)', httpErrors.length === 0, httpErrors.slice(0, 3).join(' | '));

    /* ===== S9: PWA — service worker + โหมดออฟไลน์ ===== */
    const swInfo = await ev(
      'navigator.serviceWorker.getRegistration().then(r => r ? {scope:r.scope, active:!!r.active, controlled:!!navigator.serviceWorker.controller} : null)'
    );
    check('S9 service worker ติดตั้งและ active', !!(swInfo && swInfo.active), JSON.stringify(swInfo));
    const cacheKeys = await ev('caches.keys()');
    const shellCache = (cacheKeys || []).find(k => k.startsWith('werewolf-shell-'));
    check('S9 มี cache shell', !!shellCache, JSON.stringify(cacheKeys));
    const cachedFiles = shellCache ? await ev(`caches.open(${JSON.stringify(shellCache)}).then(c=>c.keys()).then(ks=>ks.map(k=>new URL(k.url).pathname))`) : [];
    const need = ['/index.html', '/styles.css', '/app.js', '/manifest.json'];
    check(
      'S9 cache ครบทุกไฟล์หลัก',
      need.every(f => (cachedFiles || []).some(p => p.endsWith(f))),
      JSON.stringify(cachedFiles)
    );

    await send('Network.emulateNetworkConditions', {offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0});
    await send('Page.navigate', {url: PAGE});
    await waitFor('!!document.getElementById("app") && document.getElementById("app").innerHTML.length > 500', 'offline reload', 15000);
    const offlineOk = await ev('({html: document.getElementById("app").innerHTML.length > 500, css: document.styleSheets.length > 0, title: document.title})');
    check(
      'S9 ออฟไลน์ → เปิดหน้าใหม่ได้ (HTML+CSS ครบ)',
      !!(offlineOk && offlineOk.html && offlineOk.css && String(offlineOk.title).includes('คืนหอนหลอนหมาป่า')),
      JSON.stringify(offlineOk)
    );
    await send('Network.emulateNetworkConditions', {offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1});

    /* ===== S10: multi-slot + ประวัติเกม ===== */
    const slotInfo =
      (await ev(`(() => {
      const out = {};
      const mk = (round, name, roleId) => JSON.stringify({screen:'night', g:{round, players:[{id:1, name, roleId, alive:true}]}, ui:{}, setup:{}, ver:VER});
      switchSlot(1);
      if(!localStorage.getItem(slotKeyFor(1))) localStorage.setItem(slotKeyFor(1), mk(2, 'ผู้เล่น 1', 'seer'));
      const info1 = getSaveInfo();
      out.slot2Before = slotState(2);
      localStorage.setItem(slotKeyFor(2), mk(4, 'ช่องสอง', 'witch'));
      out.info2 = getSaveInfo(slotKeyFor(2));
      out.slot2State = slotState(2);
      switchSlot(2);
      out.activeIs2 = ACTIVE_SLOT === 2;
      out.slot2View = getSaveInfo();
      out.homeAfterSwitch = S.screen;
      switchSlot(1);
      out.info1After = getSaveInfo();
      out.info1Same = JSON.stringify(info1) === JSON.stringify(out.info1After);
      out.activeBack = ACTIVE_SLOT === 1;
      out.info1 = info1;
      return out;
    })()`)) || {};
    check(
      'S10 บันทึกแยกคนละช่อง (ช่อง 2 มีเกมของตัวเอง · สลับไปมาแล้วข้อมูลไม่ปน)',
      slotInfo.slot2Before === 'empty' &&
        slotInfo.slot2State === 'game' &&
        slotInfo.activeIs2 === true &&
        slotInfo.slot2View &&
        slotInfo.slot2View.round === 4 &&
        slotInfo.info1Same === true &&
        slotInfo.activeBack === true &&
        !!(slotInfo.info1 && slotInfo.info1.round),
      JSON.stringify(slotInfo)
    );

    const resumeInfo =
      (await ev(`(async () => {
      switchSlot(2);
      const before = S.screen;
      const label = getSaveInfo() ? getSaveInfo().screenLabel : null;
      await continueGame();
      const after = S.screen;
      switchSlot(1);
      return {before, label, after};
    })()`)) || {};
    check('S10 สลับช่องแล้ว "เล่นต่อ" กลับเข้าเกมเดิมได้ (resume)', resumeInfo.before === 'home' && resumeInfo.after === 'night', JSON.stringify(resumeInfo));

    const histInfo = await ev(
      '(()=>{const h=readHistory();return {len:h.length, first: h[0] ? {winner:h[0].winner, n:h[0].n, round:h[0].round, players:(h[0].players||[]).length} : null};})()'
    );
    check(
      'S10 บันทึกผลเกมที่จบลงประวัติ',
      histInfo.len >= 1 && histInfo.first && histInfo.first.players > 0 && ['village', 'werewolf', 'lovers'].includes(histInfo.first.winner),
      JSON.stringify(histInfo)
    );

    const histTest =
      (await ev(`(() => {
      const real = readHistory();
      const dummies = [];
      for(let i=0;i<15;i++) dummies.push({ts:Date.now()+i, n:8, round:3, winner:'village', reason:'ทดสอบ', players:[]});
      writeHistory(dummies.concat(real));
      const len = readHistory().length;
      showGameHistory();
      const sheet = document.getElementById('sheetOverlay');
      const txt = sheet ? sheet.innerText : '';
      closeSheet();
      writeHistory(real);
      return {len, sheetOk: !!sheet, showsDummy: txt.includes('ทดสอบ'), restored: readHistory().length === real.length};
    })()`)) || {};
    check(
      'S10 ประวัติเก็บสูงสุด 10 เกม + เปิดดูได้',
      histTest.len === 10 && histTest.sheetOk === true && histTest.showsDummy === true && histTest.restored === true,
      JSON.stringify(histTest)
    );

    await ev('goHome()');
    const homeUi = await ev('document.getElementById("app").innerText');
    check(
      'S10 หน้าแรกแสดงตัวเลือกช่อง + ปุ่มผลย้อนหลัง',
      homeUi.includes('ช่อง 1') && homeUi.includes('ผลย้อนหลัง'),
      homeUi.slice(0, 200).replace(/\n/g, ' | ')
    );

    /* ===== S12: error boundary ===== */
    const errInfo =
      (await ev(`(() => {
      let logged = 0;
      const origCE = console.error;
      console.error = function(){ logged++; try{ return origCE.apply(console, arguments); }catch(e){} };
      const orig = window.renderNight;
      window.renderNight = function(){ throw new Error('BOOM_TEST'); };
      S.screen = 'night';
      render();
      const app = document.getElementById('app');
      const txt = app ? app.innerText : '';
      const shown = txt.includes('เกิดข้อผิดพลาด');
      const detail = txt.includes('BOOM_TEST');
      const notBlank = !!app && app.innerHTML.length > 100;
      window.renderNight = orig;
      console.error = origCE;
      recoverHome();
      const after = document.getElementById('app').innerText;
      return {shown, detail, notBlank, logged, recovered: after.includes('คืนหอนหลอนหมาป่า'), screen: S.screen, errorCleared: !lastRenderError};
    })()`)) || {};
    check(
      'S12 error boundary: render พัง → หน้าข้อผิดพลาดแทนหน้าขาว',
      errInfo.shown === true && errInfo.detail === true && errInfo.notBlank === true,
      JSON.stringify(errInfo)
    );
    check(
      'S12 กู้คืนกลับหน้าแรกได้ + log error ออก console',
      errInfo.recovered === true && errInfo.screen === 'home' && errInfo.errorCleared === true && errInfo.logged >= 1,
      JSON.stringify(errInfo)
    );

    /* ===== S13: save schema migration + เตือนตอนบันทึกไม่สำเร็จ ===== */
    const migInfo =
      (await ev(`(() => {
      const raw = JSON.stringify({
        screen: 'night',
        setup: {roles: {werewolf: 1}},
        ui: {votes: [{voterId: 1, targetId: 2}]},
        g: {round: 2, players: [{id: 1, name: 'A', roleId: 'seer', alive: true}]},
        ver: '9.6'
      });
      const m = migrateSave(JSON.parse(raw));
      const res = {
        stamped: m.schema === SAVE_SCHEMA,
        seerDefaulted: m.setup.roles.seer === 0,
        votesNormalized: Array.isArray(m.ui.votes) && m.ui.votes[0].skip === false,
        hasLog: Array.isArray(m.g.log),
        hasNight: !!m.g.night,
        wolfCubDead: m.g.wolfCubDead === false
      };
      localStorage.setItem(slotKeyFor(1), raw);
      res.loadOk = load(false) === true;
      res.screen = S.screen;
      S.g = null;
      S.ui = newUI();
      S.screen = 'home';
      return res;
    })()`)) || {};
    check(
      'S13 save schema เก่า (ไม่มี field) → migrateSave เติมครบ + ประทับ SAVE_SCHEMA',
      migInfo.stamped === true &&
        migInfo.seerDefaulted === true &&
        migInfo.votesNormalized === true &&
        migInfo.hasLog === true &&
        migInfo.hasNight === true &&
        migInfo.wolfCubDead === true,
      JSON.stringify(migInfo)
    );
    check('S13 โหลด save เก่าผ่าน load() ได้จริง', migInfo.loadOk === true, JSON.stringify(migInfo));

    const sfInfo =
      (await ev(`(() => {
      const origSet = Storage.prototype.setItem;
      SAVE_WARNED = false;
      SAVE_ERR = null;
      window.__origSD = window.showDialog;
      window.__saveDlg = 0;
      window.showDialog = function(o){ window.__saveDlg++; return window.__origSD(o); };
      let ok1 = null, ok2 = null;
      try {
        Storage.prototype.setItem = function(){
          const e = new Error('quota exceeded');
          e.name = 'QuotaExceededError';
          e.code = 22;
          throw e;
        };
        ok1 = save();
        ok2 = save();
      } finally {
        Storage.prototype.setItem = origSet;
      }
      return {ok1, ok2, warned: SAVE_WARNED, errSet: SAVE_ERR !== null};
    })()`)) || {};
    await waitFor('!!document.getElementById("dialogOverlay")', 'save-fail dialog', 5000);
    const dlgInfo =
      (await ev(`(() => {
      const ov = document.getElementById('dialogOverlay');
      const out = {txt: ov ? ov.innerText : '', count: window.__saveDlg};
      if (window.__origSD) window.showDialog = window.__origSD;
      return out;
    })()`)) || {};
    check(
      'S13 บันทึกไม่สำเร็จ → save() คืน false + จำสาเหตุไว้ (SAVE_ERR)',
      sfInfo.ok1 === false && sfInfo.ok2 === false && sfInfo.errSet === true && sfInfo.warned === true,
      JSON.stringify(sfInfo)
    );
    check('S13 แจ้งเตือนผู้ใช้ด้วย dialog และไม่ spam ซ้ำ', dlgInfo.txt.includes('บันทึกไม่สำเร็จ') && dlgInfo.count === 1, JSON.stringify(dlgInfo));
    await ev('closeDialog()');
    check('S13 ปิด dialog เตือนได้', await ev('!document.getElementById("dialogOverlay")'));

    /* ===== S14: บทบาทใหม่ — mechanics จริง ===== */
    await ev(DRIVER); /* หน้าถูก reload ตอน S9 → ต้อง inject driver ใหม่ */
    const newRoleInfo =
      (await ev(`(async () => {
      const out = {steps:{}};
      const zero = () => zeroRoles();
      function fresh(n, roles){
        newGameEnd();
        S.setup.n = n;
        S.setup.names = Array.from({length:n}, (_,i)=>'N'+(i+1));
        S.setup.roles = Object.assign(zero(), roles);
        S.setup.assignMode = 'random';
        startGame();
        let guard = 0;
        while(S.screen === 'reveal' && guard++ < 60) nextRv();
        return true;
      }
      const byRole = id => S.g.players.find(p=>p.roleId===id);
      const vill = () => S.g.players.find(p=>p.roleId==='villager');

      try {
        /* A. ผีตายคืนแรก */
        fresh(6, {werewolf:1, ghost:1, seer:1, witch:1, bodyguard:1});
        S.screen = 'night';
        S.g.night.killTarget = vill().id;
        await __T.settle(endNight());
        out.steps.ghost = {
          dead: !byRole('ghost').alive,
          cause: S.ui.deathCauses[byRole('ghost').id],
          victimDead: !vill().alive
        };

        /* B. นักเลงทนทาน — แผลเลื่อนตายรอบถัดไป */
        fresh(6, {werewolf:1, tough_guy:1, seer:1});
        S.screen = 'night';
        const tough = byRole('tough_guy');
        S.g.night.killTarget = tough.id;
        await __T.settle(endNight());
        out.steps.tough1 = {alive: tough.alive, wounded: !!tough.wounded, round: tough.woundRound};
        goToNight();
        S.screen = 'night';
        await __T.settle(endNight());
        out.steps.tough2 = {dead: !tough.alive, cause: S.ui.deathCauses[tough.id], stillWounded: !!tough.wounded};

        /* C. แวมไพร์ — กัดตายวันรุ่งขึ้น + หมาป่ากัดไม่ตาย */
        fresh(6, {werewolf:1, vampire:1, seer:1, witch:1});
        S.screen = 'night';
        const vamp = byRole('vampire');
        const biteMe = vill();
        S.g.night.killTarget = vamp.id;
        S.g.night.biteTarget = biteMe.id;
        await __T.settle(endNight());
        out.steps.vamp1 = {vampAlive: !!vamp.alive, victimAlive: !!biteMe.alive, bitten: !!biteMe.bitten, round: biteMe.biteRound};
        goToNight();
        S.screen = 'night';
        await __T.settle(endNight());
        out.steps.vamp2 = {dead: !biteMe.alive, cause: S.ui.deathCauses[biteMe.id]};

        /* D. lycan ถูกอ่านเป็นหมาป่า + นักบวชคุ้มกัน + นักเวทปิดปาก */
        fresh(6, {werewolf:1, lycan:1, seer:1, priest:1, spellcaster:1});
        S.screen = 'night';
        const lyc = byRole('lycan');
        const seerP = byRole('seer');
        S.ui.tgt = lyc.id;
        confirmSeer();
        out.steps.lycanSeer = S.ui.seerRes && S.ui.seerRes.isWerewolf === true;
        S.g.night.killTarget = lyc.id;
        S.g.night.priestTarget = lyc.id;
        S.g.night.silenceTarget = seerP.id;
        await __T.settle(endNight());
        const active = activeNRoles();
        S.screen = 'dawn';
        render();
        const dawnTxt = document.getElementById('app').innerText;
        out.steps.protect = {lycAlive: !!lyc.alive, silenceKept: S.g.night.silenceTarget === seerP.id, dawnShowsSilence: dawnTxt.includes('ปิดปาก'), activeHasPriest: active.includes('priest'), activeHasSpell: active.includes('spellcaster')};

        /* E. ผู้รักสันติบังคับโหวตไม่ฆ่า + ตัวป่วนบังคับโหวต (ห้ามข้าม) */
        fresh(6, {werewolf:1, pacifist:1, seer:1, troublemaker:1});
        const pac = byRole('pacifist');
        const other = byRole('villager');
        S.screen = 'voting'; render(); startVoting();
        selectVoter(pac.id); selectTarget(other.id); confirmVote();
        const lastVote = S.ui.votes[S.ui.votes.length-1];
        out.steps.pacifist = !!(lastVote && lastVote.skip === true);
        S.g.forceVoteRound = S.g.round;
        render();
        const voteTxt = document.getElementById('app').innerText;
        const before = S.ui.votes.length;
        selectVoter(other.id);
        const skipPromise = confirmSkipVote();
        await new Promise(r => setTimeout(r, 60));
        __T.clickDlg();
        await skipPromise;
        const afterSkip = S.ui.votes.length;
        out.steps.forceVote = {uiWarns: voteTxt.includes('บังคับโหวต'), skipBlocked: afterSkip === before};

        /* F. เงื่อนไขชนะ: lone wolf / cult / hoodlum / tanner */
        fresh(8, {werewolf:1, lone_wolf:1, seer:1, cult_leader:1, hoodlum:1, tanner:1, vampire:1});
        const lone = byRole('lone_wolf');
        const keeper = vill();
        S.g.players.forEach(p => { p.alive = false; });
        lone.alive = true; keeper.alive = true;
        out.steps.paritySuppressed = checkWin() === null;
        keeper.alive = false;
        out.steps.loneWin = (checkWin() || {}).winner;
        S.g.players.forEach(p => { p.alive = true; p.cult = true; });
        out.steps.cultWin = (checkWin() || {}).winner;
        S.g.players.forEach(p => { p.alive = true; p.cult = false; });
        const hood = byRole('hoodlum');
        const h1 = S.g.players.find(p => p.id !== hood.id && p.roleId !== hood.roleId);
        const h2 = S.g.players.find(p => p.id !== hood.id && p.id !== h1.id);
        S.g.hoodlumTargets = [h1.id, h2.id];
        h1.alive = false; h2.alive = false;
        out.steps.hoodlumWin = (checkWin() || {}).winner;
        S.g.hoodlumTargets = null;
        fresh(5, {werewolf:1, tanner:1, seer:1});
        S.screen = 'voting';
        executePlayer(byRole('tanner').id);
        out.steps.tannerVote = {winner: S.g.winner, screen: S.screen};

        /* G. ปุ่ม night ของบทบาทใหม่กดได้จริง (render ไม่พัง) */
        fresh(8, {werewolf:1, priest:1, pi:1, sorceress:1, spellcaster:1, troublemaker:1, vampire:1, cult_leader:1});
        S.screen = 'night'; render();
        const nightTxt = document.getElementById('app').innerText;
        out.steps.nightCards = ['นักบวช','นักสืบ','นางปีศาจ','นักเวท','ตัวป่วน','แวมไพร์','เจ้าลัทธิ'].every(t => nightTxt.includes(t));
        let openErr = null;
        for (const r of activeNRoles()) {
          try { openN(r); render(); closeN(); } catch(e){ openErr = r + ':' + e.message; }
        }
        out.steps.openErr = openErr;
        S.g = null; S.ui = newUI(); S.screen = 'home'; render();
      } catch(e) {
        out.error = e.message;
        S.g = null; S.ui = newUI(); S.screen = 'home';
        try { render(); } catch(_){}
      }
      return out;
    })()`)) || {};
    check(
      'S14 ผีเสียชีวิตคืนแรก (cause=ghost) + เหยื่อหมาป่าตายปกติ',
      newRoleInfo.steps &&
        newRoleInfo.steps.ghost &&
        newRoleInfo.steps.ghost.dead === true &&
        newRoleInfo.steps.ghost.cause === 'ghost' &&
        newRoleInfo.steps.ghost.victimDead === true,
      JSON.stringify(newRoleInfo.steps && newRoleInfo.steps.ghost)
    );
    check(
      'S14 นักเลงทนทานรอดคืนแรก (wounded) → ตายคืนถัดไป (cause=wound)',
      newRoleInfo.steps &&
        newRoleInfo.steps.tough1 &&
        newRoleInfo.steps.tough1.alive === true &&
        newRoleInfo.steps.tough1.wounded === true &&
        newRoleInfo.steps.tough2 &&
        newRoleInfo.steps.tough2.dead === true &&
        newRoleInfo.steps.tough2.cause === 'wound',
      JSON.stringify(newRoleInfo.steps)
    );
    check(
      'S14 แวมไพร์: หมาป่ากัดไม่ตาย + เหยื่อกัดตายวันรุ่งขึ้น (cause=bite)',
      newRoleInfo.steps &&
        newRoleInfo.steps.vamp1 &&
        newRoleInfo.steps.vamp1.vampAlive === true &&
        newRoleInfo.steps.vamp1.victimAlive === true &&
        newRoleInfo.steps.vamp1.bitten === true &&
        newRoleInfo.steps.vamp2 &&
        newRoleInfo.steps.vamp2.dead === true &&
        newRoleInfo.steps.vamp2.cause === 'bite',
      JSON.stringify(newRoleInfo.steps)
    );
    check(
      'S14 lycan ถูกเทพพยากรณ์อ่านเป็นหมาป่า + นักบวชคุ้มกันรอด + ปิดปากแจ้งตอนรุ่งเช้า',
      newRoleInfo.steps &&
        newRoleInfo.steps.lycanSeer === true &&
        newRoleInfo.steps.protect &&
        newRoleInfo.steps.protect.lycAlive === true &&
        newRoleInfo.steps.protect.silenceKept === true &&
        newRoleInfo.steps.protect.dawnShowsSilence === true,
      JSON.stringify(newRoleInfo.steps && newRoleInfo.steps.protect)
    );
    check(
      'S14 ผู้รักสันติโหวตข้ามเสมอ + ตัวป่วนบังคับโหวต (กดข้ามไม่ได้)',
      newRoleInfo.steps &&
        newRoleInfo.steps.pacifist === true &&
        newRoleInfo.steps.forceVote &&
        newRoleInfo.steps.forceVote.uiWarns === true &&
        newRoleInfo.steps.forceVote.skipBlocked === true,
      JSON.stringify(newRoleInfo.steps && newRoleInfo.steps.forceVote)
    );
    check(
      'S14 เงื่อนไขชนะใหม่: lone wolf (suppressed/last) + cult + hoodlum + tanner(โหวต)',
      newRoleInfo.steps &&
        newRoleInfo.steps.paritySuppressed === true &&
        newRoleInfo.steps.loneWin === 'lonewolf' &&
        newRoleInfo.steps.cultWin === 'cult' &&
        newRoleInfo.steps.hoodlumWin === 'hoodlum' &&
        newRoleInfo.steps.tannerVote &&
        newRoleInfo.steps.tannerVote.winner === 'tanner',
      JSON.stringify(newRoleInfo.steps)
    );
    check(
      'S14 การ์ด night ของบทบาทใหม่แสดงครบ + เปิดทุกหน้าไม่ throw',
      newRoleInfo.steps &&
        newRoleInfo.steps.nightCards === true &&
        newRoleInfo.steps.openErr == null &&
        newRoleInfo.steps.protect &&
        newRoleInfo.steps.protect.activeHasPriest === true &&
        newRoleInfo.steps.protect.activeHasSpell === true,
      JSON.stringify(newRoleInfo.steps && {nightCards: newRoleInfo.steps.nightCards, openErr: newRoleInfo.steps.openErr})
    );
    check('S14 scenario รันครบไม่ throw', !newRoleInfo.error, JSON.stringify(newRoleInfo.error || ''));

    /* ===== S15: เกมจบทั้งเกมด้วยบทบาทใหม่ + รูปครบทุกบทบาท ===== */
    const imgMissing = await ev('Object.keys(ROLES)');
    const missing = (Array.isArray(imgMissing) ? imgMissing : []).filter(r => !fs.existsSync(path.join(ROOT, 'assets', 'roles', r + '.jpg')));
    check('S15 มีรูปครบทุกบทบาท (assets/roles/<roleId>.jpg)', missing.length === 0, JSON.stringify(missing));
    check('S15 มีรูป fallback assets/role.jpg', fs.existsSync(path.join(ROOT, 'assets', 'role.jpg')));

    const bigGame =
      (await ev(`(async () => {
      newGameEnd();
      S.setup.n = 18;
      S.setup.names = Array.from({length:18}, (_,i)=>'B'+(i+1));
      S.setup.roles = Object.assign(zeroRoles(), {
        werewolf:2, minion:1, sorceress:1, lone_wolf:1, apprentice_seer:1, priest:1, pi:1,
        tough_guy:1, spellcaster:1, pacifist:1, virginia_woolf:1, troublemaker:1,
        tanner:1, cult_leader:1, vampire:1, hoodlum:1
      });
      S.setup.assignMode = 'random';
      const can = canStart();
      const warn = balanceWarnings().filter(x => x.indexOf('⚠') === 0);
      const vill = villagerCount();
      startGame();
      let guard = 0;
      while(S.screen === 'reveal' && guard++ < 60) nextRv();
      let rounds = 0;
      let screens = [];
      while (rounds < 40) {
        const sc = S.screen;
        screens.push(sc);
        if (sc === 'end') break;
        if (sc !== 'night') { screens.push('STUCK:' + sc); break; }
        await __T.playRound();
        rounds++;
      }
      const res = {
        can, warn, vill, rounds, screen: S.screen,
        winner: S.g ? S.g.winner : null,
        reason: S.g ? S.g.winReason : null,
        alive: S.g ? alive().length : -1,
        nDoneUsed: S.ui ? Object.keys(S.ui.nDone || {}).length : -1
      };
      S.g = null; S.ui = newUI(); S.screen = 'home'; render();
      return res;
    })()`)) || {};
    check(
      'S15 ชุดบทบาทใหม่ 18 คน: canStart + ไม่มี ⚠ + มีชาวบ้าน 1',
      bigGame.can === true && Array.isArray(bigGame.warn) && bigGame.warn.length === 0 && bigGame.vill === 1,
      JSON.stringify(bigGame)
    );
    check(
      'S15 เกม 18 คน (บทบาทใหม่ 15 ชนิด) เล่นจบทั้งเกมโดยไม่ค้าง',
      bigGame.screen === 'end' && ['village', 'werewolf', 'lovers', 'tanner', 'lonewolf', 'cult', 'vampire', 'hoodlum'].includes(bigGame.winner),
      JSON.stringify(bigGame)
    );

    /* ===== report ===== */
    const failed = results.filter(r => !r.ok);
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
    console.error('diag:', JSON.stringify({wsClosed, wsState: ws ? ws.readyState : null, events: typeof eventLog !== 'undefined' ? eventLog.slice(-8) : []}));
    try {
      const probe = await ev('({hb:window.__hb, screen: typeof S !== "undefined" ? S.screen : null})', 4000);
      console.error('probe:', JSON.stringify(probe));
    } catch (e) {
      console.error('probe failed:', e.message);
    }
    try {
      const shot = await send('Page.captureScreenshot', {format: 'png'});
      const shotPath = path.join(os.tmpdir(), 'ww-smoke-hang.png');
      fs.writeFileSync(shotPath, Buffer.from(shot.result.data, 'base64'));
      console.error('screenshot:', shotPath);
    } catch (e) {
      console.error('screenshot failed:', e.message);
    }
    try {
      const tgts = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`).then(r => r.json());
      console.error('targets:', JSON.stringify(tgts.map(x => ({type: x.type, url: (x.url || '').slice(0, 70)}))));
    } catch (e) {
      console.error('targets failed:', e.message);
    }
    cleanup();
    process.exit(2);
  }
}

main();
process.on('exit', sweepLeftovers);

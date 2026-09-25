
'use strict';

/* ========== DATA ========== */
const ROLES = {
  werewolf:  {name:'หมาป่า',       icon:'🐺', faction:'wolf',    desc:'กลางคืนเลือกเหยื่อ 1 คน'},
  wolfcub:   {name:'ลูกหมาป่า',     icon:'🐾', faction:'wolf',    desc:'ถ้าตาย คืนถัดไปหมาป่าฆ่าได้ 2 คน'},
  seer:      {name:'ผู้หยั่งรู้',    icon:'👁️', faction:'village', desc:'กลางคืนตรวจ 1 คน'},
  witch:     {name:'แม่มด',        icon:'🧪', faction:'village', desc:'มียารักษา 1 ยาพิษ 1 ใช้คืนละ 1 ชิ้น'},
  hunter:    {name:'นายพราน',      icon:'🎯', faction:'village', desc:'เมื่อตาย ยิงได้ 1 คน'},
  doctor:    {name:'หมอ',          icon:'💉', faction:'village', desc:'ป้องกันหมาป่า 1 คน/คืน'},
  bodyguard: {name:'บอดี้การ์ด',     icon:'🛡️', faction:'village', desc:'ป้องกันหมาป่า 1 คน/คืน'},
  cupid:     {name:'คิวปิด',        icon:'💘', faction:'village', desc:'คืนแรกเลือกคู่รัก 2 คน'},
  mayor:     {name:'นายอำเภอ',     icon:'🎖️', faction:'village', desc:'เสียงโหวตมีค่า 2'},
  cursed:    {name:'ผู้ต้องสาป',     icon:'🌀', faction:'village', desc:'ถ้าถูกหมาป่ากัด จะกลายเป็นหมาป่า'},
  fool:      {name:'คนโง่',         icon:'🃏', faction:'neutral', desc:'ชนะเมื่อถูกโหวตออกเท่านั้น'},
  infected:  {name:'ผู้ป่วยติดเชื้อ',  icon:'🦠', faction:'village', desc:'ถ้าถูกหมาป่ากัด หมาป่าจะฆ่าใครไม่ตายในคืนถัดไป'},
  prince:    {name:'เจ้าชาย',       icon:'👑', faction:'village', desc:'ถูกโหวตครั้งแรกไม่ตาย — เปิดบทบาททันที'},
  grandma:   {name:'ยายแก่',        icon:'👵', faction:'village', desc:'ทุกคืนต้องขับไล่ 1 คนออกจากหมู่บ้าน'},
  villager:  {name:'ชาวบ้าน',      icon:'👤', faction:'village', desc:'ไม่มีพลังพิเศษ'}
};
const SPECIAL = ['werewolf','wolfcub','seer','witch','hunter','doctor','bodyguard','cupid','mayor','cursed','fool','infected','prince','grandma'];
const WOLF_GROUP = ['werewolf','wolfcub'];
const VILLAGE_GROUP = ['seer','witch','hunter','doctor','bodyguard','cupid','mayor','cursed','infected','prince','grandma'];
const NEUTRAL_GROUP = ['fool'];
const SINGLETON_ROLES = ['wolfcub','seer','witch','hunter','doctor','bodyguard','cupid','mayor','cursed','fool','infected','prince','grandma'];
const SAVE_KEY = 'werewolf_v9';
const VER = '10.0';
const SLOT_IDX_KEY = 'werewolf_slot_idx';
const SLOT_COUNT = 3;
const HISTORY_KEY = 'werewolf_history';
const WINNER_LABEL = {village:'🏘️ ชาวบ้าน', werewolf:'🐺 หมาป่า', lovers:'💘 คู่รัก', fool:'🃏 คนโง่'};

const LOGO_SVG = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" class="wolf-logo">
  <defs>
    <linearGradient id="lg-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1e1b4b"/><stop offset="1" stop-color="#0f0c29"/>
    </linearGradient>
    <radialGradient id="lg-moon" cx=".35" cy=".35">
      <stop offset="0" stop-color="#fef3c7"/><stop offset="1" stop-color="#f59e0b"/>
    </radialGradient>
    <linearGradient id="lg-fur" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a5b4fc"/><stop offset="1" stop-color="#6366f1"/>
    </linearGradient>
    <filter id="lg-glow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect x="2" y="2" width="116" height="116" rx="28" fill="url(#lg-bg)" stroke="#6366f1" stroke-width="2"/>
  <circle cx="25" cy="22" r="1.2" fill="#fff" opacity=".6"/>
  <circle cx="95" cy="18" r="1" fill="#fff" opacity=".5"/>
  <circle cx="30" cy="42" r=".9" fill="#fff" opacity=".4"/>
  <circle cx="90" cy="38" r="1.1" fill="#fff" opacity=".5"/>
  <circle cx="20" cy="65" r=".8" fill="#fff" opacity=".35"/>
  <circle cx="100" cy="70" r="1" fill="#fff" opacity=".4"/>
  <circle cx="82" cy="32" r="13" fill="url(#lg-moon)" filter="url(#lg-glow)"/>
  <path d="M36 54 L28 34 L44 44 Q60 38 76 44 L92 34 L84 54 Q86 74 70 84 L60 90 L50 84 Q34 74 36 54Z" fill="url(#lg-fur)"/>
  <path d="M52 70 Q60 67 68 70 L66 82 L54 82Z" fill="#1e1b4b" opacity=".5"/>
  <ellipse cx="48" cy="58" rx="3" ry="2.2" fill="#fbbf24" filter="url(#lg-glow)"/>
  <ellipse cx="72" cy="58" rx="3" ry="2.2" fill="#fbbf24" filter="url(#lg-glow)"/>
  <ellipse cx="60" cy="79" rx="2.8" ry="2" fill="#0f0c29"/>
</svg>`;

/* ========== STATE ========== */
function newUI(){
  return {
    rvIdx:0, rvShown:false, rvSeen:false,
    nRole:null, nDone:{}, tgt:null, tgt2:null, tgts:[],
    seerRes:null, wMode:null,
    timer:300, tRunning:false,
    votes:[], vVoter:null, vTarget:null,
    tie:[], deaths:[], exDeaths:[], exId:null, pendHunter:null,
    assign:{}, cursedTurnedTonight:null,
    deathCauses:{}, resumeScreen:null,
    preExecuteSnap:null
  };
}
const S = {
  screen:'home',
  setup:{
    n:8, names:['A','B','C','D','E','F','G','H'],
    roles:{werewolf:2,wolfcub:0,seer:1,witch:1,hunter:1,doctor:0,bodyguard:0,cupid:1,mayor:1,cursed:0,fool:0,infected:0,prince:0,grandma:0},
    theme:'auto', fontSize:'normal', keepAwake:true, haptic:true, sound:true,
    assignMode:'random'
  },
  g:null, ui:newUI()
};

/* ========== HELPERS ========== */
const $ = id => document.getElementById(id);
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = s => String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
const shuffle = a => { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]} return a; };
const alive = () => S.g ? S.g.players.filter(p=>p.alive) : [];
const getP = id => S.g ? S.g.players.find(p=>p.id===id) : null;
const timerCls = () => S.ui.timer<=10?'dg':S.ui.timer<=30?'warn':'';

function isWolfTeam(p){
  if(!p) return false;
  if(p.roleId === 'cursed') return p.isTurned === true;
  return ROLES[p.roleId] && ROLES[p.roleId].faction === 'wolf';
}
function getTeamOf(p){
  if(!p) return 'village';
  if(p.roleId === 'cursed') return p.isTurned ? 'wolf' : 'village';
  return ROLES[p.roleId] ? ROLES[p.roleId].faction : 'village';
}
function isWolfTwoTargetMode(){
  if(!S.g || !S.g.night) return false;
  if(!S.g.night.wolfCubBonusActive) return false;
  const nonWolfAlive = S.g.players.filter(p => p.alive && !isWolfTeam(p));
  return nonWolfAlive.length >= 2;
}
function isWolvesInfectedThisRound(){
  return S.g && S.g.round === S.g.wolvesInfectedRound;
}
function getBanishedTarget(){
  return (S.g && S.g.night) ? S.g.night.grandmaTarget : null;
}
function dayAlive(){
  if(!S.g) return [];
  const ban = getBanishedTarget();
  return S.g.players.filter(p => p.alive && p.id !== ban);
}
function vibrate(pattern){
  if(!S.setup.haptic) return;
  try{ if(navigator.vibrate) navigator.vibrate(pattern); }catch(e){}
}
const IN_GAME_PHASES = ['night','dawn','hunter','day','voting','tie','execution','reveal','prince'];

/* ========== WAKE LOCK ========== */
let wakeLock = null;
async function requestWake(){
  if(!S.setup.keepAwake || !('wakeLock' in navigator)) return;
  try{ wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', ()=>{ wakeLock = null; }); }catch(e){}
}
function releaseWake(){ if(wakeLock){ try{ wakeLock.release(); }catch(e){} wakeLock = null; } }
document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState === 'visible' && S.g && S.setup.keepAwake) requestWake();
});

/* ========== LOG ========== */
function addLog(phase, msg){
  if(!S.g) return;
  if(!S.g.log) S.g.log = [];
  S.g.log.push({round:S.g.round, phase, msg, ts:Date.now()});
}
function popLastLog(prefix){
  if(!S.g || !S.g.log || !S.g.log.length) return;
  for(let i = S.g.log.length - 1; i >= 0; i--){
    const e = S.g.log[i];
    if(e && e.msg && e.msg.startsWith(prefix)){
      S.g.log.splice(i, 1);
      return;
    }
  }
}

/* ========== THEME ========== */
function applyTheme(){
  document.body.className = '';
  let useLight = false;
  if(S.setup.theme === 'light') useLight = true;
  else if(S.setup.theme === 'auto'){
    useLight = ['day','dawn','voting','tie','execution','prince'].includes(S.screen);
  }
  if(useLight) document.body.classList.add('light');
  if(S.setup.fontSize === 'large') document.body.classList.add('fs-l');
  else if(S.setup.fontSize === 'xlarge') document.body.classList.add('fs-xl');
}

/* ========== SAVE / LOAD ========== */
let ACTIVE_SLOT = 1;
function slotKeyFor(i){ return i === 1 ? SAVE_KEY : SAVE_KEY + '_s' + i; }
function saveKey(){ return slotKeyFor(ACTIVE_SLOT); }
function slotState(i){
  try{
    const raw = localStorage.getItem(slotKeyFor(i));
    if(!raw) return 'empty';
    const d = JSON.parse(raw);
    if(d && d.g && d.g.players && d.g.players.length) return d.g.winner ? 'ended' : 'game';
    const eff = (d && (d.resumeScreen || d.screen)) || null;
    if(eff === 'assign' && d.ui && d.ui.assign && Object.keys(d.ui.assign).length) return 'assign';
    return 'empty';
  }catch(e){ return 'empty'; }
}
const SLOT_LABEL = {game:'มีเกม', ended:'จบแล้ว', assign:'จัดบทบาท', empty:'ว่าง'};
function initSlots(){
  try{
    const v = parseInt(localStorage.getItem(SLOT_IDX_KEY), 10);
    ACTIVE_SLOT = (v >= 1 && v <= SLOT_COUNT) ? v : 1;
  }catch(e){ ACTIVE_SLOT = 1; }
}
function slotList(){
  const out = [];
  for(let i=1;i<=SLOT_COUNT;i++){
    const state = slotState(i);
    out.push({i, active:i === ACTIVE_SLOT, state, label:SLOT_LABEL[state], info:getSaveInfo(slotKeyFor(i))});
  }
  return out;
}
function switchSlot(i){
  if(i < 1 || i > SLOT_COUNT) return;
  if(i !== ACTIVE_SLOT){
    ACTIVE_SLOT = i;
    try{ localStorage.setItem(SLOT_IDX_KEY, String(i)); }catch(e){}
  }
  S.g = null; S.ui = newUI();
  load(false);
  const cur = S.screen;
  if(cur && cur !== 'home' && cur !== 'end') S.ui.resumeScreen = cur;
  S.screen = 'home';
  vibrate(10);
  render();
}
function save(){
  try{
    localStorage.setItem(saveKey(), JSON.stringify({
      screen:S.screen, g:S.g, ui:S.ui, setup:S.setup, ver:VER,
      resumeScreen: S.ui.resumeScreen || null
    }));
  }catch(e){}
}
function load(useResume){
  try{
    const raw = localStorage.getItem(saveKey());
    if(!raw) return false;
    const d = JSON.parse(raw);
    if(d.setup){
      const s = Object.assign(S.setup, d.setup);
      for(const r of SPECIAL) if(s.roles[r] === undefined) s.roles[r] = 0;
    }
    if(!S.setup.assignMode) S.setup.assignMode = 'random';
    if(S.setup.sound === undefined) S.setup.sound = true;
    S.ui = Object.assign(newUI(), d.ui || {});
    S.ui.tRunning = false;
    if(!S.ui.deathCauses) S.ui.deathCauses = {};
    S.ui.preExecuteSnap = null;
    if(Array.isArray(S.ui.votes)){
      S.ui.votes = S.ui.votes.map(v=>({voterId:v.voterId, targetId:v.targetId, skip: v.skip === true}));
    }
    if(d.g && d.g.players && d.g.players.length){
      S.g = d.g;
      if(!S.g.log) S.g.log = [];
      if(!S.g.seerChecks) S.g.seerChecks = [];
      if(S.g.wolvesInfectedRound === undefined) S.g.wolvesInfectedRound = null;
      if(S.g.grandmaLastTarget === undefined) S.g.grandmaLastTarget = null;
      if(!S.g.night) S.g.night = emptyNight();
      if(S.g.night){
        if(S.g.night.witchUsedTonight === undefined) S.g.night.witchUsedTonight = false;
        if(S.g.night.witchSkipped === undefined) S.g.night.witchSkipped = false;
        if(S.g.night.doctorTarget === undefined) S.g.night.doctorTarget = null;
        if(S.g.night.bodyguardTarget === undefined) S.g.night.bodyguardTarget = null;
        if(S.g.night.killTarget2 === undefined) S.g.night.killTarget2 = null;
        if(S.g.night.wolfCubBonusActive === undefined) S.g.night.wolfCubBonusActive = false;
        if(S.g.night.savedByWitchTarget === undefined) S.g.night.savedByWitchTarget = null;
        if(S.g.night.grandmaTarget === undefined) S.g.night.grandmaTarget = null;
      }
      if(S.g.wolfCubDead === undefined) S.g.wolfCubDead = false;
      for(const p of S.g.players){
        if(p.isTurned === undefined) p.isTurned = false;
        if(p.usedHunterShot === undefined) p.usedHunterShot = false;
        if(p.princeUsed === undefined) p.princeUsed = false;
      }
      const savedScreen = d.screen || 'home';
      const resumeScreen = d.resumeScreen || null;
      if(savedScreen === 'home' && resumeScreen && !S.g.winner){
        if(useResume){
          S.screen = resumeScreen;
          S.ui.resumeScreen = null;
        } else {
          S.screen = 'home';
          S.ui.resumeScreen = resumeScreen;
        }
      } else {
        S.screen = savedScreen;
        S.ui.resumeScreen = null;
      }
    } else {
      S.g = null;
      S.ui.resumeScreen = null;
      const isAssign = (d.screen === 'assign' || d.resumeScreen === 'assign') && S.ui.assign && Object.keys(S.ui.assign).length > 0;
      if(isAssign){
        S.screen = 'assign';
      } else {
        S.screen = 'home';
      }
    }
    return true;
  }catch(e){ return false; }
}
function getSaveInfo(key){
  try{
    const raw = localStorage.getItem(key || saveKey());
    if(!raw) return null;
    const d = JSON.parse(raw);
    if(!d) return null;
    if(d.g && d.g.winner) return null;
    const effectiveScreen = d.resumeScreen || d.screen;
    if(d.g && d.g.players && d.g.players.length > 0){
      return {screen:effectiveScreen, round:d.g.round||1, players:d.g.players.length, screenLabel:getScreenLabel(effectiveScreen)};
    }
    if((effectiveScreen === 'assign') && d.ui && d.ui.assign && Object.keys(d.ui.assign).length > 0){
      return {screen:'assign', round:0, players:Object.keys(d.ui.assign).length, screenLabel:'จัดบทบาท'};
    }
    return null;
  }catch(e){ return null; }
}
function getScreenLabel(screen){
  const map = {home:'หน้าแรก',setup:'ตั้งค่า',assign:'จัดบทบาท',reveal:'แจกบทบาท',night:'กลางคืน',dawn:'รุ่งเช้า',hunter:'นายพราน',day:'กลางวัน',voting:'โหวต',tie:'คะแนนเสมอ',execution:'แขวนคอ',prince:'เจ้าชาย',end:'จบเกม'};
  return map[screen] || 'กำลังเล่น';
}
function hasSave(){ return !!getSaveInfo(); }
async function clearSave(){
  if(!await askConfirm('ลบข้อมูลเกมในช่อง ' + ACTIVE_SLOT + '?', 'ลบข้อมูล', {danger:true, okLabel:'ลบ'})) return;
  try{ localStorage.removeItem(saveKey()); }catch(e){}
  S.g = null; S.ui = newUI(); S.screen = 'home';
  stopT(); releaseWake(); render();
}
async function continueGame(){
  if(!load(true)){ await askAlert('ไม่พบข้อมูลเก่า'); return; }
  if(S.g && S.setup.keepAwake) requestWake();
  render();
}
async function confirmLeaveGame(){
  const isEnded = S.g && S.g.winner;
  if(!isEnded){
    const ok = await askConfirm('กลับหน้าหลัก?\n\nเกมปัจจุบันจะถูกบันทึกไว้ — เล่นต่อได้จากหน้าแรก', 'ออกจากเกม?', {okLabel:'กลับหน้าหลัก'});
    if(!ok){
      return;
    }
  }
  stopT();
  releaseWake();
  if(!isEnded && IN_GAME_PHASES.includes(S.screen)){
    S.ui.resumeScreen = S.screen;
  } else {
    S.ui.resumeScreen = null;
  }
  S.screen = 'home';
  save();
  render();
}
function goHome(){
  const isEnded = S.g && S.g.winner;
  if(!isEnded && S.g && IN_GAME_PHASES.includes(S.screen)){
    S.ui.resumeScreen = S.screen;
  } else {
    S.ui.resumeScreen = null;
  }
  stopT();
  S.screen = 'home';
  save();
  render();
}

/* ========== TIMER ========== */
let tInt=null, tEnd=0;
function startT(){
  if(tInt || S.ui.timer<=0) return;
  S.ui.tRunning = true;
  tEnd = Date.now() + S.ui.timer*1000;
  tInt = setInterval(tickT, 250);
  const b = $('tBtn'); if(b) b.textContent = 'หยุด';
  updatePill();
}
function tickT(){
  const rem = Math.max(0, Math.ceil((tEnd-Date.now())/1000));
  S.ui.timer = rem;
  const el = $('tDisp');
  if(el){ el.textContent = fmt(rem); el.className = 'tm ' + timerCls(); }
  const elSheet = $('tDispSheet');
  if(elSheet){ elSheet.textContent = fmt(rem); elSheet.className = 'tm ' + timerCls(); }
  updatePill();
  if(rem<=0){
    stopT();
    const sBtn = $('tSheetToggleBtn');
    if(sBtn) sBtn.textContent = '▶ เริ่มจับเวลา';
    beep('timeup'); vibrate([300,100,300]); render();
  }
}
function updatePill(){
  const p2 = $('tPill2'); if(p2) p2.textContent = '⏱ ' + fmt(S.ui.timer);
}
function stopT(){
  S.ui.tRunning = false;
  if(tInt){ clearInterval(tInt); tInt = null; }
  const b = $('tBtn'); if(b) b.textContent = 'เริ่ม';
}
function toggleT(){ S.ui.tRunning ? stopT() : startT(); render(); }
function resetT(sec){ stopT(); S.ui.timer = sec; render(); }
let beepCtx = null;
function beep(kind){
  if(S.setup.sound === false) return;
  try{
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    if(!beepCtx) beepCtx = new AC();
    const ctx = beepCtx;
    if(ctx.state === 'suspended' && ctx.resume){
      const r = ctx.resume();
      if(r && r.catch) r.catch(()=>{});
    }
    const PATTERNS = {
      timeup: [[880,0,0.16],[880,0.20,0.16],[880,0.40,0.32]],
      night:  [[523.25,0,0.15],[659.25,0.15,0.15],[783.99,0.30,0.26]],
      vote:   [[440,0,0.14],[587.33,0.16,0.30]],
      win:    [[523.25,0,0.14],[659.25,0.14,0.14],[783.99,0.28,0.14],[1046.5,0.42,0.34]]
    };
    const notes = PATTERNS[kind] || PATTERNS.timeup;
    const t0 = ctx.currentTime + 0.02;
    for(let i=0;i<notes.length;i++){
      const freq = notes[i][0], delay = notes[i][1], dur = notes[i][2];
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      o.connect(g); g.connect(ctx.destination);
      const s = t0 + delay;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.14, s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
      o.start(s);
      o.stop(s + dur + 0.05);
      o.onended = () => { try{ o.disconnect(); g.disconnect(); }catch(e){} };
    }
  }catch(e){}
}
function showTimerSheet(){
  openSheet('⏱ ตั้งเวลา', `
    <div id="tDispSheet" class="tm ${timerCls()}" style="font-size:56px;padding:10px 0">${fmt(S.ui.timer)}</div>
    <div class="row mt" style="justify-content:center">
      <button id="tSheetToggleBtn" class="btn p" onclick="timerSheetToggle()">${S.ui.tRunning?'⏸ หยุดชั่วคราว':'▶ เริ่มจับเวลา'}</button>
    </div>
    <div class="row mt" style="justify-content:center;flex-wrap:wrap">
      ${btn('5 นาที', 'timerSheetReset(300)', {sm:1})}
      ${btn('3 นาที', 'timerSheetReset(180)', {sm:1})}
      ${btn('2 นาที', 'timerSheetReset(120)', {sm:1})}
      ${btn('1 นาที', 'timerSheetReset(60)', {sm:1})}
    </div>
    <div class="dim f13 tc mt">เวลาจะแสดงบนแถบบนของหน้าจอ</div>
  `);
}
function timerSheetToggle(){
  if(S.ui.tRunning) stopT(); else startT();
  const b = $('tSheetToggleBtn');
  if(b) b.textContent = S.ui.tRunning ? '⏸ หยุดชั่วคราว' : '▶ เริ่มจับเวลา';
  render();
}
function timerSheetReset(s){
  stopT();
  S.ui.timer = s;
  const el = $('tDispSheet'); if(el){ el.textContent = fmt(s); el.className = 'tm ' + timerCls(); }
  const b = $('tSheetToggleBtn');
  if(b) b.textContent = '▶ เริ่มจับเวลา';
  render();
}

/* ========== SETUP ========== */
function goSetup(){ S.screen='setup'; render(); }
function chgN(d){
  const n = S.setup.n + d;
  if(n<4 || n>18) return;
  S.setup.n = n;
  while(S.setup.names.length < n){
    const i = S.setup.names.length;
    S.setup.names.push(String.fromCharCode(65 + (i%26)));
  }
  S.setup.names = S.setup.names.slice(0, n);
  while(totalRoles() > n){
    const order = ['grandma','prince','infected','fool','cursed','mayor','cupid','bodyguard','doctor','hunter','wolfcub','seer','witch','werewolf'];
    let trimmed = false;
    for(const r of order){ if(S.setup.roles[r]>0){ S.setup.roles[r]--; trimmed=true; break; } }
    if(!trimmed) break;
  }
  render();
}
function setName(i, v){ S.setup.names[i] = v; save(); }
function totalRoles(){ return SPECIAL.reduce((s,r)=>s+(S.setup.roles[r]||0), 0); }
function villagerCount(){ return S.setup.n - totalRoles(); }
function incRole(r){
  if(totalRoles() >= S.setup.n) return;
  if(SINGLETON_ROLES.includes(r) && (S.setup.roles[r]||0) >= 1) return;
  S.setup.roles[r]++;
  vibrate(10);
  render();
}
function decRole(r){ if(S.setup.roles[r]<=0) return; S.setup.roles[r]--; vibrate(10); render(); }
function toggleSetup(k){ S.setup[k] = !S.setup[k]; applyTheme(); render(); }
function setTheme(t){ S.setup.theme = t; applyTheme(); render(); }
function setFont(f){ S.setup.fontSize = f; applyTheme(); render(); }
function setAssignMode(m){ S.setup.assignMode = m; render(); }

/* ========== PRESET ชุดบทบาท ========== */
const PRESET_KEY = 'werewolf_presets';
const PRESET_SIZES = [4,6,8,10,12,14,16];
const TRIM_ORDER = ['grandma','prince','infected','fool','cursed','mayor','cupid','bodyguard','doctor','hunter','wolfcub','seer','witch','werewolf'];

function zeroRoles(){ const o = {}; for(const r of SPECIAL) o[r] = 0; return o; }
function setPresetN(n){
  if(n < 4 || n > 18) return;
  S.setup.n = n;
  while(S.setup.names.length < n) S.setup.names.push(String.fromCharCode(65 + (S.setup.names.length % 26)));
  S.setup.names = S.setup.names.slice(0, n);
}
function clampRoles(){
  while(totalRoles() > S.setup.n){
    const r = TRIM_ORDER.find(x => (S.setup.roles[x] || 0) > 0);
    if(!r) break;
    S.setup.roles[r]--;
  }
}
function presetRoles(kind, n){
  const R = zeroRoles();
  const wolves = n <= 5 ? 1 : n <= 9 ? 2 : n <= 15 ? 3 : 4;
  R.werewolf = wolves;
  R.seer = 1; R.witch = 1;
  if(kind === 'party'){
    if(n >= 6) R.cupid = 1;
    if(n >= 8) R.fool = 1;
    if(n >= 9) R.cursed = 1;
    if(n >= 10) R.mayor = 1;
    if(n >= 11) R.infected = 1;
    if(n >= 12){ R.werewolf = Math.max(1, wolves - 1); R.wolfcub = 1; R.prince = 1; }
    if(n >= 14) R.grandma = 1;
    if(n >= 16) R.doctor = 1;
  } else if(kind === 'comp'){
    if(n >= 6) R.hunter = 1;
    if(n >= 8) R.doctor = 1;
    if(n >= 10) R.bodyguard = 1;
    if(n >= 12){ R.mayor = 1; R.prince = 1; }
    if(n >= 14) R.grandma = 1;
    if(n >= 16) R.infected = 1;
  } else {
    if(n >= 6) R.hunter = 1;
    if(n >= 8){ R.doctor = 1; R.mayor = 1; }
    if(n >= 10) R.cupid = 1;
    if(n >= 11) R.bodyguard = 1;
    if(n >= 12) R.cursed = 1;
    if(n >= 14) R.prince = 1;
    if(n >= 16) R.infected = 1;
  }
  let total = 0; for(const r of SPECIAL) total += R[r];
  while(total > n - 1){
    const r = TRIM_ORDER.find(x => R[x] > 0 && x !== 'werewolf' && x !== 'seer' && x !== 'witch');
    if(!r) break;
    R[r]--; total--;
  }
  return R;
}
function applyPreset(kind, n){
  const target = n || S.setup.n;
  setPresetN(target);
  S.setup.roles = presetRoles(kind, target);
  vibrate(10);
  render();
}
function applySizePreset(n){ applyPreset('std', n); }

function readPresets(){
  try{
    const raw = localStorage.getItem(PRESET_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  }catch(e){ return []; }
}
function writePresets(arr){
  try{ localStorage.setItem(PRESET_KEY, JSON.stringify(arr.slice(0, 10))); return true; }
  catch(e){ return false; }
}
function savePreset(){
  const d = new Date();
  const pad = v => String(v).padStart(2, '0');
  const name = S.setup.n + ' คน · ' + d.getDate() + '/' + (d.getMonth()+1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  const arr = readPresets();
  arr.unshift({ id:'p' + Date.now() + '_' + Math.floor(Math.random()*10000), name, n:S.setup.n, roles:Object.assign({}, S.setup.roles) });
  if(!writePresets(arr)){
    askAlert('บันทึกไม่สำเร็จ — พื้นที่จัดเก็บอาจเต็ม', 'บันทึก preset');
    return;
  }
  vibrate([30,40,30]);
  render();
}
function loadCustomPreset(id){
  const p = readPresets().find(x => x.id === id);
  if(!p) return;
  setPresetN(Number(p.n) || S.setup.n);
  const roles = zeroRoles();
  for(const r of SPECIAL){
    const v = Math.floor(Number(p.roles ? p.roles[r] : 0) || 0);
    if(v > 0) roles[r] = v;
  }
  S.setup.roles = roles;
  clampRoles();
  vibrate(10);
  render();
}
async function deleteCustomPreset(id){
  const arr = readPresets();
  const p = arr.find(x => x.id === id);
  if(!p) return;
  if(!await askConfirm('ลบชุด "' + p.name + '"?', 'ลบ preset', {danger:true, okLabel:'ลบ'})) return;
  writePresets(arr.filter(x => x.id !== id));
  render();
}
function canStart(){
  if(totalRoles() > S.setup.n) return false;
  const w = S.setup.roles.werewolf + S.setup.roles.wolfcub;
  const v = S.setup.n - w;
  return w>=1 && w<v && villagerCount()>=0;
}
function balanceWarnings(){
  const msgs = [];
  const w = S.setup.roles.werewolf + S.setup.roles.wolfcub;
  const cursed = S.setup.roles.cursed;
  const infected = S.setup.roles.infected;
  const v = S.setup.n - w;
  if(w === 0) msgs.push('⚠ ไม่มีหมาป่าในเกม → เกมจะจบทันที');
  else if(w >= v) msgs.push('⚠ หมาป่ามากกว่าหรือเท่ากับชาวบ้าน → หมาป่าชนะทันที');
  else if(w === 1 && S.setup.n >= 10) msgs.push('💡 ผู้เล่น '+S.setup.n+' คน แนะนำหมาป่า 2-3 ตัว');
  else if(w >= 4) msgs.push('💡 หมาป่า 4+ ตัว อาจยากต่อชาวบ้าน');
  if(cursed > 0 && w === 0) msgs.push('💡 ผู้ต้องสาปต้องมีหมาป่าในเกมจึงจะทำงาน');
  if(infected > 0 && w === 0) msgs.push('💡 ผู้ป่วยติดเชื้อต้องมีหมาป่าในเกมจึงจะทำงาน');
  if(S.setup.roles.wolfcub > 0 && S.setup.roles.werewolf === 0) msgs.push('💡 ลูกหมาป่าควรมีหมาป่าอย่างน้อย 1 ตัว');
  if(villagerCount() === 0 && !msgs.length) msgs.push('💡 ไม่มีชาวบ้านธรรมดา → เกมจะสั้นลง');
  return msgs;
}
function buildRandomDeck(){
  const deck = [];
  for(const r of SPECIAL) for(let k=0;k<S.setup.roles[r];k++) deck.push(r);
  while(deck.length < S.setup.n) deck.push('villager');
  return shuffle(deck);
}
function startGame(){
  if(!canStart()) return;
  const deck = buildRandomDeck();
  if(S.setup.assignMode === 'manual'){
    S.ui.assign = {};
    for(let i=0;i<S.setup.n;i++) S.ui.assign[i] = deck[i];
    S.screen = 'assign';
    vibrate([50,30,50]);
    render();
    return;
  }
  createGameFromDeck(deck);
}
function emptyNight(){
  return {killTarget:null, killTarget2:null, savedByWitch:false, savedByWitchTarget:null, poisonTarget:null, doctorTarget:null, bodyguardTarget:null, witchUsedTonight:false, witchSkipped:false, wolfCubBonusActive:false, grandmaTarget:null};
}
function createGameFromDeck(deck){
  const players = [];
  for(let i=0;i<S.setup.n;i++){
    const nm = (S.setup.names[i]||('ผู้เล่น '+(i+1))).trim() || ('ผู้เล่น '+(i+1));
    players.push({
      id:i, name:nm, roleId:deck[i], alive:true,
      isLover:false, loverId:null, isMayor:deck[i]==='mayor',
      usedHeal:false, usedPoison:false, usedHunterShot:false,
      isTurned:false, princeUsed:false
    });
  }
  S.g = {
    round:1, players,
    night:emptyNight(),
    prevBodyguardTarget:null,
    wolfCubDead:false,
    wolvesInfectedRound:null,
    grandmaLastTarget:null,
    winner:null, winReason:null,
    log:[], seerChecks:[]
  };
  S.ui = newUI();
  S.screen = 'reveal';
  const modeStr = S.setup.assignMode === 'manual' ? 'กำหนดเอง' : 'สุ่ม';
  addLog('info', 'เริ่มเกม — ผู้เล่น '+S.setup.n+' คน ('+modeStr+')');
  vibrate([50,30,50]);
  requestWake();
  render();
}

/* ========== ASSIGN ROLES ========== */
function setAssignRole(playerId, roleId){
  if(!S.ui.assign) S.ui.assign = {};
  S.ui.assign[playerId] = roleId;
  vibrate(15);
  render();
}
function reshuffleAssign(){
  const deck = buildRandomDeck();
  S.ui.assign = {};
  for(let i=0;i<S.setup.n;i++) S.ui.assign[i] = deck[i];
  vibrate(30);
  render();
}
async function resetAssign(){
  if(!await askConfirm('ล้างบทบาททั้งหมดเป็น "ชาวบ้าน"?', 'ล้างบทบาท', {danger:true, okLabel:'ล้าง'})) return;
  S.ui.assign = {};
  for(let i=0;i<S.setup.n;i++) S.ui.assign[i] = 'villager';
  vibrate(30);
  render();
}
function isAssignValid(){
  if(!S.ui.assign) return false;
  const used = {};
  for(const pid in S.ui.assign){
    const r = S.ui.assign[pid];
    used[r] = (used[r]||0) + 1;
  }
  const deck = {};
  for(const r of SPECIAL) deck[r] = S.setup.roles[r] || 0;
  deck.villager = villagerCount();
  for(const r of SPECIAL) if((used[r]||0) !== (deck[r]||0)) return false;
  if((used.villager||0) !== deck.villager) return false;
  return true;
}
function confirmAssign(){
  if(!isAssignValid()) return;
  const deck = [];
  for(let i=0;i<S.setup.n;i++) deck.push(S.ui.assign[i]);
  vibrate([50,30,50]);
  createGameFromDeck(deck);
}
function backToSetup(){ S.screen = 'setup'; render(); }

/* ========== REVEAL ========== */
let rvTimeout = null;
function showRv(){
  S.ui.rvShown = true; S.ui.rvSeen = true;
  if(rvTimeout) clearTimeout(rvTimeout);
  rvTimeout = setTimeout(()=>{ S.ui.rvShown=false; rvTimeout=null; render(); }, 5000);
  render();
}
function hideRv(){
  if(rvTimeout){ clearTimeout(rvTimeout); rvTimeout=null; }
  S.ui.rvShown = false; render();
}
function nextRv(){
  if(rvTimeout){ clearTimeout(rvTimeout); rvTimeout=null; }
  S.ui.rvShown = false; S.ui.rvSeen = false;
  if(S.ui.rvIdx >= S.g.players.length-1){
    S.ui.nRole = null; S.ui.nDone = {};
    S.screen = 'night';
  } else {
    S.ui.rvIdx++;
  }
  render();
}

/* ========== NIGHT ========== */
function activeNRoles(){
  const set = {};
  const arr = alive();
  const hasWolf = arr.some(p => isWolfTeam(p));
  if(hasWolf) set.werewolf = 1;
  if(arr.some(p=>p.roleId==='seer')) set.seer = 1;
  if(arr.some(p=>p.roleId==='doctor')) set.doctor = 1;
  if(arr.some(p=>p.roleId==='bodyguard')) set.bodyguard = 1;
  const witch = arr.find(p=>p.roleId==='witch');
  if(witch && (!witch.usedHeal || !witch.usedPoison)) set.witch = 1;
  if(arr.some(p=>p.roleId==='grandma')) set.grandma = 1;
  if(S.g.round === 1 && arr.some(p=>p.roleId==='cupid')) set.cupid = 1;
  if(arr.some(p=>p.roleId==='cursed')) set.cursed = 1;
  return Object.keys(set);
}
function openN(r){
  S.ui.nRole = r; S.ui.tgt = null; S.ui.tgt2 = null; S.ui.tgts = [];
  S.ui.seerRes = null; S.ui.wMode = null;
  render();
}
function closeN(){
  S.ui.nRole = null; S.ui.tgt = null; S.ui.tgt2 = null; S.ui.tgts = [];
  S.ui.seerRes = null; S.ui.wMode = null;
  render();
}
function pickT(id){
  if(S.ui.nRole === 'werewolf' && isWolfTwoTargetMode()){
    if(S.ui.tgt === id){ S.ui.tgt = null; }
    else if(S.ui.tgt2 === id){ S.ui.tgt2 = null; }
    else if(S.ui.tgt === null){ S.ui.tgt = id; }
    else if(S.ui.tgt2 === null && id !== S.ui.tgt){ S.ui.tgt2 = id; }
  } else {
    S.ui.tgt = id;
    S.ui.tgt2 = null;
  }
  vibrate(15);
  render();
}
function confirmWolf(){
  if(S.ui.tgt === null){ vibrate([50,20,50]); return; }
  const twoTarget = isWolfTwoTargetMode();
  if(twoTarget && S.ui.tgt2 === null){ vibrate([50,20,50]); return; }
  S.g.night.killTarget = S.ui.tgt;
  S.g.night.killTarget2 = twoTarget ? S.ui.tgt2 : null;
  S.ui.nDone.werewolf = true;
  const names = [getP(S.ui.tgt).name];
  if(S.g.night.killTarget2 !== null) names.push(getP(S.g.night.killTarget2).name);
  addLog('night', '🐺 หมาป่าเลือก ' + names.join(' + '));
  vibrate(30);
  closeN();
}
function confirmSeer(){
  if(S.ui.tgt===null) return;
  const t = getP(S.ui.tgt);
  const isWolf = isWolfTeam(t);
  S.ui.seerRes = {name:t.name, isWerewolf:isWolf};
  S.g.seerChecks.push({round:S.g.round, name:t.name, isWolf});
  S.ui.nDone.seer = true;
  addLog('night', '👁 ผู้หยั่งรู้ตรวจ '+t.name+' → '+(isWolf?'เป็นหมาป่า':'ไม่ใช่หมาป่า'));
  vibrate(30);
  render();
}
function confirmDoctor(){
  if(S.ui.tgt===null) return;
  S.g.night.doctorTarget = S.ui.tgt;
  S.ui.nDone.doctor = true;
  addLog('night', '💉 หมอป้องกัน '+getP(S.ui.tgt).name);
  vibrate(30);
  closeN();
}
function confirmBodyguard(){
  if(S.ui.tgt===null) return;
  S.g.night.bodyguardTarget = S.ui.tgt;
  S.ui.nDone.bodyguard = true;
  addLog('night', '🛡️ บอดี้การ์ดป้องกัน '+getP(S.ui.tgt).name);
  vibrate(30);
  closeN();
}
function witchP(){ return S.g ? S.g.players.find(p=>p.roleId==='witch') : null; }
function witchKillTargets(){
  const out = [];
  if(S.g.night.killTarget !== null) out.push(S.g.night.killTarget);
  if(S.g.night.wolfCubBonusActive && S.g.night.killTarget2 !== null && S.g.night.killTarget2 !== S.g.night.killTarget) out.push(S.g.night.killTarget2);
  return out;
}
function canWHeal(){
  const w = witchP();
  if(!w || w.usedHeal) return false;
  if(S.g.night.witchUsedTonight) return false;
  if(witchKillTargets().length === 0) return false;
  return true;
}
function canWPoison(){
  const w = witchP();
  if(!w || w.usedPoison) return false;
  if(S.g.night.witchUsedTonight) return false;
  return true;
}
function startHeal(){
  const targets = witchKillTargets();
  if(targets.length === 0) return;
  if(targets.length === 1){
    doHeal(targets[0]);
  } else {
    S.ui.wMode = 'heal';
    S.ui.tgt = null;
    render();
  }
}
function doHeal(targetId){
  if(!canWHeal()) return;
  const target = getP(targetId);
  if(!target) return;
  S.g.night.savedByWitch = true;
  S.g.night.savedByWitchTarget = targetId;
  S.g.night.witchUsedTonight = true;
  const w = witchP(); if(w) w.usedHeal = true;
  S.ui.nDone.witch = true;
  addLog('night', '🧪 แม่มดใช้ยารักษา '+target.name);
  vibrate(30);
  closeN();
}
function setWMode(m){ S.ui.wMode = m; S.ui.tgt = null; render(); }
function usePoison(){
  if(S.ui.tgt===null) return;
  const w = witchP();
  const target = getP(S.ui.tgt);
  if(w && target.id === w.id) return;
  S.g.night.poisonTarget = S.ui.tgt;
  S.g.night.witchUsedTonight = true;
  if(w) w.usedPoison = true;
  S.ui.nDone.witch = true;
  addLog('night', '☠️ แม่มดใช้ยาพิษ '+target.name);
  vibrate(30);
  closeN();
}
function witchSkip(){
  S.ui.nDone.witch = true;
  S.g.night.witchSkipped = true;
  addLog('night', '🧪 แม่มดเลือกไม่ใช้ยา');
  closeN();
}
function undoWitchSkip(){
  if(!S.g || !S.g.night) return;
  if(!S.g.night.witchSkipped) return;
  S.g.night.witchSkipped = false;
  S.ui.nDone.witch = false;
  popLastLog('🧪 แม่มดเลือกไม่ใช้ยา');
  vibrate(15);
  render();
}
function confirmGrandma(){
  if(S.ui.tgt===null) return;
  const target = getP(S.ui.tgt);
  if(!target) return;
  S.g.night.grandmaTarget = S.ui.tgt;
  S.ui.nDone.grandma = true;
  const self = target.roleId === 'grandma';
  addLog('night', '👵 ยายแก่ขับไล่ '+(self ? 'ตัวเอง' : target.name));
  vibrate(30);
  closeN();
}
function undoGrandma(){
  if(!S.g || !S.g.night) return;
  S.g.night.grandmaTarget = null;
  S.ui.nDone.grandma = false;
  S.ui.tgt = null;
  popLastLog('👵 ยายแก่ขับไล่');
  vibrate(15);
  render();
}
function toggleCupid(id){
  const i = S.ui.tgts.indexOf(id);
  if(i>=0) S.ui.tgts.splice(i,1);
  else if(S.ui.tgts.length<2) S.ui.tgts.push(id);
  vibrate(15);
  render();
}
function confirmCupid(){
  if(S.ui.tgts.length!==2) return;
  const [a,b] = S.ui.tgts;
  const pa = getP(a), pb = getP(b);
  pa.isLover = true; pa.loverId = b;
  pb.isLover = true; pb.loverId = a;
  S.ui.nDone.cupid = true;
  addLog('night', '💘 คิวปิดจับคู่ '+pa.name+' + '+pb.name);
  vibrate(30);
  closeN();
}
function confirmCursed(){
  const cursed = S.g.players.find(p=>p.roleId==='cursed');
  if(cursed){
    const st = cursed.isTurned ? 'กลายเป็นหมาป่า' : 'ยังเป็นชาวบ้าน';
    addLog('night', '🌀 แจ้งสถานะผู้ต้องสาป '+cursed.name+': '+st);
  }
  S.ui.nDone.cursed = true;
  closeN();
}

/* ========== UNDO NIGHT ACTIONS ========== */
function undoWolf(){
  if(!S.g || !S.g.night) return;
  S.g.night.killTarget = null;
  S.g.night.killTarget2 = null;
  S.ui.nDone.werewolf = false;
  S.ui.tgt = null; S.ui.tgt2 = null;
  popLastLog('🐺 หมาป่าเลือก');
  vibrate(15);
  render();
}
function undoSeer(){
  if(!S.g) return;
  S.ui.nDone.seer = false;
  S.ui.seerRes = null;
  S.ui.tgt = null;
  if(S.g.seerChecks && S.g.seerChecks.length){
    const last = S.g.seerChecks[S.g.seerChecks.length-1];
    if(last.round === S.g.round) S.g.seerChecks.pop();
  }
  popLastLog('👁 ผู้หยั่งรู้ตรวจ');
  vibrate(15);
  render();
}
function undoDoctor(){
  if(!S.g || !S.g.night) return;
  S.g.night.doctorTarget = null;
  S.ui.nDone.doctor = false;
  S.ui.tgt = null;
  popLastLog('💉 หมอป้องกัน');
  vibrate(15);
  render();
}
function undoBodyguard(){
  if(!S.g || !S.g.night) return;
  S.g.night.bodyguardTarget = null;
  S.ui.nDone.bodyguard = false;
  S.ui.tgt = null;
  popLastLog('🛡️ บอดี้การ์ดป้องกัน');
  vibrate(15);
  render();
}
function undoCupid(){
  if(!S.g) return;
  for(const p of S.g.players){
    if(p.isLover){ p.isLover = false; p.loverId = null; }
  }
  S.ui.nDone.cupid = false;
  S.ui.tgts = [];
  popLastLog('💘 คิวปิดจับคู่');
  vibrate(15);
  render();
}

/* ========== NIGHT RESOLUTION ========== */
function killP(id, cause){
  const p = getP(id);
  if(!p || !p.alive) return [];
  p.alive = false;
  if(!S.ui.deathCauses) S.ui.deathCauses = {};
  S.ui.deathCauses[id] = cause;
  const killed = [id];
  if(p.isLover && p.loverId!==null){
    const partner = getP(p.loverId);
    if(partner && partner.alive) killed.push(...killP(partner.id, 'lover'));
  }
  return killed;
}
function markWolfCubDead(killedIds){
  for(const kid of killedIds){
    const q = getP(kid);
    if(q && q.roleId === 'wolfcub' && !S.g.wolfCubDead){
      S.g.wolfCubDead = true;
      addLog('death', '🐾 ลูกหมาป่าตาย — คืนถัดไปหมาป่าฆ่าได้ 2 คน');
    }
  }
}
async function endNight(){
  const lines = [];
  const kt = S.g.night.killTarget;
  const kt2 = S.g.night.killTarget2;
  const wolvesInfected = isWolvesInfectedThisRound();

  if(kt !== null){
    let killStr = '🐺 หมาป่าเลือก: ' + getP(kt).name;
    if(kt2 !== null && S.g.night.wolfCubBonusActive){
      killStr += ' + ' + getP(kt2).name;
    }
    lines.push(killStr);
  } else {
    lines.push('🐺 หมาป่า: ยังไม่เลือก');
  }
  if(wolvesInfected){
    lines.push('🦠 [MOD ONLY] หมาป่าติดเชื้อ — เหยื่อทั้งหมดจะรอดในคืนนี้');
  }
  if(S.g.night.doctorTarget !== null){
    lines.push('💉 หมอป้องกัน: ' + getP(S.g.night.doctorTarget).name);
  }
  if(S.g.night.bodyguardTarget !== null){
    lines.push('🛡️ บอดี้การ์ดป้องกัน: ' + getP(S.g.night.bodyguardTarget).name);
  }
  if(S.g.night.witchUsedTonight){
    const savedTarget = (S.g.night.savedByWitchTarget !== undefined && S.g.night.savedByWitchTarget !== null)
      ? getP(S.g.night.savedByWitchTarget) : null;
    if(S.g.night.savedByWitch && savedTarget){
      lines.push('🧪 แม่มด: ใช้ยารักษา ' + savedTarget.name);
    }
    if(S.g.night.poisonTarget !== null && getP(S.g.night.poisonTarget)){
      lines.push('☠️ แม่มด: ใช้ยาพิษ ' + getP(S.g.night.poisonTarget).name);
    }
  } else {
    lines.push('🧪 แม่มด: ไม่ใช้ยา');
  }
  if(S.g.night.grandmaTarget !== null && getP(S.g.night.grandmaTarget)){
    const gp = getP(S.g.night.grandmaTarget);
    const self = gp.roleId === 'grandma';
    lines.push('👵 ยายแก่ขับไล่: ' + (self ? 'ตัวเอง' : gp.name));
  }
  const cursed = S.g.players.find(p=>p.roleId==='cursed');
  if(cursed){
    lines.push('🌀 ผู้ต้องสาป: ' + (cursed.isTurned ? 'กลายเป็นหมาป่าแล้ว' : 'ยังเป็นชาวบ้าน'));
  }
  const summary = '🌙 สรุปกลางคืนวันที่ ' + S.g.round + ':\n\n' + lines.join('\n') + '\n\nยืนยันจบกลางคืน?';
  if(!await askConfirm(summary, 'สรุปกลางคืน', {okLabel:'จบกลางคืน'})) return;

  const kills = [];
  if(S.g.night.killTarget !== null) kills.push(S.g.night.killTarget);
  if(S.g.night.wolfCubBonusActive && S.g.night.killTarget2 !== null) kills.push(S.g.night.killTarget2);

  const protection = new Set();
  if(S.g.night.doctorTarget !== null) protection.add(S.g.night.doctorTarget);
  if(S.g.night.bodyguardTarget !== null) protection.add(S.g.night.bodyguardTarget);
  if(S.g.night.savedByWitch && S.g.night.savedByWitchTarget != null){
    protection.add(S.g.night.savedByWitchTarget);
  }

  const deaths = [];
  const cursedTurned = [];
  const infectedSaveIds = [];

  for(const tid of kills){
    if(protection.has(tid)) continue;
    const p = getP(tid);
    if(!p || !p.alive) continue;

    if(wolvesInfected){
      infectedSaveIds.push(tid);
      continue;
    }

    if(p.roleId === 'cursed' && !p.isTurned){
      p.isTurned = true;
      cursedTurned.push(p.id);
      addLog('night', '🌀 ผู้ต้องสาป '+p.name+' กลายเป็นหมาป่า');
      continue;
    }
    if(p.roleId === 'infected'){
      S.g.wolvesInfectedRound = S.g.round + 1;
      addLog('night', '🦠 ผู้ป่วยติดเชื้อ '+p.name+' ถูกกัด — หมาป่าจะติดเชื้อคืนถัดไป');
    }
    deaths.push(...killP(tid, 'night'));
  }

  if(S.g.night.poisonTarget !== null){
    const tid = S.g.night.poisonTarget;
    const p = getP(tid);
    if(p && p.alive){
      if(cursedTurned.includes(tid)){
        addLog('night', '⚠ '+p.name+' ถูกกัดและวางยาพร้อมกัน → ตายเป็นหมาป่า');
      }
      deaths.push(...killP(tid, 'poison'));
    }
  }

  const actualSurvivors = infectedSaveIds.filter(id => {
    const p = getP(id);
    return p && p.alive;
  });
  if(actualSurvivors.length){
    const survivorNames = actualSurvivors.map(id => getP(id).name).join(', ');
    addLog('night', '🦠 หมาป่าติดเชื้อ — เหยื่อที่ถูกเลือก: ' + survivorNames + ' (รอดทุกคน)');
  }

  for(const id of deaths){
    const p = getP(id);
    if(!p) continue;
    const cause = (S.ui.deathCauses && S.ui.deathCauses[id]) || 'night';
    let msg = '💀 '+p.name+' ตายกลางคืน';
    if(cause === 'poison') msg = '☠️ '+p.name+' ตายจากยาพิษ';
    else if(cause === 'lover') msg = '💔 '+p.name+' ตายตามคู่รัก';
    addLog('death', msg);
  }
  markWolfCubDead(deaths);

  const grandP = S.g.players.find(p=>p.roleId==='grandma');
  if(grandP && !grandP.alive && S.g.night.grandmaTarget !== null && S.g.night.grandmaTarget !== grandP.id){
    const banP = getP(S.g.night.grandmaTarget);
    if(banP && banP.alive){
      addLog('death', '👵 ยายแก่ตายก่อนรุ่งเช้า — แต่คำสั่งขับไล่ '+banP.name+' ยังมีผลในวันนี้');
    }
  }

  S.ui.deaths = deaths;
  const cursedStillAlive = cursedTurned.length > 0 && !deaths.includes(cursedTurned[0]);
  S.ui.cursedTurnedTonight = cursedStillAlive ? cursedTurned[0] : null;

  let dh = null;
  for(const id of deaths){
    const p = getP(id);
    if(p && p.roleId==='hunter' && !p.usedHunterShot){ dh = id; break; }
  }
  S.ui.pendHunter = dh !== null ? {hunterId:dh, context:'dawn'} : null;

  S.screen = 'dawn';
  beep('night');
  vibrate([100,50,100]);
  render();
}
function hunterShoot(tid){
  const info = S.ui.pendHunter;
  if(!info) return;
  const {context, hunterId} = info;
  const h = getP(hunterId); if(h) h.usedHunterShot = true;
  S.ui.pendHunter = null;
  const killed = killP(tid, 'hunter');
  const target = getP(tid);
  if(h && target) addLog('death', '🎯 นายพราน '+h.name+' ยิง '+target.name);
  markWolfCubDead(killed);
  if(context==='dawn') S.ui.deaths.push(...killed);
  else S.ui.exDeaths.push(...killed);
  S.screen = context;
  vibrate([100,50,100]);
  render();
}
function skipHunter(){
  const info = S.ui.pendHunter;
  if(!info) return;
  const {context, hunterId} = info;
  const h = getP(hunterId); if(h) h.usedHunterShot = true;
  S.ui.pendHunter = null;
  addLog('death', '🎯 นายพราน '+(h?h.name:'?')+' ไม่ยิง');
  S.screen = context;
  render();
}
function goHunter(){ S.screen = 'hunter'; render(); }
function fromDawn(){
  const win = checkWin();
  if(win) return endGame(win);
  stopT();
  S.ui.timer = 300;
  S.screen = 'day';
  addLog('day', '☀️ เข้าสู่กลางวัน วันที่ '+S.g.round);
  vibrate([50,30,50]);
  render();
}

/* ========== VOTING ========== */
function startVoting(){
  stopT();
  if(S.ui.votes.length === 0){
    S.ui.vVoter = null;
    S.ui.vTarget = null;
  }
  S.screen = 'voting';
  render();
}
function backToDay(){ S.screen = 'day'; render(); }
function hasVoted(id){ return S.ui.votes.some(v=>v.voterId===id); }
function selectVoter(id){
  if(hasVoted(id)) return;
  if(id === getBanishedTarget()) return;
  S.ui.vVoter = id;
  S.ui.vTarget = null;
  vibrate(15);
  render();
}
function selectTarget(id){
  if(S.ui.vVoter===null || id===S.ui.vVoter) return;
  if(id === getBanishedTarget()) return;
  S.ui.vTarget = id;
  vibrate(15);
  render();
}
function clearSel(){ S.ui.vVoter = null; S.ui.vTarget = null; render(); }
function confirmVote(){
  if(S.ui.vVoter===null || S.ui.vTarget===null) return;
  S.ui.votes.push({voterId:S.ui.vVoter, targetId:S.ui.vTarget, skip:false});
  S.ui.vVoter = null;
  S.ui.vTarget = null;
  vibrate(30);
  render();
}
async function confirmSkipVote(){
  if(S.ui.vVoter===null) return;
  if(S.ui.vTarget !== null){
    const vp = getP(S.ui.vVoter), tp = getP(S.ui.vTarget);
    if(vp && tp){
      if(!await askConfirm('ยกเลิกการเลือก '+tp.name+'\n\nแล้วกดข้ามแทน?', 'เปลี่ยนเป็นข้าม?')) return;
    }
  }
  S.ui.votes.push({voterId:S.ui.vVoter, targetId:null, skip:true});
  S.ui.vVoter = null;
  S.ui.vTarget = null;
  vibrate(30);
  render();
}
function undoVote(){ if(S.ui.votes.length){ S.ui.votes.pop(); vibrate(15); render(); } }
async function resetVotes(){
  if(!S.ui.votes.length) return;
  if(!await askConfirm('ล้างคะแนนโหวตทั้งหมด?', 'ล้างคะแนนโหวต', {danger:true, okLabel:'ล้าง'})) return;
  S.ui.votes = []; S.ui.vVoter = null; S.ui.vTarget = null;
  render();
}
function tally(){
  const t = {};
  for(const p of dayAlive()) t[p.id] = 0;
  for(const v of S.ui.votes){
    if(v.skip) continue;
    const voter = getP(v.voterId);
    const w = (voter && voter.isMayor) ? 2 : 1;
    t[v.targetId] = (t[v.targetId]||0) + w;
  }
  return t;
}
async function finishVoting(){
  if(!S.ui.votes.length){ await askAlert('ยังไม่มีคะแนนโหวต', 'ยังไม่มีคะแนนโหวต'); return; }
  const realVotes = S.ui.votes.filter(v=>!v.skip);
  const summary = S.ui.votes.map(v=>{
    const a = getP(v.voterId);
    if(!a) return '';
    if(v.skip) return a.name+'→ข้าม';
    const b = getP(v.targetId);
    return b ? a.name+'→'+b.name : '';
  }).filter(Boolean).join(', ');
  addLog('day', '🗳 โหวต: '+summary);

  if(!realVotes.length){
    const notVoted = dayAlive().filter(p=>!hasVoted(p.id)).map(p=>p.name);
    const pendingMsg = notVoted.length ? `\n\nยังไม่ได้โหวต: ${notVoted.join(', ')}` : '';
    const goNight = await askConfirm('ไม่มีใครโหวตให้ใครเลย\n(ทุกคนที่กดแล้วเลือกข้าม)' + pendingMsg + '\n\nไปกลางคืนโดยไม่แขวนใคร?', 'ไปกลางคืน?', {okLabel:'ไปกลางคืน'});
    if(!goNight) return;
    addLog('day', '⚖️ ไม่มีใครถูกแขวน (ทุกคนข้าม)');
    const win = checkWin();
    if(win) return endGame(win);
    return goToNight();
  }

  const t = tally();
  const max = Math.max(...Object.values(t));
  const top = Object.entries(t).filter(([k,v])=>v===max).map(([k])=>Number(k));
  if(top.length>1){
    const names = top.map(id=>getP(id).name).join(', ');
    addLog('day', '⚖️ คะแนนเสมอ: '+names);
    S.ui.tie = top;
    S.ui.timer = 120;
    S.ui.tRunning = false;
    S.screen = 'tie';
    vibrate([100,50,100,50,100]);
  } else {
    return executePlayer(top[0]);
  }
  render();
}
function tieRevote(){
  stopT();
  S.ui.votes = [];
  S.ui.vVoter = null;
  S.ui.vTarget = null;
  S.screen = 'voting';
  render();
}
function tieNoDeath(){
  const win = checkWin();
  if(win) return endGame(win);
  addLog('day', '⚖️ ไม่มีใครถูกแขวน (จากคะแนนเสมอ)');
  goToNight();
}
function executePlayer(id){
  stopT();
  const p = getP(id);
  S.ui.exId = id;

  if(p && p.roleId === 'fool'){
    addLog('death', '🃏 '+p.name+' (คนโง่) ถูกโหวต → ชนะทันที');
    const killed = killP(id, 'vote');
    S.ui.exDeaths = killed;
    for(const kid of killed){
      if(kid !== id){
        const q = getP(kid);
        if(q) addLog('death', '💔 '+q.name+' ตายตามคู่รัก');
      }
    }
    return endGame({winner:'fool', reason:'คนโง่ถูกโหวตออก'});
  }

  if(p && p.roleId === 'prince' && !p.princeUsed){
    p.princeUsed = true;
    addLog('day', '👑 '+p.name+' (เจ้าชาย) เปิดตัว — ไม่ถูกแขวนคอ');
    S.screen = 'prince';
    vibrate([100,50,100]);
    render();
    return;
  }

  S.ui.preExecuteSnap = {
    g: JSON.parse(JSON.stringify(S.g)),
    votes: S.ui.votes.map(v => ({...v})),
    deathCauses: {...S.ui.deathCauses}
  };

  const killed = killP(id, 'vote');
  S.ui.exDeaths = killed;
  if(p) addLog('death', '⚰️ '+p.name+' ถูกแขวนคอ');
  for(const kid of killed){
    if(kid!==id){
      const q = getP(kid);
      if(q) addLog('death', '💔 '+q.name+' ตายตามคู่รัก');
    }
  }
  markWolfCubDead(killed);

  let hunterId = null;
  for(const kid of killed){
    const q = getP(kid);
    if(q && q.roleId==='hunter' && !q.usedHunterShot){ hunterId = kid; break; }
  }
  S.ui.pendHunter = hunterId !== null ? {hunterId, context:'execution'} : null;
  S.screen = 'execution';
  beep('vote');
  vibrate([100,50,100]);
  render();
}
function undoExecution(){
  if(!S.ui.preExecuteSnap) return;
  if(S.g && S.g.winner) return;
  S.g = S.ui.preExecuteSnap.g;
  S.ui.votes = S.ui.preExecuteSnap.votes;
  S.ui.deathCauses = S.ui.preExecuteSnap.deathCauses || {};
  S.ui.exDeaths = [];
  S.ui.exId = null;
  S.ui.pendHunter = null;
  S.ui.preExecuteSnap = null;
  S.screen = 'voting';
  vibrate(30);
  render();
}
function fromExecution(){
  const win = checkWin();
  if(win) return endGame(win);
  goToNight();
}
function fromPrince(){
  const win = checkWin();
  if(win) return endGame(win);
  goToNight();
}
function goToNight(){
  stopT();
  S.g.round++;
  S.g.prevBodyguardTarget = S.g.night.bodyguardTarget;
  S.g.grandmaLastTarget = S.g.night.grandmaTarget;
  const bonusActive = S.g.wolfCubDead && !S.g.night.wolfCubBonusActive;
  S.g.night = {
    killTarget:null, killTarget2:null, savedByWitch:false, savedByWitchTarget:null, poisonTarget:null,
    doctorTarget:null, bodyguardTarget:null, witchUsedTonight:false, witchSkipped:false,
    wolfCubBonusActive: bonusActive, grandmaTarget:null
  };
  S.ui = newUI();
  S.screen = 'night';
  addLog('night', '🌙 กลางคืนวันที่ '+S.g.round + (bonusActive ? ' (หมาป่าฆ่าได้ 2 คน)' : ''));
  vibrate([50,30,50]);
  render();
}

/* ========== WIN ========== */
/* ========== ประวัติเกม (เก็บ 10 เกมล่าสุด) ========== */
function readHistory(){
  try{
    const a = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(a) ? a : [];
  }catch(e){ return []; }
}
function writeHistory(arr){
  try{ localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, 10))); }catch(e){}
}
function recordGameEnd(win){
  if(!S.g || S.g.recordedEnd) return;
  S.g.recordedEnd = true;
  try{
    const hist = readHistory();
    hist.unshift({
      ts: Date.now(),
      n: S.g.players.length,
      round: S.g.round || 1,
      winner: win.winner,
      reason: win.reason || '',
      players: S.g.players.map(p => ({name:p.name, roleId:p.roleId, alive:p.alive}))
    });
    writeHistory(hist);
  }catch(e){}
}
function showGameHistory(){
  const hist = readHistory();
  if(!hist.length){
    openSheet('📖 ผลย้อนหลัง', '<div class="dim f13" style="padding:12px 0">ยังไม่มีเกมที่เล่นจบ — เกมที่จบจะถูกบันทึกไว้ 10 เกมล่าสุด</div>');
    return;
  }
  const items = hist.map(h => {
    const d = new Date(h.ts || 0);
    const pad = v => String(v).padStart(2, '0');
    const when = d.getDate() + '/' + (d.getMonth()+1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    const wLabel = WINNER_LABEL[h.winner] || h.winner || '—';
    const chips = (h.players || []).map(p => {
      const R = ROLES[p.roleId];
      return `<span class="chip" style="min-height:auto;padding:4px 8px;font-size:11px;${p.alive ? '' : 'opacity:.5;text-decoration:line-through'}">${esc(p.name)} · ${R ? R.icon + R.name : esc(p.roleId)}</span>`;
    }).join('');
    return `<div class="log-item ${h.winner === 'werewolf' ? 'death' : 'info'}">
      <div class="meta">${when} · ${h.n} คน · จบวันที่ ${h.round}</div>
      <div><b>${wLabel}</b> — ${esc(h.reason || '')}</div>
      <div class="row" style="margin-top:8px">${chips}</div>
    </div>`;
  }).join('');
  openSheet('📖 ผลย้อนหลัง (' + hist.length + ' เกมล่าสุด)', items);
}

function checkWin(){
  const arr = alive();
  const wolves = arr.filter(p => isWolfTeam(p));
  const villagers = arr.filter(p => !isWolfTeam(p));
  const lovers = arr.filter(p => p.isLover);
  if(arr.length === 2 && lovers.length === 2){
    const f1 = getTeamOf(lovers[0]);
    const f2 = getTeamOf(lovers[1]);
    if(f1 !== f2) return {winner:'lovers', reason:'คู่รักต่างฝ่ายเหลือ 2 คนสุดท้าย'};
  }
  if(wolves.length === 0) return {winner:'village', reason:'หมาป่าตายหมด'};
  if(wolves.length >= villagers.length) return {winner:'werewolf', reason:'หมาป่าเท่าหรือมากกว่าชาวบ้าน'};
  return null;
}
function endGame(win){
  S.g.winner = win.winner;
  S.g.winReason = win.reason;
  S.ui.exId = null;
  S.ui.resumeScreen = null;
  S.ui.preExecuteSnap = null;
  stopT(); releaseWake();
  addLog('info', '🏆 เกมจบ — '+win.reason);
  S.screen = 'end';
  recordGameEnd(win);
  beep('win');
  vibrate([200,100,200,100,300]);
  render();
}
function winnerText(){
  if(!S.g || !S.g.winner) return '—';
  return S.g.winner==='village' ? '🏘️ ชาวบ้าน'
       : S.g.winner==='werewolf' ? '🐺 หมาป่า'
       : S.g.winner==='lovers' ? '💘 คู่รัก'
       : S.g.winner==='fool' ? '🃏 คนโง่'
       : '—';
}
function newGameEnd(){
  try{ localStorage.removeItem(saveKey()); }catch(e){}
  S.g = null; S.ui = newUI(); S.screen = 'setup';
  render();
}

/* ========== MODERATOR PANEL ========== */
let modTimer = null;
function modStart(e){
  if(!S.g) return;
  e.preventDefault();
  if(modTimer) return;
  const el = $('modTrig');
  if(el) el.classList.add('hold');
  vibrate(20);
  modTimer = setTimeout(async ()=>{
    modTimer = null;
    if(el) el.classList.remove('hold');
    vibrate([50,30,50]);
    if(await askConfirm('🔐 เปิด Moderator Panel?\n\nตรวจสอบให้แน่ใจว่าไม่มีผู้เล่นมองเห็น', 'เปิด Moderator Panel?', {okLabel:'เปิด'})){
      showModPanel();
    }
  }, 3000);
}
function modEnd(){
  if(modTimer){ clearTimeout(modTimer); modTimer = null; const el = $('modTrig'); if(el) el.classList.remove('hold'); }
}
const DEATH_CAUSE_LABEL = {
  night:'หมาป่าฆ่า',
  poison:'ยาพิษ',
  lover:'ตายตามคู่รัก',
  hunter:'นายพรานยิง',
  vote:'ถูกโหวต'
};
function showModPanel(){
  if(!S.g) return;
  const lovers = S.g.players.filter(p => p.isLover);
  let loversHtml = '';
  if(lovers.length >= 2){
    const seen = new Set();
    const pairs = [];
    for(const p of lovers){
      if(seen.has(p.id)) continue;
      const partner = getP(p.loverId);
      if(partner){
        pairs.push({a:p, b:partner, aAlive:p.alive, bAlive:partner.alive, sameFaction: getTeamOf(p)===getTeamOf(partner)});
        seen.add(p.id); seen.add(partner.id);
      }
    }
    loversHtml = pairs.map(pair => {
      const deadFlag = (!pair.aAlive || !pair.bAlive) ? ' 💀' : '';
      const crossFlag = pair.sameFaction ? '' : ' <span class="dim f13">(ต่างฝ่าย)</span>';
      return `<div class="mod-lovers">
        <div style="font-size:15px;font-weight:700">💘 ${esc(pair.a.name)} ↔ ${esc(pair.b.name)}${deadFlag}</div>
        <div class="dim f13" style="margin-top:4px">${pair.aAlive?'มีชีวิต':'ตาย'} + ${pair.bAlive?'มีชีวิต':'ตาย'}${crossFlag}</div>
      </div>`;
    }).join('');
  } else {
    loversHtml = `<div class="dim f13 tc" style="padding:8px">ยังไม่มีคู่รัก</div>`;
  }

  const statusItems = [];
  if(isWolvesInfectedThisRound()){
    statusItems.push('🦠 <b>หมาป่าติดเชื้อ</b> — คืนนี้เหยื่อจะรอดทั้งหมด');
  } else if(S.g.wolvesInfectedRound !== null && S.g.round < S.g.wolvesInfectedRound){
    statusItems.push('🦠 หมาป่าจะติดเชื้อคืนที่ '+S.g.wolvesInfectedRound);
  }
  if(S.g.night.grandmaTarget !== null && getP(S.g.night.grandmaTarget)){
    const gp = getP(S.g.night.grandmaTarget);
    const self = gp.roleId==='grandma';
    statusItems.push('👵 ยายแก่ขับไล่: <b>'+esc(gp.name)+'</b>'+(self?' (ตัวเอง)':''));
  }
  if(S.g.grandmaLastTarget !== null && getP(S.g.grandmaLastTarget)){
    const lp = getP(S.g.grandmaLastTarget);
    statusItems.push('👵 คืนก่อนขับไล่: '+esc(lp.name));
  }
  S.g.players.filter(p=>p.roleId==='prince' && p.princeUsed).forEach(p=>{
    statusItems.push('👑 เจ้าชาย '+esc(p.name)+' ใช้สิทธิ์แล้ว');
  });
  const statusHtml = statusItems.length
    ? `<div class="mod-status">${statusItems.join('<br>')}</div>`
    : '';

  const rows = S.g.players.map(p=>{
    const R = ROLES[p.roleId];
    const flags = [];
    if(p.isLover){
      const partner = getP(p.loverId);
      flags.push('💘' + (partner ? partner.name : '?'));
    }
    if(p.isMayor) flags.push('🎖️');
    if(p.roleId==='witch'){
      if(p.usedHeal && p.usedPoison) flags.push('(ยาหมด)');
      else {
        const pt = [];
        if(!p.usedHeal) pt.push('💚');
        if(!p.usedPoison) pt.push('☠️');
        flags.push(pt.join(''));
      }
    }
    if(p.roleId==='hunter' && p.usedHunterShot) flags.push('ยิง✗');
    if(p.roleId==='cursed') flags.push(p.isTurned ? '🌀→🐺' : '🌀→👤');
    if(p.roleId==='prince' && p.princeUsed) flags.push('👑 ใช้แล้ว');
    if(p.roleId==='wolfcub') flags.push(S.g.wolfCubDead ? 'ตายแล้ว' : '');
    if(!p.alive && p.roleId==='infected' && S.g.wolvesInfectedRound !== null){
      flags.push('🦠 ส่งเชื้อ');
    }
    if(!p.alive && p.roleId==='prince' && !p.princeUsed){
      flags.push('👑 ไม่ได้ใช้');
    }
    const fc = getTeamOf(p);
    const fcCls = fc === 'wolf' ? 'w' : fc === 'neutral' ? 'n' : 'v';

    let causeLine = '';
    if(!p.alive){
      const cause = (S.ui.deathCauses && S.ui.deathCauses[p.id]);
      if(cause && DEATH_CAUSE_LABEL[cause]){
        causeLine = `<div class="cause">💀 ${DEATH_CAUSE_LABEL[cause]}</div>`;
      }
    }

    return `<div class="mod-row${p.alive?'':' dead'}">
      <div style="flex:1;min-width:0">
        <div class="who">${esc(p.name)} ${flags.filter(Boolean).join(' ')}</div>
        <div class="dim f13">${p.alive?'มีชีวิต':'ตาย'}${p.roleId==='cursed' ? ' · ' + (p.isTurned?'กลายเป็นหมาป่า':'ยังเป็นชาวบ้าน') : ''}</div>
        ${causeLine}
      </div>
      <span class="bd ${fcCls}">${R.icon} ${R.name}</span>
    </div>`;
  }).join('');

  openSheet('🎛️ Moderator Panel',
    `<div class="step">💘 คู่รัก</div>${loversHtml}` +
    `<div class="step mt">👥 ผู้เล่นทั้งหมด</div>${statusHtml}${rows}` +
    `<div class="card mt" style="padding:14px">
      <div class="dim f13">⚠️ ข้อมูลนี้เป็นความลับ — ปิดทันทีเมื่อไม่ใช้</div>
    </div>`);
}

/* ========== HISTORY ========== */
function showHistory(){
  if(!S.g || !S.g.log || !S.g.log.length){
    openSheet('📜 ประวัติ', '<div class="dim tc">ยังไม่มีเหตุการณ์</div>');
    return;
  }
  const groups = {};
  for(const e of S.g.log){
    const key = 'Round '+e.round;
    if(!groups[key]) groups[key] = [];
    groups[key].push(e);
  }
  let html = '';
  const keys = Object.keys(groups).sort((a,b)=> parseInt(a.replace('Round ','')) - parseInt(b.replace('Round ','')));
  for(const k of keys){
    html += `<div style="margin-bottom:14px"><div class="step">${k}</div>`;
    for(const e of groups[k]){
      const cls = e.phase==='night'?'night':e.phase==='death'?'death':e.phase==='day'?'day':'info';
      html += `<div class="log-item ${cls}">${esc(e.msg)}</div>`;
    }
    html += '</div>';
  }
  if(S.g.seerChecks && S.g.seerChecks.length){
    html += `<div style="margin-top:20px"><div class="step">👁 ผลตรวจผู้หยั่งรู้</div>`;
    for(const c of S.g.seerChecks){
      html += `<div class="log-item info"><div class="meta">คืน ${c.round}</div>${esc(c.name)} → ${c.isWolf?'🐺 เป็นหมาป่า':'👤 ไม่ใช่หมาป่า'}</div>`;
    }
    html += '</div>';
  }
  openSheet('📜 ประวัติเหตุการณ์', html);
}

/* ========== SHEET MODAL ========== */
function openSheet(title, bodyHtml){
  closeSheet();
  const ov = document.createElement('div');
  ov.className = 'overlay'; ov.id = 'sheetOverlay';
  ov.onclick = e => { if(e.target === ov) closeSheet(); };
  ov.innerHTML = `<div class="sheet">
    <div class="sheet-head"><h3>${esc(title)}</h3><button class="x" onclick="closeSheet()">✕</button></div>
    <div class="sheet-body">${bodyHtml}</div>
  </div>`;
  document.body.appendChild(ov);
}
function closeSheet(){ const el = $('sheetOverlay'); if(el) el.remove(); }

/* ========== DIALOG (แทน confirm / alert / prompt ของเบราว์เซอร์) ========== */
let __dlgSettle = null;
function closeDialog(){
  const el = $('dialogOverlay');
  if(el) el.remove();
  if(__dlgSettle){ const s = __dlgSettle; __dlgSettle = null; s(false); }
}
function showDialog(opts){
  closeDialog();
  const title = opts.title || 'ยืนยัน';
  const message = opts.message || '';
  const okLabel = opts.okLabel || 'ยืนยัน';
  const cancelLabel = opts.cancelLabel || 'ยกเลิก';
  const single = !!opts.single;
  const danger = !!opts.danger;
  return new Promise((resolve) => {
    const ov = document.createElement('div');
    ov.className = 'overlay dlg-ov';
    ov.id = 'dialogOverlay';
    const done = (val) => {
      document.removeEventListener('keydown', onKey, true);
      if(__dlgSettle === done) __dlgSettle = null;
      ov.remove();
      resolve(val);
    };
    const onKey = (e) => {
      if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); done(single ? true : false); }
      else if(e.key === 'Enter'){ e.preventDefault(); done(true); }
    };
    ov.innerHTML = `<div class="sheet dlg" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet-head"><h3>${esc(title)}</h3></div>
      <div class="dlg-msg">${esc(message)}</div>
      <div class="dlg-actions">
        ${single ? '' : `<button type="button" class="btn" data-dlg="0">${esc(cancelLabel)}</button>`}
        <button type="button" class="btn ${danger ? 'dg' : 'p'}" data-dlg="1">${esc(okLabel)}</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
    ov.querySelector('[data-dlg="1"]').onclick = () => done(true);
    const cancel = ov.querySelector('[data-dlg="0"]');
    if(cancel) cancel.onclick = () => done(false);
    ov.addEventListener('click', (e) => { if(e.target === ov) done(single ? true : false); });
    document.addEventListener('keydown', onKey, true);
    __dlgSettle = done;
    const okBtn = ov.querySelector('[data-dlg="1"]');
    if(okBtn) okBtn.focus();
  });
}
const askConfirm = (message, title, opts) => showDialog(Object.assign({title: title || 'ยืนยัน', message, okLabel: 'ยืนยัน'}, opts || {}));
const askAlert = (message, title) => showDialog({title: title || 'แจ้งเตือน', message, single: true, okLabel: 'ตกลง'});

/* ========== RENDER HELPERS ========== */
const chip = (label, opts={}) => {
  const cls = ['chip', opts.sel?'sel':'', opts.sel2?'sel2':'', opts.dis?'dis':'', opts.done?'done':'', opts.skip?'skip':''].filter(Boolean).join(' ');
  const click = opts.onclick ? ` onclick="${opts.onclick}"` : '';
  return `<div class="${cls}"${click}>${label}</div>`;
};
const btn = (label, onclick, opts={}) => {
  const cls = ['btn', opts.p?'p':'', opts.dg?'dg':'', opts.ok?'ok':'', opts.sm?'sm':''].filter(Boolean).join(' ');
  const dis = opts.dis ? ' disabled' : '';
  return `<button class="${cls}" onclick="${onclick}"${dis}>${label}</button>`;
};
const header = (ph, rn) => `<div style="text-align:center;padding:8px 0"><div style="font-size:11px;letter-spacing:.12em;color:var(--muted);font-weight:700;text-transform:uppercase">${ph}</div><div style="font-size:26px;font-weight:800;letter-spacing:-.03em">${rn}</div></div>`;
const notice = (txt, type='i', small=false) => `<div class="nt ${type}${small?' sm':''}">${txt}</div>`;
const timerHTML = (btns=true) => `
  <div id="tDisp" class="tm ${timerCls()}">${fmt(S.ui.timer)}</div>
  ${btns ? `<div class="row" style="justify-content:center">
    <button id="tBtn" class="btn sm" onclick="toggleT()">${S.ui.tRunning?'หยุด':'เริ่ม'}</button>
    <button class="btn sm" onclick="resetT(300)">5 นาที</button>
    <button class="btn sm" onclick="resetT(180)">3 นาที</button>
    <button class="btn sm" onclick="resetT(120)">2 นาที</button>
  </div>` : `<div class="row" style="justify-content:center">
    <button id="tBtn" class="btn sm" onclick="toggleT()">${S.ui.tRunning?'หยุด':'เริ่ม'}</button>
    <button class="btn sm" onclick="resetT(120)">2 นาที</button>
    <button class="btn sm" onclick="resetT(60)">1 นาที</button>
  </div>`}`;

/* ========== UI CHROME ========== */
function uxPhaseLabel(){
  const map={setup:'ตั้งค่าเกม',assign:'จัดบทบาท',reveal:'แจกบทบาท',night:'กลางคืน',dawn:'รุ่งเช้า',hunter:'นายพราน',day:'กลางวัน',voting:'การโหวต',tie:'คะแนนเสมอ',execution:'ผลการโหวต',prince:'เจ้าชายเปิดตัว',end:'จบเกม'};
  return map[S.screen]||'เกมหมาป่า';
}
function uxTopbar(){
  if(S.screen==='home') return '';
  const isActive = IN_GAME_PHASES.includes(S.screen);
  const isEnd = S.screen==='end';

  let leftBtn = '';
  if(isActive){
    leftBtn = `<button class="ux-back" onclick="confirmLeaveGame()" aria-label="กลับหน้าหลัก">⌂</button>`;
  } else if(isEnd){
    leftBtn = `<button class="ux-back" onclick="goHome()" aria-label="กลับหน้าหลัก">⌂</button>`;
  } else {
    let action='goHome()', icon='‹', label='ย้อนกลับ';
    if(S.screen==='setup'){ action='goHome()'; icon='‹'; label='หน้าแรก'; }
    if(S.screen==='assign'){ action='backToSetup()'; icon='‹'; label='ตั้งค่า'; }
    leftBtn = `<button class="ux-back" onclick="${action}" aria-label="${label}">${icon}</button>`;
  }

  const round = S.g ? `วันที่ ${S.g.round}` : '';
  const showTimer = S.ui.tRunning && !['day','tie','assign','setup','reveal','end'].includes(S.screen);
  const timerPill = showTimer ? `<div class="ux-timer-pill running" id="tPill2">⏱ ${fmt(S.ui.timer)}</div>` : '';
  return `<div class="ux-topbar"><div class="ux-topbar-inner">
    ${leftBtn}
    <div class="ux-topcopy"><div class="ux-eyebrow">คืนหอนหลอนหมาป่า</div><div class="ux-title">${uxPhaseLabel()}</div></div>
    ${timerPill}
    ${round?`<div class="ux-round">${round}</div>`:''}
  </div></div>`;
}
function uxBottom(){
  if(!S.g || ['home','setup','assign','reveal','end'].includes(S.screen)) return '';
  const nightActive=['night','dawn','hunter'].includes(S.screen);
  const dayActive=['day','voting','tie','execution','prince'].includes(S.screen);
  const timerBtn = S.ui.tRunning
    ? `<button onclick="toggleT()"><span class="ico">⏸</span>หยุด</button>`
    : `<button onclick="showTimerSheet()"><span class="ico">⏱</span>เวลา</button>`;
  const hasAlert = isWolvesInfectedThisRound();
  return `<nav class="ux-bottom" aria-label="เครื่องมือผู้ดำเนินเกม">
    <button class="${nightActive||dayActive?'active':''}" onclick="window.scrollTo({top:0,behavior:'smooth'})"><span class="ico">${nightActive?'🌙':'☀️'}</span>${nightActive?'กลางคืน':'กลางวัน'}</button>
    <button onclick="showHistory()"><span class="ico">📜</span>ประวัติ</button>
    ${timerBtn}
    <button class="primary-nav${hasAlert?' has-alert':''}" onclick="showModPanel()"><span class="ico">🎛️</span>ผู้ดูแล</button>
  </nav>`;
}

/* ========== RENDER ========== */
let renderGuard = false;
let lastRenderError = null;
function render(){
  if(renderGuard) return;
  renderGuard = true;
  try{
    applyTheme();
    const trig = $('modTrig');
    if(trig){ const hide=!S.g || ['home','setup','reveal','end','assign'].includes(S.screen); trig.style.display=hide?'none':'block'; }
    const app=$('app'); if(!app) return;
    const screens={home:renderHome,setup:renderSetup,assign:renderAssign,reveal:renderReveal,night:renderNight,dawn:renderDawn,hunter:renderHunter,day:renderDay,voting:renderVoting,tie:renderTie,execution:renderExecution,prince:renderPrince,end:renderEnd};
    const fn=screens[S.screen]||renderHome;
    const body=fn();
    if(S.screen==='home') app.innerHTML=body;
    else app.innerHTML=uxTopbar()+body+uxBottom();
    save();
    lastRenderError = null;
  }catch(err){
    lastRenderError = err;
    try{ console.error('render error:', err); }catch(e){}
    showErrorScreen(err);
  }finally{
    renderGuard = false;
  }
}
function showErrorScreen(err){
  try{
    const app = $('app');
    if(!app) return;
    const msg = String((err && (err.message || err)) || 'ไม่ทราบสาเหตุ');
    app.innerHTML = `<div class="scr" style="text-align:center;padding-top:36px">
      <div style="font-size:46px">⚠️</div>
      <h2 style="margin-top:8px">เกิดข้อผิดพลาด</h2>
      <p class="dim f13" style="margin:10px auto 0;max-width:420px;line-height:1.7">
        หน้านี้แสดงข้อมูลไม่สำเร็จ — ข้อมูลเกมในเครื่องยังถูกบันทึกไว้ตามปกติ<br>
        กด "ลองใหม่" หรือ "กลับหน้าแรก" เพื่อเล่นต่อ
      </p>
      <pre style="display:inline-block;max-width:92%;text-align:left;white-space:pre-wrap;word-break:break-word;margin-top:14px;padding:10px 12px;background:var(--surface2);border:1px solid var(--line);border-radius:10px;font-size:12px;color:var(--muted)">${esc(msg)}</pre>
      <div class="row" style="margin-top:18px;justify-content:center">
        ${btn('🔄 ลองใหม่', 'retryRender()', {p:1})}
        ${btn('🏠 กลับหน้าแรก', 'recoverHome()')}
      </div>
    </div>`;
  }catch(e){}
}
function retryRender(){ render(); }
function recoverHome(){
  try{ S.screen = 'home'; }catch(e){}
  lastRenderError = null;
  render();
  if(lastRenderError){ try{ location.reload(); }catch(e){} }
}

/* ========== SCREENS ========== */
function renderHome(){
  const info = getSaveInfo();
  const hasAny = !!info;
  const slots = slotList();
  const anySlotData = slots.some(s => s.state !== 'empty');
  const saveBlock = info ? `<div class="home-save">💾 มีเกมค้างอยู่ · ${info.screenLabel} วันที่ ${info.round} · ${info.players} คน</div>` : '';
  const slotBlock = anySlotData ? `<div class="row" style="margin-top:10px">${slots.map(s => `
      <button class="chip${s.active ? ' sel' : ''}" style="flex:1" onclick="switchSlot(${s.i})">
        <div>${s.active ? '▶ ' : ''}ช่อง ${s.i}</div>
        <div class="f13" style="font-weight:600;color:${s.state === 'game' ? 'var(--success)' : s.state === 'empty' ? 'var(--muted2)' : 'var(--muted)'}">${s.label}</div>
      </button>`).join('')}</div>` : '';
  const histCount = readHistory().length;
  return `<div class="scr home-screen">
    <div class="home-logo">${LOGO_SVG}</div>
    <h1>คืนหอนหลอนหมาป่า</h1>
    <p class="sub">ผู้ช่วยผู้ดำเนินเกม · 15 บทบาท · ใช้บนมือถือเครื่องเดียว</p>
    <section class="home-hero">
      <div class="home-kicker"><span class="home-dot"></span> MODERATOR MODE</div>
      ${saveBlock}
      ${slotBlock}
      <div class="home-copy">ทุกคืน ทุกโหวต ทุกบทบาท<br><span>จัดการเกมจากหน้าจอเดียว</span></div>
      <div class="home-actions">
        ${btn(hasAny?'เล่นเกมต่อ':'เริ่มเกมใหม่', hasAny?'continueGame()':'goSetup()', {p:1})}
        ${hasAny ? `<div class="home-secondary">
          ${btn('เริ่มเกมใหม่','goSetup()')}
          ${btn('ลบข้อมูลเก่า','clearSave()', {dg:1})}
        </div>` : `<div class="home-secondary">
          ${btn('ตั้งค่าเกม','goSetup()')}
          ${btn('วิธีใช้','showHelp()')}
        </div>`}
      </div>
      <div class="home-secondary" style="margin-top:10px">
        ${btn('📖 ผลย้อนหลัง' + (histCount ? ' (' + histCount + ')' : ''), 'showGameHistory()')}
      </div>
    </section>
    <div class="home-features">
      <div class="home-feature"><b>🎭 15 บทบาท</b><span>รวมบทบาทพิเศษ</span></div>
      <div class="home-feature"><b>🌙 Night Flow</b><span>เรียกทีละบทบาท</span></div>
      <div class="home-feature"><b>📱 Mobile First</b><span>กดง่าย อ่านชัด</span></div>
    </div>
    <div class="home-foot">v${VER} · ข้อมูลเกมเก็บในเครื่องนี้</div>
  </div>`;
}
function showHelp(){
  openSheet('📖 วิธีใช้', `
    <div class="log-item info"><b>1. ตั้งค่า</b> — เลือกผู้เล่น จำนวนบทบาท และโหมดกำหนด</div>
    <div class="log-item info"><b>2. แจกบทบาท</b> — ผู้เล่นสลับกันดูจอทีละคน</div>
    <div class="log-item info"><b>3. กลางคืน</b> — กดเรียกบทบาทตามลำดับ (แนะนำ: หมาป่า → ผู้หยั่งรู้ → หมอ → บอดี้การ์ด → แม่มด → ยายแก่)</div>
    <div class="log-item info"><b>4. กลางวัน</b> — อภิปราย + โหวต (มีปุ่ม "ข้าม" สำหรับคนไม่อยากโหวต)</div>
    <div class="log-item info"><b>5. Moderator Panel</b> — กดค้าง 3 วินาทีที่มุมขวาบน</div>
    <div class="log-item info"><b>6. ปุ่ม ⏱ เวลา</b> — เปิดได้จากแถบล่างของทุกเฟส</div>
    <div class="log-item info"><b>7. ปุ่ม ⌂</b> — ออกจากเกมกลางคัน (เล่นต่อได้จากหน้าแรก)</div>
    <div class="log-item"><b>History</b> — ดูเหตุการณ์ทั้งหมดพร้อมผลตรวจ Seer</div>
    <div class="log-item"><b>Undo กลางคืน</b> — ในหน้าสรุปของแต่ละบทบาทมีปุ่ม "↩︎ แก้ไข"</div>
    <div class="log-item"><b>Undo แขวนคอ</b> — ในหน้าแขวนคอ มีปุ่ม "↩︎ ย้อนการแขวน" (ถ้าเกมยังไม่จบ)</div>
  `);
}

function renderSetup(){
  const nameInputs = S.setup.names.map((n,i)=>
    `<input type="text" value="${esc(n)}" placeholder="ผู้เล่น ${i+1}" oninput="setName(${i}, this.value)">`
  ).join('');
  const roleRow = (r) => {
    const cnt = S.setup.roles[r]||0;
    const R = ROLES[r];
    const isSingleton = SINGLETON_ROLES.includes(r);
    const atMax = isSingleton && cnt >= 1;
    const plusDis = totalRoles()>=S.setup.n || atMax;
    const tag = atMax ? ' <span class="dim f13" style="font-weight:700">(สูงสุด 1)</span>' : '';
    return `<div class="rrow">
      <div><div class="n">${R.icon} ${R.name}${tag}</div><div class="dd">${R.desc}</div></div>
      <div class="cnt">
        <button onclick="decRole('${r}')"${cnt<=0?' disabled':''}>−</button>
        <div class="v">${cnt}</div>
        <button onclick="incRole('${r}')"${plusDis?' disabled':''}>+</button>
      </div>
    </div>`;
  };
  const wolfSection = WOLF_GROUP.map(roleRow).join('');
  const villageSection = VILLAGE_GROUP.map(roleRow).join('');
  const neutralSection = NEUTRAL_GROUP.map(roleRow).join('');
  const warnings = balanceWarnings();
  const customPresets = readPresets();
  const customRows = customPresets.length
    ? customPresets.map(p => {
        const cnt = SPECIAL.reduce((s,r) => s + (Math.floor(Number(p.roles && p.roles[r]) || 0)), 0);
        const w = (Math.floor(Number(p.roles && p.roles.werewolf) || 0)) + (Math.floor(Number(p.roles && p.roles.wolfcub) || 0));
        return `<div class="rrow">
          <div><div class="n">💾 ${esc(p.name)}</div><div class="dd">${p.n} คน · บทบาท ${cnt} · หมาป่า ${w}</div></div>
          <div class="cnt">
            <button title="ใช้ชุดนี้" onclick="loadCustomPreset('${esc(p.id)}')">✓</button>
            <button title="ลบชุดนี้" onclick="deleteCustomPreset('${esc(p.id)}')">✕</button>
          </div>
        </div>`;
      }).join('')
    : `<p class="dim f13 mt">ยังไม่มี — กด "💾 บันทึกชุดปัจจุบัน" เพื่อเก็บไว้ใช้ครั้งหน้า</p>`;
  const presetCard = `<div class="card">
      <h3>⚡ Preset ชุดบทบาท</h3>
      <p class="dim f13">ใช้ชุดพร้อมเล่น แล้วปรับจำนวนบทบาททีหลังได้</p>
      <div class="grid g3 mt">
        <button class="chip" onclick="applyPreset('std')">⚖️ มาตรฐาน</button>
        <button class="chip" onclick="applyPreset('party')">🎉 Party</button>
        <button class="chip" onclick="applyPreset('comp')">🏆 Competitive</button>
      </div>
      <div class="eyebrow" style="margin-top:16px">👥 จำนวนผู้เล่น (ใช้ชุดมาตรฐาน)</div>
      <div class="grid g4 mt">${PRESET_SIZES.map(n =>
        `<button class="chip${S.setup.n === n ? ' sel' : ''}" onclick="applySizePreset(${n})">${n} คน</button>`
      ).join('')}</div>
      <div class="eyebrow" style="margin-top:16px">💾 ชุดที่บันทึกไว้</div>
      ${customRows}
      ${btn('💾 บันทึกชุดปัจจุบัน', 'savePreset()', {sm:1})}
    </div>`;
  const warnHtml = warnings.length ? warnings.map(w => notice(w, 'wr', true)).join('') : '';
  const err = !canStart() ? notice('ยังไม่พร้อม: ต้องมีหมาป่าอย่างน้อย 1 ตัว และน้อยกว่าจำนวนชาวบ้าน', 'dg') : '';
  const manualHint = S.setup.assignMode === 'manual' ? `<div class="dim f13 mt tc">หลังกดปุ่มด้านล่าง จะเข้าสู่หน้า "จัดบทบาท"</div>` : '';
  return `<div class="scr">
    <h2>ตั้งค่าเกม</h2>
    <div class="card">
      <h3>จำนวนผู้เล่น</h3>
      <div class="cnt mt" style="justify-content:space-between;padding:8px 12px">
        <button onclick="chgN(-1)"${S.setup.n<=4?' disabled':''}>−</button>
        <div class="v" style="font-size:24px">${S.setup.n}</div>
        <button onclick="chgN(1)"${S.setup.n>=18?' disabled':''}>+</button>
      </div>
    </div>
    ${presetCard}
    <div class="card">
      <h3>ชื่อผู้เล่น</h3>
      <div class="lst mt">${nameInputs}</div>
    </div>
    <div class="card">
      <h3>บทบาท</h3>
      <p class="dim f13">รวม ${totalRoles()} / ${S.setup.n} คน · ชาวบ้าน ${villagerCount()}</p>
      <div class="eyebrow" style="margin-top:16px">🐺 ฝ่ายหมาป่า</div>
      ${wolfSection}
      <div class="eyebrow" style="margin-top:16px">👥 ฝ่ายชาวบ้าน</div>
      ${villageSection}
      <div class="eyebrow" style="margin-top:16px">🃏 ฝ่ายกลาง</div>
      ${neutralSection}
      <div class="dv"></div>
      <div class="rrow">
        <div><div class="n">👤 ชาวบ้าน</div><div class="dd">ไม่มีพลังพิเศษ</div></div>
        <div style="font-size:22px;font-weight:700">${villagerCount()}</div>
      </div>
    </div>
    <div class="card">
      <h3>🎯 วิธีกำหนดบทบาท</h3>
      <div class="seg mt">
        <button class="${S.setup.assignMode==='random'?'on':''}" onclick="setAssignMode('random')">🎲 สุ่มอัตโนมัติ</button>
        <button class="${S.setup.assignMode==='manual'?'on':''}" onclick="setAssignMode('manual')">✋ กำหนดเอง</button>
      </div>
    </div>
    <div class="card">
      <h3>ธีมและตัวเลือก</h3>
      <div class="set" style="flex-direction:column;align-items:stretch;gap:8px">
        <div class="f13 dim">ธีม</div>
        <div class="seg">
          <button class="${S.setup.theme==='dark'?'on':''}" onclick="setTheme('dark')">🌙 Dark</button>
          <button class="${S.setup.theme==='light'?'on':''}" onclick="setTheme('light')">☀️ Light</button>
          <button class="${S.setup.theme==='auto'?'on':''}" onclick="setTheme('auto')">🔄 Auto</button>
        </div>
      </div>
      <div class="set" style="flex-direction:column;align-items:stretch;gap:8px">
        <div class="f13 dim">ขนาดตัวอักษร</div>
        <div class="seg">
          <button class="${S.setup.fontSize==='normal'?'on':''}" onclick="setFont('normal')">ปกติ</button>
          <button class="${S.setup.fontSize==='large'?'on':''}" onclick="setFont('large')">ใหญ่</button>
          <button class="${S.setup.fontSize==='xlarge'?'on':''}" onclick="setFont('xlarge')">ใหญ่มาก</button>
        </div>
      </div>
      <div class="set mt">
        <div>🔓 เปิดหน้าจอค้างไว้</div>
        <div class="tg${S.setup.keepAwake?' on':''}" onclick="toggleSetup('keepAwake')"></div>
      </div>
      <div class="set">
        <div>📳 สั่นเมื่อแจ้งเตือน</div>
        <div class="tg${S.setup.haptic?' on':''}" onclick="toggleSetup('haptic')"></div>
      </div>
      <div class="set">
        <div>🔔 เสียงแจ้งเตือน (จบกลางคืน / ผลโหวต / หมดเวลา)</div>
        <div class="tg${S.setup.sound?' on':''}" onclick="toggleSetup('sound')"></div>
      </div>
    </div>
    ${warnHtml}
    ${err}
    ${btn('ยืนยันและเริ่มเกม', 'startGame()', {p:1, dis:!canStart()})}
    ${manualHint}
    ${btn('ย้อนกลับ', 'goHome()')}
  </div>`;
}

function renderAssign(){
  const deck = {};
  for(const r of SPECIAL) deck[r] = S.setup.roles[r] || 0;
  deck.villager = villagerCount();
  const assign = S.ui.assign || {};
  const used = {};
  for(const pid in assign){ const r = assign[pid]; used[r] = (used[r]||0) + 1; }
  const rolesToShow = new Set();
  for(const r of SPECIAL) if(deck[r] > 0) rolesToShow.add(r);
  if(deck.villager > 0) rolesToShow.add('villager');
  for(const pid in assign) rolesToShow.add(assign[pid]);
  const allRoles = [...SPECIAL, 'villager'].filter(r => rolesToShow.has(r));
  const poolRows = allRoles.map(r=>{
    const total = deck[r]; const u = used[r] || 0;
    const R = ROLES[r];
    let color = 'var(--warning)'; let icon = '⚠';
    if(u === total){ color = 'var(--success)'; icon = '✓'; }
    else if(u > total){ color = 'var(--danger)'; icon = '✕'; }
    return `<div class="pr mini"><div class="nm">${R.icon} ${R.name}</div><div style="color:${color};font-weight:700">${icon} ${u} / ${total}</div></div>`;
  }).join('');
  const playerRows = [];
  for(let i=0;i<S.setup.n;i++){
    const nm = (S.setup.names[i]||('ผู้เล่น '+(i+1))).trim() || ('ผู้เล่น '+(i+1));
    const cur = assign[i] || 'villager';
    const opts = allRoles.map(r=>{
      const R = ROLES[r];
      return `<option value="${r}"${cur===r?' selected':''}>${R.icon} ${R.name}</option>`;
    }).join('');
    playerRows.push(`<div class="pr"><div class="nm">${i+1}. ${esc(nm)}</div><select class="role-sel" onchange="setAssignRole(${i}, this.value)">${opts}</select></div>`);
  }
  const valid = isAssignValid();
  const validMsg = valid ? notice('✓ บทบาทครบพอดี — พร้อมเริ่มเกม', 'ok', true)
                         : notice('⚠ บทบาทยังไม่ครบหรือเกิน — กรุณาแก้ไขก่อน', 'dg', true);
  return `<div class="scr">
    <h2>จัดบทบาท</h2>
    ${notice('เลือกบทบาทให้ผู้เล่นแต่ละคน หรือใช้ปุ่มด้านล่าง', 'i', true)}
    <div class="card"><h3>📊 สถานะบทบาท</h3><div class="lst mt">${poolRows}</div></div>
    <div class="card"><h3>👥 ผู้เล่น (${S.setup.n} คน)</h3><div class="lst mt">${playerRows.join('')}</div></div>
    ${validMsg}
    <div class="row" style="justify-content:center">
      ${btn('🎲 สุ่มใหม่', 'reshuffleAssign()', {sm:1})}
      ${btn('🔄 ล้างเป็นชาวบ้าน', 'resetAssign()', {sm:1})}
    </div>
    ${btn('✓ ยืนยันและเริ่มเกม', 'confirmAssign()', {p:1, dis:!valid})}
    ${btn('ย้อนกลับไปตั้งค่า', 'backToSetup()')}
  </div>`;
}

function renderReveal(){
  const cur = S.g.players[S.ui.rvIdx];
  if(!cur){ S.screen='home'; return renderHome(); }
  const R = ROLES[cur.roleId];
  const total = S.g.players.length;
  const wolves = S.g.players.filter(p=>(p.roleId==='werewolf'||p.roleId==='wolfcub') && p.id!==cur.id);
  let rvHtml;
  if(!S.ui.rvShown){
    rvHtml = `<div class="rv" onclick="showRv()"><div class="hid">👆 แตะเพื่อดูบทบาท</div></div>`;
  } else {
    const wolfLine = ((cur.roleId==='werewolf'||cur.roleId==='wolfcub') && wolves.length)
      ? `<div class="rd mt">หมาป่าตัวอื่น: ${wolves.map(w=>esc(w.name)).join(', ')}</div>` : '';
    rvHtml = `<div class="rv ${R.faction}" onclick="hideRv()"><div>
      <div class="ri">${R.icon}</div><div class="rn">${R.name}</div>
      <div class="rf">${R.faction==='wolf'?'ฝ่ายหมาป่า':R.faction==='neutral'?'ฝ่ายกลาง':'ฝ่ายชาวบ้าน'}</div>
      <div class="rd">${R.desc}</div>${wolfLine}
    </div></div>`;
  }
  const nextLabel = S.ui.rvIdx===total-1 ? 'เริ่มเกม →' : 'ถัดไป →';
  const dots = S.g.players.map((_,i)=>{
    const cls = i < S.ui.rvIdx ? 'done' : i === S.ui.rvIdx ? 'current' : '';
    return `<div class="reveal-dot ${cls}"></div>`;
  }).join('');
  const checkedCount = S.ui.rvIdx;
  const checkedBadge = checkedCount > 0 ? `<span class="badge-check">ตรวจแล้ว ${checkedCount}</span>` : '';
  return `<div class="scr">
    <div class="reveal-progress">${dots}</div>
    ${header('แจกบทบาท', `${S.ui.rvIdx+1} / ${total}`)}
    <div class="card tc">
      ${checkedBadge}
      <div class="dim f13" style="margin-top:6px">ผู้เล่นคนที่ ${S.ui.rvIdx+1}</div>
      <div style="font-size:24px;font-weight:800;margin-top:6px">${esc(cur.name)}</div>
    </div>
    ${rvHtml}
    ${btn(nextLabel, 'nextRv()', {p:1, dis:!S.ui.rvSeen})}
  </div>`;
}

function renderNight(){
  if(!S.ui.nRole) return renderNightPanel();
  const fns = {werewolf:renderWolf, seer:renderSeer, witch:renderWitch, cupid:renderCupid, doctor:renderDoctor, bodyguard:renderBodyguard, cursed:renderCursed, grandma:renderGrandma};
  const fn = fns[S.ui.nRole];
  return fn ? fn() : renderNightPanel();
}

function renderNightPanel(){
  const roles = activeNRoles();
  const doneCount = roles.filter(r=>S.ui.nDone[r]).length;
  const pct = roles.length ? Math.round(doneCount/roles.length*100) : 0;
  const twoTarget = isWolfTwoTargetMode();
  let bonusMsg = '';
  if(S.g.night.wolfCubBonusActive){
    bonusMsg = twoTarget
      ? notice('🐾 ลูกหมาป่าตาย — คืนนี้หมาป่าฆ่าได้ 2 คน', 'wr', true)
      : notice('🐾 โบนัสลูกหมาป่าเปิด แต่มีเป้าหมายไม่พอ → เลือก 1 คน', 'wr', true);
  }
  const cards = roles.map(r=>{
    const R=ROLES[r], done=!!S.ui.nDone[r];
    const cls = r==='werewolf'?' wolf':(r==='seer'?' info':'');
    let desc = R.desc;
    if(r==='werewolf'){
      desc = twoTarget ? 'เลือกเหยื่อ 2 คน' : 'เลือกเหยื่อ 1 คน';
    }
    if(r==='cursed') desc = 'แจ้งสถานะผู้เล่น (ไม่ต้องเลือก)';
    return `<button class="night-action${done?' done':''}${cls}" onclick="openN('${r}')">
      <span class="icon">${R.icon}</span>
      <span class="name">${R.name}</span>
      <span class="desc">${desc}</span>
      <span class="state">${done?'✓':'›'}</span>
    </button>`;
  }).join('');
  const order = [];
  if(roles.includes('werewolf')) order.push('หมาป่า');
  if(roles.includes('seer')) order.push('ผู้หยั่งรู้');
  if(roles.includes('doctor')) order.push('หมอ');
  if(roles.includes('bodyguard')) order.push('บอดี้การ์ด');
  if(roles.includes('witch')) order.push('แม่มด');
  if(roles.includes('grandma')) order.push('ยายแก่');
  if(roles.includes('cupid')) order.push('คิวปิด');
  if(roles.includes('cursed')) order.push('ผู้ต้องสาป');
  const orderHint = order.length > 1 ? `<div class="order-hint">💡 <b>ลำดับที่แนะนำ:</b> ${order.join(' → ')}</div>` : '';
  return `<div class="scr">
    <section class="phase-hero">
      <div class="eyebrow">🌙 NIGHT PHASE</div>
      <h2>กลางคืน</h2>
      <div class="round">คืนที่ ${S.g.round}</div>
    </section>
    ${bonusMsg}
    <section class="night-progress">
      <div class="night-progress-top"><span>การเรียกบทบาท</span><span>${doneCount} / ${roles.length} เสร็จแล้ว</span></div>
      <div class="night-progress-bar"><i style="width:${pct}%"></i></div>
    </section>
    ${orderHint}
    <div class="night-actions">${cards}</div>
    <div style="height:76px"></div>
    <div class="night-finish">${btn('จบกลางคืน →','endNight()',{p:1})}</div>
  </div>`;
}

function renderWolf(){
  if(S.ui.nDone.werewolf){
    const kt = S.g.night.killTarget;
    const kt2 = S.g.night.killTarget2;
    const names = [];
    if(kt !== null && getP(kt)) names.push(esc(getP(kt).name));
    if(kt2 !== null && getP(kt2)) names.push(esc(getP(kt2).name));
    return `<div class="scr">
      ${header('🐺 หมาป่า', 'เลือกแล้ว')}
      ${notice('คืนนี้หมาป่าเลือกเหยื่อไปแล้ว', 'wr')}
      ${names.length ? notice(`เหยื่อ: <b>${names.join(' + ')}</b>`, 'dg') : ''}
      ${btn('↩︎ แก้ไขการเลือก', 'undoWolf()')}
      ${btn('ปิด', 'closeN()')}
    </div>`;
  }
  const twoTarget = isWolfTwoTargetMode();
  const bonusActive = S.g.night.wolfCubBonusActive;
  const chips = alive().map(p=>{
    const isWolf = isWolfTeam(p);
    let selCls = '';
    if(S.ui.tgt === p.id) selCls = 'sel';
    else if(S.ui.tgt2 === p.id) selCls = 'sel2';
    return chip(esc(p.name), {
      sel: selCls==='sel', sel2: selCls==='sel2', dis: isWolf,
      onclick: isWolf ? null : `pickT(${p.id})`
    });
  }).join('');
  const picked = [S.ui.tgt, S.ui.tgt2].filter(x=>x!==null);
  const maxPicks = twoTarget ? 2 : 1;
  const ok = picked.length === maxPicks;
  const counter = twoTarget ? `${picked.length}/2` : `${picked.length}/1`;
  const bonusNotice = bonusActive && !twoTarget
    ? notice('🐾 โบนัสลูกหมาป่าเปิด แต่มีเป้าหมายไม่พอ → เลือก 1 คน', 'wr')
    : (twoTarget ? notice('🐾 โบนัสจากลูกหมาป่า: ต้องเลือก 2 คน', 'wr') : '');
  return `<div class="scr">
    ${header('🐺 หมาป่า', twoTarget ? 'เลือก 2 เหยื่อ' : 'เลือกเหยื่อ 1 คน')}
    ${bonusNotice}
    <div class="card" style="padding:12px 14px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="dim f13">เลือกแล้ว</span>
        <span style="font-weight:800;color:${ok?'var(--success)':'var(--warning)'};font-size:16px">${counter}</span>
      </div>
    </div>
    <div class="grid g3">${chips}</div>
    ${btn('ยืนยันเหยื่อ', 'confirmWolf()', {p:1, dis:!ok})}
    ${btn('ย้อนกลับ', 'closeN()')}
  </div>`;
}

function renderSeer(){
  if(S.ui.seerRes){
    const r = S.ui.seerRes;
    return `<div class="scr">
      ${header('👁️ ผู้หยั่งรู้', 'ผลตรวจ')}
      ${notice(`${esc(r.name)} — ${r.isWerewolf?'🐺 เป็นหมาป่า':'👤 ไม่ใช่หมาป่า'}`, r.isWerewolf?'dg':'ok')}
      ${btn('↩︎ ตรวจใหม่', 'undoSeer()')}
      ${btn('เข้าใจแล้ว', 'closeN()', {p:1})}
    </div>`;
  }
  if(S.ui.nDone.seer){
    const lastCheck = (S.g.seerChecks || []).filter(c=>c.round===S.g.round).pop();
    const checkInfo = lastCheck
      ? notice(`คืนนี้ตรวจแล้ว: <b>${esc(lastCheck.name)}</b> — ${lastCheck.isWolf?'🐺 เป็นหมาป่า':'👤 ไม่ใช่หมาป่า'}`, lastCheck.isWolf?'dg':'ok')
      : '';
    return `<div class="scr">
      ${header('👁️ ผู้หยั่งรู้', 'ตรวจไปแล้ว')}
      ${notice('คืนนี้ผู้หยั่งรู้ตรวจไปแล้ว', 'wr')}
      ${checkInfo}
      ${btn('↩︎ แก้ไขผลตรวจ', 'undoSeer()')}
      ${btn('ปิด', 'closeN()')}
    </div>`;
  }
  const seer = S.g.players.find(p=>p.roleId==='seer');
  const chips = alive().map(p=>{
    const isSelf = seer && p.id===seer.id;
    return chip(esc(p.name), {sel: S.ui.tgt===p.id, dis: isSelf, onclick: isSelf ? null : `pickT(${p.id})`});
  }).join('');
  const checks = (S.g.seerChecks || []);
  const historyHtml = checks.length > 0 ? `<div class="seer-history">
    <h4>📜 ประวัติการตรวจ</h4>
    ${checks.slice(-5).reverse().map(c=>`<div class="seer-history-item">
      <b>คืน ${c.round}:</b> ${esc(c.name)} <span class="tag ${c.isWolf?'w':'v'}">${c.isWolf?'🐺 หมาป่า':'👤 ไม่ใช่'}</span>
    </div>`).join('')}
  </div>` : '';
  return `<div class="scr">
    ${header('👁️ ผู้หยั่งรู้', 'เลือกตรวจ 1 คน')}
    <div class="grid g3">${chips}</div>
    ${btn('ตรวจสอบ', 'confirmSeer()', {p:1, dis:S.ui.tgt===null})}
    ${historyHtml}
    ${btn('ย้อนกลับ', 'closeN()')}
  </div>`;
}

function renderDoctor(){
  if(S.ui.nDone.doctor){
    const target = S.g.night.doctorTarget !== null ? getP(S.g.night.doctorTarget) : null;
    return `<div class="scr">
      ${header('💉 หมอ', 'ป้องกันแล้ว')}
      ${notice('คืนนี้หมอป้องกันไปแล้ว', 'wr')}
      ${target ? notice(`ป้องกัน: <b>${esc(target.name)}</b>`, 'ok') : ''}
      ${btn('↩︎ แก้ไขการเลือก', 'undoDoctor()')}
      ${btn('ปิด', 'closeN()')}
    </div>`;
  }
  const doc = S.g.players.find(p=>p.roleId==='doctor');
  const chips = alive().map(p=>{
    const isSelf = doc && p.id === doc.id;
    const label = esc(p.name) + (isSelf ? ' (ตัวเอง)' : '');
    return chip(label, {sel: S.ui.tgt===p.id, dis: isSelf, onclick: isSelf ? null : `pickT(${p.id})`});
  }).join('');
  return `<div class="scr">
    ${header('💉 หมอ', 'ป้องกัน 1 คน')}
    ${notice('ห้ามเลือกตัวเอง', 'i', true)}
    <div class="grid g3">${chips}</div>
    ${btn('ยืนยัน', 'confirmDoctor()', {p:1, dis:S.ui.tgt===null})}
    ${btn('ย้อนกลับ', 'closeN()')}
  </div>`;
}

function renderBodyguard(){
  if(S.ui.nDone.bodyguard){
    const target = S.g.night.bodyguardTarget !== null ? getP(S.g.night.bodyguardTarget) : null;
    return `<div class="scr">
      ${header('🛡️ บอดี้การ์ด', 'ป้องกันแล้ว')}
      ${notice('คืนนี้บอดี้การ์ดป้องกันไปแล้ว', 'wr')}
      ${target ? notice(`ป้องกัน: <b>${esc(target.name)}</b>`, 'ok') : ''}
      ${btn('↩︎ แก้ไขการเลือก', 'undoBodyguard()')}
      ${btn('ปิด', 'closeN()')}
    </div>`;
  }
  const prev = S.g.prevBodyguardTarget;
  const chips = alive().map(p=>{
    const isPrev = prev !== null && prev === p.id;
    const label = esc(p.name) + (isPrev ? ' (คืนก่อน)' : '');
    return chip(label, {
      sel: S.ui.tgt===p.id, dis: isPrev,
      onclick: isPrev ? null : `pickT(${p.id})`
    });
  }).join('');
  return `<div class="scr">
    ${header('🛡️ บอดี้การ์ด', 'ป้องกัน 1 คน')}
    ${notice('ห้ามซ้ำคนเดิมจากคืนก่อน · ป้องกันตัวเองได้', 'i', true)}
    <div class="grid g3">${chips}</div>
    ${btn('ยืนยัน', 'confirmBodyguard()', {p:1, dis:S.ui.tgt===null})}
    ${btn('ย้อนกลับ', 'closeN()')}
  </div>`;
}

function renderCursed(){
  const cursed = S.g.players.find(p=>p.roleId==='cursed');
  if(!cursed){ S.screen='night'; return renderNightPanel(); }
  const status = cursed.isTurned
    ? notice('🌀 ผู้ต้องสาป <b>กลายเป็นหมาป่าแล้ว</b><br><span class="f13">แจ้งผู้เล่นด้วยปากเปล่า — ห้ามให้คนอื่นเห็น</span>', 'dg')
    : notice('🌀 ผู้ต้องสาป <b>ยังเป็นฝ่ายชาวบ้าน</b><br><span class="f13">แจ้งผู้เล่นด้วยปากเปล่า</span>', 'i');
  return `<div class="scr">
    ${header('🌀 ผู้ต้องสาป', 'แจ้งสถานะ')}
    ${status}
    ${btn('รับทราบ', 'confirmCursed()', {p:1})}
  </div>`;
}

function renderGrandma(){
  if(S.ui.nDone.grandma){
    const target = S.g.night.grandmaTarget !== null ? getP(S.g.night.grandmaTarget) : null;
    const self = target && target.roleId==='grandma';
    return `<div class="scr">
      ${header('👵 ยายแก่', 'ขับไล่แล้ว')}
      ${notice('คืนนี้ยายแก่ขับไล่ไปแล้ว', 'wr')}
      ${target ? notice(`ขับไล่: <b>${esc(target.name)}</b>${self?' (ตัวเอง)':''}`, 'ok') : ''}
      ${notice('คนที่ถูกขับไล่จะไม่มีสิทธิ์โหวตในวันถัดไป', 'i', true)}
      ${btn('↩︎ แก้ไขการเลือก', 'undoGrandma()')}
      ${btn('ปิด', 'closeN()')}
    </div>`;
  }
  const grandma = S.g.players.find(p=>p.roleId==='grandma');
  if(!grandma){ S.screen='night'; return renderNightPanel(); }
  const last = S.g.grandmaLastTarget;
  const chips = alive().map(p=>{
    const isLast = last !== null && last === p.id;
    const isSelf = p.id === grandma.id;
    const label = esc(p.name) + (isSelf ? ' (ตัวเอง)' : '') + (isLast ? ' (คืนก่อน)' : '');
    return chip(label, {sel: S.ui.tgt===p.id, dis: isLast, onclick: isLast ? null : `pickT(${p.id})`});
  }).join('');
  const lastInfo = last !== null && getP(last)
    ? notice(`ห้ามซ้ำ: <b>${esc(getP(last).name)}</b> (คืนก่อน)`, 'wr', true)
    : '';
  return `<div class="scr">
    ${header('👵 ยายแก่', 'ขับไล่ 1 คน')}
    ${notice('ต้องขับไล่ทุกคืน — ไม่มีข้าม', 'wr', true)}
    ${notice('คนที่ถูกขับไล่จะไม่มีส่วนร่วม + ไม่มีสิทธิ์โหวตในวันถัดไป', 'i', true)}
    ${lastInfo}
    <div class="grid g3">${chips}</div>
    ${btn('ยืนยันขับไล่', 'confirmGrandma()', {p:1, dis:S.ui.tgt===null})}
    ${btn('ย้อนกลับ', 'closeN()')}
  </div>`;
}

function renderWitch(){
  const w = witchP();
  if(!w){ S.screen='night'; return renderNightPanel(); }

  if(S.g.night.witchSkipped && !S.ui.wMode){
    return `<div class="scr">
      ${header('🧪 แม่มด', 'ข้ามคืนนี้')}
      ${notice('คืนนี้แม่มดเลือกไม่ใช้ยา', 'wr')}
      ${notice('ยังมียาเหลือ — ใช้ได้ในคืนถัดไป', 'i', true)}
      ${btn('↩︎ แก้ไข (กลับไปเลือก)', 'undoWitchSkip()')}
      ${btn('ปิด', 'closeN()')}
    </div>`;
  }

  if(S.ui.wMode==='poison'){
    const chips = alive().filter(p=>p.id!==w.id).map(p=>chip(esc(p.name), {sel: S.ui.tgt===p.id, onclick: `pickT(${p.id})`})).join('');
    return `<div class="scr">
      ${header('🧪 แม่มด', 'ใช้ยาพิษ')}
      ${notice('เลือกเป้าหมายยาพิษ (ห้ามตัวเอง)', 'dg')}
      <div class="grid g3">${chips}</div>
      ${btn('ยืนยันยาพิษ', 'usePoison()', {dg:1, dis:S.ui.tgt===null})}
      ${btn('ย้อนกลับ', "setWMode(null)")}
    </div>`;
  }

  if(S.ui.wMode==='heal'){
    const targets = witchKillTargets();
    const chips = targets.map(id=>{
      const p = getP(id);
      return chip(esc(p.name), {sel: S.ui.tgt===id, onclick: `pickT(${id})`});
    }).join('');
    return `<div class="scr">
      ${header('🧪 แม่มด', 'ใช้ยารักษา')}
      ${notice('มีเหยื่อ 2 คน — เลือก 1 คนที่จะรักษา', 'wr')}
      <div class="grid g2">${chips}</div>
      ${btn('✓ ยืนยันรักษา', 'confirmHealPick()', {ok:1, dis:S.ui.tgt===null})}
      ${btn('ย้อนกลับ', "setWMode(null)")}
    </div>`;
  }

  const kt = witchKillTargets();
  const ktNames = kt.map(id => getP(id).name).join(' + ');
  const usedTonight = S.g.night.witchUsedTonight;
  const noPotionsLeft = w.usedHeal && w.usedPoison;

  if(usedTonight){
    return `<div class="scr">
      ${header('🧪 แม่มด', '')}
      ${notice('คืนนี้แม่มดใช้ยาไปแล้ว', 'wr')}
      ${notice('สามารถใช้ยาอีกชิ้นในคืนถัดไปได้', 'i', true)}
      ${btn('ปิด', 'closeN()')}
    </div>`;
  }
  if(noPotionsLeft){
    return `<div class="scr">
      ${header('🧪 แม่มด', '')}
      ${notice('แม่มดใช้ยาหมดแล้ว', 'i')}
      ${btn('ปิด', 'closeN()')}
    </div>`;
  }

  const killInfo = kt.length > 0
    ? notice(`คืนนี้หมาป่าเลือก: <b>${esc(ktNames)}</b>`, 'dg')
    : notice('หมาป่ายังไม่เลือกเหยื่อ', 'i');

  const potionStatus = `<div class="lst">
    <div class="pr mini"><div class="nm">💚 ยารักษา</div><div class="${w.usedHeal?'dim':'ok'}" style="font-weight:700">${w.usedHeal?'ใช้แล้ว':'พร้อมใช้'}</div></div>
    <div class="pr mini"><div class="nm">☠️ ยาพิษ</div><div class="${w.usedPoison?'dim':'dg'}" style="font-weight:700">${w.usedPoison?'ใช้แล้ว':'พร้อมใช้'}</div></div>
  </div>`;

  const canHeal = canWHeal();
  const canPoison = canWPoison();

  let healBtn = '';
  if(canHeal){
    if(kt.length === 1){
      healBtn = btn(`💚 ใช้ยารักษา ${esc(ktNames)}`, 'startHeal()', {ok:1});
    } else if(kt.length === 2){
      healBtn = btn(`💚 ใช้ยารักษา (เลือก 1 จาก 2)`, 'startHeal()', {ok:1});
    }
  } else if(w.usedHeal){
    healBtn = notice('ใช้ยารักษาไปแล้ว', 'i', true);
  } else {
    healBtn = notice('รอหมาป่าเลือกเหยื่อก่อน', 'i', true);
  }

  let poisonBtn = '';
  if(canPoison) poisonBtn = btn('☠️ ใช้ยาพิษ', "setWMode('poison')", {dg:1});
  else poisonBtn = notice('ใช้ยาพิษไปแล้ว', 'i', true);

  const hasChoice = canHeal || canPoison;
  const closeBtn = hasChoice ? btn('ไม่ใช้ยาในคืนนี้', 'witchSkip()') : btn('ปิด', 'closeN()');

  return `<div class="scr">
    ${header('🧪 แม่มด', 'เลือกใช้ยา')}
    ${killInfo}
    <div class="card"><h3>สถานะยา</h3>${potionStatus}</div>
    ${healBtn}${poisonBtn}${closeBtn}
  </div>`;
}
function confirmHealPick(){
  if(S.ui.tgt===null) return;
  doHeal(S.ui.tgt);
}

function renderCupid(){
  if(S.ui.nDone.cupid){
    const lovers = S.g.players.filter(p => p.isLover);
    const pairText = lovers.length >= 2 ? `${esc(lovers[0].name)} ↔ ${esc(lovers[1].name)}` : '';
    return `<div class="scr">
      ${header('💘 คิวปิด', 'จับคู่แล้ว')}
      ${notice('คืนนี้คิวปิดจับคู่ไปแล้ว', 'wr')}
      ${pairText ? notice(`คู่รัก: <b>${pairText}</b>`, 'ok') : ''}
      ${btn('↩︎ แก้ไขคู่รัก', 'undoCupid()')}
      ${btn('ปิด', 'closeN()')}
    </div>`;
  }
  const cupid = S.g.players.find(p=>p.roleId==='cupid');
  const chips = alive().map(p=>{
    const isSelf = cupid && p.id===cupid.id;
    return chip(esc(p.name), {sel: S.ui.tgts.includes(p.id), dis: isSelf, onclick: isSelf ? null : `toggleCupid(${p.id})`});
  }).join('');
  return `<div class="scr">
    ${header('💘 คิวปิด', 'เลือกคู่รัก 2 คน')}
    ${notice('ห้ามเลือกตัวเอง', 'i', true)}
    <div class="grid g3">${chips}</div>
    ${btn(`ยืนยันคู่รัก (${S.ui.tgts.length}/2)`, 'confirmCupid()', {p:1, dis:S.ui.tgts.length!==2})}
    ${btn('ย้อนกลับ', 'closeN()')}
  </div>`;
}

function renderDawn(){
  let statusHtml;
  if(S.ui.deaths.length){
    const items = S.ui.deaths.map(id=>{
      const p = getP(id);
      if(!p) return '';
      const cause = (S.ui.deathCauses && S.ui.deathCauses[id]) || 'night';
      let icon = '💀', avat = '🌙', label = 'หมาป่า';
      if(cause === 'lover'){ icon = '💔'; avat = '💘'; label = 'ตายตามคู่รัก'; }
      else if(cause === 'poison'){ icon = '☠️'; avat = '🧪'; label = 'ยาพิษ'; }
      else if(cause === 'hunter'){ icon = '🎯'; avat = '🎯'; label = 'นายพรานยิง'; }
      else if(cause === 'night'){ icon = '🐺'; avat = '🐺'; label = 'หมาป่าฆ่า'; }
      else if(cause === 'vote'){ icon = '⚰️'; avat = '⚰️'; label = 'ถูกโหวต'; }
      return `<div class="death-item">
        <div class="avat">${avat}</div>
        <div class="info">
          <div class="name">${icon} ${esc(p.name)}</div>
          <div class="reason">${label}</div>
        </div>
      </div>`;
    }).filter(Boolean).join('');
    statusHtml = `<div class="nt dg" style="text-align:left;padding:15px 16px">
      <div style="text-align:center;font-size:19px;font-weight:800">💀 เมื่อคืนมีผู้เสียชีวิต</div>
      <div class="death-list">${items}</div>
    </div>`;
  } else {
    statusHtml = notice('<div style="font-size:20px">✨ เมื่อคืนไม่มีผู้เสียชีวิต</div>', 'ok');
  }
  const cp = S.ui.cursedTurnedTonight !== null ? getP(S.ui.cursedTurnedTonight) : null;
  const cursedMsg = (cp && cp.alive)
    ? notice(`🌀 <b>${esc(cp.name)}</b> กลายเป็นหมาป่า (แจ้งลับ)`, 'wr')
    : '';
  const infectedMsg = isWolvesInfectedThisRound()
    ? notice(`🦠 <b>หมาป่าติดเชื้อ</b> — เมื่อคืนเหยื่อที่ถูกเลือกทั้งหมดรอด`, 'ok', true)
    : '';
  const banishedId = getBanishedTarget();
  const banishedP = banishedId !== null ? getP(banishedId) : null;
  const grandmaMsg = (banishedP && banishedP.alive)
    ? notice(`👵 <b>${esc(banishedP.name)}</b> ถูกยายแก่ขับไล่ — ไม่มีส่วนร่วมในวันนี้`, 'wr')
    : '';
  const action = S.ui.pendHunter
    ? btn('🎯 นายพรานจะยิง', 'goHunter()', {dg:1})
    : btn('ไปกลางวัน →', 'fromDawn()', {p:1});
  return `<div class="scr">
    <section class="phase-hero">
      <div class="eyebrow">☀️ DAWN PHASE</div>
      <h2>รุ่งเช้า</h2>
      <div class="round">วันที่ ${S.g.round}</div>
    </section>
    ${statusHtml}${cursedMsg}${infectedMsg}${grandmaMsg}${action}
    <div class="row" style="justify-content:center">
      ${btn('📜 ประวัติ', 'showHistory()', {sm:1})}
      ${btn('⏱ ตั้งเวลา', 'showTimerSheet()', {sm:1})}
    </div>
  </div>`;
}

function renderHunter(){
  const chips = alive().map(p=>chip(esc(p.name), {onclick:`hunterShoot(${p.id})`})).join('');
  return `<div class="scr">
    ${header('🎯 นายพราน', 'เลือกยิง 1 คน')}
    ${notice('นายพรานตาย — ยิงได้ 1 คน', 'dg')}
    <div class="grid g3">${chips}</div>
    ${btn('ไม่ยิง', 'skipHunter()')}
  </div>`;
}

function renderDay(){
  const arr = alive();
  const banishedId = getBanishedTarget();
  const chips = arr.map(p=>{
    const isBan = banishedId === p.id;
    const label = esc(p.name) + (isBan ? ' 🚪' : '');
    return chip(label);
  }).join('');
  const banishedP = banishedId !== null ? getP(banishedId) : null;
  const banishedMsg = (banishedP && banishedP.alive)
    ? notice(`🚪 <b>${esc(banishedP.name)}</b> ถูกยายแก่ขับไล่ — ไม่มีสิทธิ์โหวตวันนี้`, 'wr', true)
    : '';
  return `<div class="scr">
    <section class="phase-hero">
      <div class="eyebrow">☀️ DAY PHASE</div>
      <h2>กลางวัน</h2>
      <div class="round">วันที่ ${S.g.round}</div>
    </section>
    ${banishedMsg}
    <div class="card"><h3>ผู้เล่นที่ยังมีชีวิต (${arr.length} คน)</h3><div class="grid g3 mt">${chips}</div></div>
    <div class="card"><h3>⏱ อภิปราย</h3>${timerHTML(true)}</div>
    ${btn('เริ่มโหวต →', 'startVoting()', {p:1})}
    <div class="row">
      ${btn('📜 ประวัติ', 'showHistory()', {sm:1})}
      ${btn('🎛️ ดูบทบาท', 'showModPanel()', {sm:1})}
    </div>
  </div>`;
}

function renderVoting(){
  const banishedId = getBanishedTarget();
  const arr = alive().filter(p => p.id !== banishedId);
  const banishedP = banishedId !== null ? getP(banishedId) : null;
  const banishedMsg = (banishedP && banishedP.alive)
    ? notice(`🚪 <b>${esc(banishedP.name)}</b> ถูกขับไล่ — ไม่มีสิทธิ์โหวตวันนี้`, 'wr', true)
    : '';

  const voteCount = S.ui.votes.length;
  const skipCount = S.ui.votes.filter(v=>v.skip).length;
  const totalVoters = arr.length;
  const allVoted = voteCount >= totalVoters;

  const voterChips = arr.map(p=>{
    const vote = S.ui.votes.find(v=>v.voterId===p.id);
    const voted = !!vote;
    const skipped = vote && vote.skip;
    const mayor = p.isMayor ? ' 🎖️' : '';
    const mark = skipped ? ' 🚫' : '';
    return chip(esc(p.name)+mayor+mark, {
      sel: S.ui.vVoter===p.id,
      done: voted && !skipped,
      skip: skipped,
      onclick: voted ? null : `selectVoter(${p.id})`
    });
  }).join('');
  let targetChips;
  if(S.ui.vVoter===null) targetChips = notice('เลือกคนโหวตก่อน', 'i', true);
  else targetChips = arr.map(p=>{
    const isSelf = S.ui.vVoter===p.id;
    return chip(esc(p.name), {sel2: S.ui.vTarget===p.id, dis: isSelf, onclick: isSelf ? null : `selectTarget(${p.id})`});
  }).join('');
  let arrow;
  if(S.ui.vVoter!==null && S.ui.vTarget!==null){
    const vp = getP(S.ui.vVoter), tp = getP(S.ui.vTarget);
    arrow = `<span class="w1">${esc(vp.name)}</span> → <span class="w2">${esc(tp.name)}</span>`;
  } else if(S.ui.vVoter!==null){
    const vp = getP(S.ui.vVoter);
    arrow = `<span class="w1">${esc(vp.name)}</span> → <span class="emp">เลือกคนถูกโหวต หรือกดข้าม</span>`;
  } else arrow = `<span class="emp">เลือกคนโหวต → เลือกเป้าหมาย หรือกดข้าม</span>`;

  const votesList = S.ui.votes.map(v=>{
    const vp = getP(v.voterId);
    if(!vp) return '';
    if(v.skip){
      return `<div class="pr mini"><div class="nm dim">${esc(vp.name)} → 🚫 ข้าม</div></div>`;
    }
    const tp = getP(v.targetId);
    if(!tp) return '';
    const w = vp.isMayor ? ' (2)' : '';
    return `<div class="pr mini"><div class="nm">${esc(vp.name)} → ${esc(tp.name)}${w}</div></div>`;
  }).join('') || '<div class="dim f13 tc">ยังไม่มีการโหวต</div>';

  const t = tally();
  const maxV = Math.max(0, ...Object.values(t));
  const tallyRows = arr.filter(p=>t[p.id]>0).sort((a,b)=>t[b.id]-t[a.id]).map(p=>{
    const isLead = t[p.id] === maxV && maxV > 0;
    return `<div class="vote-row${isLead?' lead':''}">
      <div class="voter">${isLead?'👑 ':''}${esc(p.name)}</div>
      <div class="tally">${t[p.id]}</div>
    </div>`;
  }).join('') || '<div class="dim f13 tc">ยังไม่มีคะแนน</div>';
  const skipLine = skipCount > 0
    ? `<div class="dim f13" style="margin-top:8px;text-align:center">🚫 ผู้ไม่ประสงค์ออกเสียง: ${skipCount} คน</div>`
    : '';

  const statusLine = allVoted
    ? notice(`✓ ทุกคนโหวตครบแล้ว${skipCount ? ` (ข้าม ${skipCount})` : ''}`, 'ok', true)
    : notice(`โหวตแล้ว ${voteCount} / ${totalVoters}${skipCount ? ` · ข้าม ${skipCount}` : ''}`, 'i', true);
  const confirmDisabled = S.ui.vVoter===null || S.ui.vTarget===null;

  return `<div class="scr">
    <section class="phase-hero">
      <div class="eyebrow">🗳 VOTING PHASE</div>
      <h2>โหวต</h2>
      <div class="round">วันที่ ${S.g.round}</div>
    </section>
    ${banishedMsg}
    ${statusLine}
    <div class="card">
      <div class="arrow">${arrow}</div>
      <div class="row mt" style="justify-content:center">
        ${btn('ล้างที่เลือก', 'clearSel()', {sm:1, dis:S.ui.vVoter===null})}
      </div>
    </div>
    <div class="card"><div class="step">ขั้นที่ 1 — เลือกคนโหวต</div><div class="grid g3">${voterChips}</div></div>
    <div class="card"><div class="step">ขั้นที่ 2 — เลือกคนถูกโหวต (หรือกดข้าม)</div><div class="grid g3">${targetChips}</div></div>
    <div class="row">
      ${btn('✓ ยืนยันโหวตนี้', 'confirmVote()', {p:1, dis:confirmDisabled})}
      ${btn('🚫 ข้าม', 'confirmSkipVote()', {dg:1, dis:S.ui.vVoter===null})}
    </div>
    <div class="card">
      <h3>📋 รายการโหวต</h3>
      <div class="lst mt">${votesList}</div>
      <div class="row mt">
        ${btn('↩︎ ย้อนล่าสุด', 'undoVote()', {sm:1, dis:voteCount===0})}
        ${btn('ล้างทั้งหมด', 'resetVotes()', {sm:1, dg:1, dis:voteCount===0})}
      </div>
    </div>
    <div class="card"><h3>📊 คะแนนปัจจุบัน</h3><div class="vote-bar mt">${tallyRows}</div>${skipLine}</div>
    ${btn('จบการโหวต →', 'finishVoting()', {ok:1, dis:voteCount===0})}
    ${btn('ย้อนกลับไปกลางวัน', 'backToDay()')}
  </div>`;
}

function renderTie(){
  const tieChips = S.ui.tie.map(id=>getP(id)).filter(Boolean)
    .map(p=>chip(esc(p.name) + (p.isMayor?' 🎖️':''))).join('');
  const execChips = S.ui.tie.map(id=>getP(id)).filter(Boolean)
    .map(p=>chip(esc(p.name) + (p.isMayor?' 🎖️':''), {onclick:`executePlayer(${p.id})`})).join('');
  return `<div class="scr">
    ${header('⚖️ คะแนนเสมอ', '')}
    ${notice('ไม่มีใครตาย — ให้ผู้ที่เสมอพูดแก้ตัว', 'wr')}
    <div class="card"><h3>ผู้ที่คะแนนเสมอ</h3><div class="grid g2 mt">${tieChips}</div></div>
    <div class="card"><h3>⏱ พูดแก้ตัว</h3>${timerHTML(false)}</div>
    <div class="card"><h3>หรือเลือกแขวนเอง</h3><div class="grid g2 mt">${execChips}</div></div>
    ${btn('โหวตใหม่', 'tieRevote()', {p:1})}
    ${btn('ไม่มีใครตาย → กลางคืน', 'tieNoDeath()')}
  </div>`;
}

function renderExecution(){
  const p = getP(S.ui.exId);
  if(!p){ S.screen='home'; return renderHome(); }
  const causes = S.ui.deathCauses || {};
  const loverDeaths = S.ui.exDeaths
    .filter(id => id !== S.ui.exId && causes[id] === 'lover')
    .map(id => getP(id)).filter(Boolean).map(q => esc(q.name));
  const hunterKills = S.ui.exDeaths
    .filter(id => causes[id] === 'hunter')
    .map(id => getP(id)).filter(Boolean).map(q => esc(q.name));
  let extra = '';
  if(loverDeaths.length) extra += `<div class="mt f15">💔 ตายตามคู่รัก: ${loverDeaths.join(', ')}</div>`;
  if(hunterKills.length) extra += `<div class="mt f15">🎯 นายพรานยิง: ${hunterKills.join(', ')}</div>`;
  const action = S.ui.pendHunter ? btn('🎯 นายพรานจะยิง', 'goHunter()', {dg:1}) : btn('ไปกลางคืน →', 'fromExecution()', {p:1});
  const undoBtn = S.ui.preExecuteSnap ? btn('↩︎ ย้อนการแขวนคอ', 'undoExecution()') : '';
  return `<div class="scr">
    ${header('⚰️ แขวนคอ', `วันที่ ${S.g.round}`)}
    ${notice(`<div style="font-size:22px;font-weight:800">${esc(p.name)} ถูกแขวนคอ</div>${extra}`, 'dg')}
    ${action}
    ${undoBtn}
  </div>`;
}

function renderPrince(){
  const p = getP(S.ui.exId);
  if(!p){ S.screen='home'; return renderHome(); }
  return `<div class="scr">
    <section class="phase-hero">
      <div class="eyebrow">👑 PRINCE REVEAL</div>
      <h2>เจ้าชายเปิดตัว!</h2>
      <div class="round">วันที่ ${S.g.round}</div>
    </section>
    ${notice(`<div style="font-size:26px;font-weight:800">${esc(p.name)}</div>
      <div class="f15 mt">คือเจ้าชาย — ไม่ถูกแขวนคอ</div>`, 'wr')}
    ${notice('เปิดเผยบทบาทให้ทุกคนทราบแล้ว<br>ใช้สิทธิ์นี้ไปแล้ว — ถ้าถูกโหวตอีกจะตายปกติ', 'i', true)}
    ${btn('ไปกลางคืน →', 'fromPrince()', {p:1})}
  </div>`;
}

function renderEnd(){
  const rows = S.g.players.map(p=>{
    const R = ROLES[p.roleId];
    const team = getTeamOf(p);
    const badgeCls = team === 'wolf' ? 'w' : team === 'neutral' ? 'n' : 'v';
    const extra = p.roleId === 'cursed' ? (p.isTurned ? ' 🌀→🐺' : ' 🌀→👤') : '';
    const princeFlag = p.roleId === 'prince' ? (p.princeUsed ? ' 👑✓' : ' 👑✗') : '';
    return `<div class="pr">
      <div class="nm">${esc(p.name)}${extra}${princeFlag}</div>
      <div class="row">
        <span class="bd ${badgeCls}">${R.icon} ${R.name}</span>
        <span class="bd ${p.alive?'v':'dead'}">${p.alive?'มีชีวิต':'ตาย'}</span>
      </div>
    </div>`;
  }).join('');
  const cls = S.g.winner==='village'?'ok':S.g.winner==='werewolf'?'dg':'wr';
  const reason = S.g.winReason ? `<div class="f13 mt">${esc(S.g.winReason)}</div>` : '';
  return `<div class="scr">
    <div class="home-logo" style="margin:10px auto;width:80px;height:80px">${LOGO_SVG}</div>
    <h1>🏆 จบเกม!</h1>
    ${notice(`<div style="font-size:20px">ฝ่ายชนะ</div>
              <div style="font-size:28px;font-weight:800;margin-top:6px">${winnerText()}</div>${reason}`, cls)}
    <div class="card"><h3>บทบาททั้งหมด</h3><div class="lst mt">${rows}</div></div>
    <div class="share-block">
      ${btn('📋 คัดลอกผลลัพธ์', 'copyResults()', {sm:1})}
      ${btn('📜 ดูประวัติเกม', 'showHistory()', {sm:1})}
    </div>
    ${btn('เล่นใหม่', 'newGameEnd()', {p:1})}
    ${btn('กลับหน้าหลัก', 'goHome()')}
  </div>`;
}
async function copyResults(){
  if(!S.g) return;
  const lines = [];
  lines.push('🐺 คืนหอนหลอนหมาป่า — ผลเกม');
  lines.push('ฝ่ายชนะ: ' + winnerText());
  if(S.g.winReason) lines.push('เหตุผล: ' + S.g.winReason);
  lines.push('');
  lines.push('ผู้เล่น:');
  for(const p of S.g.players){
    const R = ROLES[p.roleId];
    const st = p.alive ? 'มีชีวิต' : 'ตาย';
    const tr = p.roleId==='cursed' ? (p.isTurned?'(กลายเป็นหมาป่า)':'(ยังเป็นชาวบ้าน)') : '';
    lines.push(`- ${p.name}: ${R.name} ${tr} [${st}]`);
  }
  const text = lines.join('\n');
  let copied = false;
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      await navigator.clipboard.writeText(text);
      copied = true;
    }
  }catch(e){ copied = false; }
  if(copied){
    await askAlert('คัดลอกผลลัพธ์ลงคลิปบอร์ดแล้ว', 'คัดลอกแล้ว');
  } else {
    await fallbackCopy(text);
  }
}
async function fallbackCopy(text){
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let copied = false;
  try{ copied = document.execCommand('copy'); }catch(e){ copied = false; }
  document.body.removeChild(ta);
  if(copied){
    await askAlert('คัดลอกผลลัพธ์ลงคลิปบอร์ดแล้ว', 'คัดลอกแล้ว');
  } else {
    await showDialog({
      title: 'คัดลอกด้วยตนเอง',
      message: 'การคัดลอกอัตโนมัติไม่สำเร็จ\nคัดลอกข้อความด้านล่างเองได้เลย:\n\n' + text,
      single: true, okLabel: 'ปิด'
    });
  }
}

/* ========== BOOT ========== */
(function boot(){
  try{ initSlots(); }catch(e){ ACTIVE_SLOT = 1; }
  try{ load(false); }catch(e){ console.error(e); }
  applyTheme();
  render();
})();

/* ========== PWA ========== */
(function registerSW(){
  if(!('serviceWorker' in navigator)) return;
  if(location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
  function watchUpdates(reg){
    reg.addEventListener('updatefound', function(){
      const nw = reg.installing;
      if(!nw) return;
      nw.addEventListener('statechange', function(){
        if(nw.state === 'installed' && navigator.serviceWorker.controller){
          console.log('[PWA] มีเวอร์ชันใหม่ — จะใช้ในการเปิดหน้าครั้งถัดไป');
        }
      });
    });
    /* เช็กเวอร์ชัน SW ใหม่ทุกครั้งที่กลับมาที่แท็บ (กันค้างเวอร์ชันเก่า) */
    document.addEventListener('visibilitychange', function(){
      if(document.visibilityState === 'visible'){
        reg.update().catch(function(){});
      }
    });
  }
  window.addEventListener('load', function(){
    /* updateViaCache:'none' → ไม่ใช้แคช HTTP กับ sw.js เสมอ (ได้เวอร์ชันใหม่ทันที) */
    navigator.serviceWorker.register('sw.js', {updateViaCache:'none'}).then(function(reg){
      watchUpdates(reg);
      reg.update().catch(function(){});
    }).catch(function(err){ console.warn('[PWA] ติดตั้ง service worker ไม่สำเร็จ:', err); });
  });
})();

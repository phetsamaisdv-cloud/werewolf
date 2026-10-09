import '../game-logic.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const GL = globalThis.GameLogic;
const ROLES = {
  werewolf: {faction: 'wolf', bp: -6},
  wolfcub: {faction: 'wolf', bp: -5},
  minion: {faction: 'wolf', bp: -4},
  sorceress: {faction: 'wolf', bp: -4},
  lone_wolf: {faction: 'wolf', bp: -5},
  villager: {faction: 'village', bp: 1},
  seer: {faction: 'village', bp: 7},
  witch: {faction: 'village', bp: 7},
  hunter: {faction: 'village', bp: 6},
  bodyguard: {faction: 'village', bp: 6},
  priest: {faction: 'village', bp: 6},
  tough_guy: {faction: 'village', bp: 5},
  infected: {faction: 'village', bp: 4},
  ghost: {faction: 'village', bp: 3},
  grandma: {faction: 'village', bp: 4},
  cupid: {faction: 'village', bp: 5},
  cursed: {faction: 'village', bp: -3},
  tanner: {faction: 'neutral', bp: -4},
  cult_leader: {faction: 'neutral', bp: -4},
  vampire: {faction: 'neutral', bp: -4},
  hoodlum: {faction: 'neutral', bp: -4}
};
const SPECIAL = [
  'werewolf',
  'wolfcub',
  'minion',
  'sorceress',
  'lone_wolf',
  'villager',
  'seer',
  'witch',
  'hunter',
  'bodyguard',
  'priest',
  'tough_guy',
  'infected',
  'ghost',
  'grandma',
  'cupid',
  'cursed',
  'tanner',
  'cult_leader',
  'vampire',
  'hoodlum'
];
const mk = (id, roleId, alive, extra) => Object.assign({id, roleId, alive, name: 'P' + id}, extra || {});
const ctxFor = (n, roles) => {
  const zeroed = {};
  for (const s of SPECIAL) zeroed[s] = 0;
  Object.assign(zeroed, roles);
  return {setup: {n, roles: zeroed}, roles: ROLES, special: SPECIAL};
};

test('checkWin: หมาป่าเท่าชาวบ้าน → หมาป่าชนะ (parity)', () => {
  const r = GL.checkWin([mk(1, 'werewolf', true), mk(2, 'villager', false), mk(3, 'seer', true)], {roles: ROLES});
  assert.equal(r && r.winner, 'werewolf');
});
test('checkWin: หมาป่าตายหมด → ชาวบ้านชนะ', () => {
  const r = GL.checkWin([mk(1, 'werewolf', false), mk(2, 'villager', true)], {roles: ROLES});
  assert.equal(r && r.winner, 'village');
});
test('checkWin: ตายหมดทุกคน (หมาป่าหมด) → ชาวบ้านชนะ', () => {
  const r = GL.checkWin([mk(1, 'werewolf', false), mk(2, 'villager', false)], {roles: ROLES});
  assert.equal(r && r.winner, 'village');
});
test('checkWin: คู่รักต่างฝ่ายเหลือ 2 คนสุดท้าย → lovers', () => {
  const r = GL.checkWin([mk(1, 'werewolf', true, {isLover: true}), mk(2, 'seer', true, {isLover: true})], {roles: ROLES});
  assert.equal(r && r.winner, 'lovers');
});
test('checkWin: ทุกคนอยู่ในลัทธิครบ → cult', () => {
  const r = GL.checkWin([mk(1, 'cult_leader', true), mk(2, 'villager', true, {cult: true}), mk(3, 'werewolf', true, {cult: true})], {roles: ROLES});
  assert.equal(r && r.winner, 'cult');
});
test('checkWin: ลัทธิยังไม่ครบ → ยังไม่มีผู้ชนะ', () => {
  const r = GL.checkWin([mk(1, 'cult_leader', true), mk(2, 'villager', true), mk(3, 'werewolf', true)], {roles: ROLES});
  assert.equal(r, null);
});
test('checkWin: นักเลง — เป้าหมาย 2 คนตาย + ตัวเองรอด → hoodlum', () => {
  const r = GL.checkWin([mk(1, 'hoodlum', true), mk(2, 'villager', false), mk(3, 'werewolf', false)], {roles: ROLES, hoodlumTargets: [2, 3]});
  assert.equal(r && r.winner, 'hoodlum');
});
test('checkWin: นักเลง — ตัวเองตาย → ไม่ชนะ', () => {
  const r = GL.checkWin([mk(1, 'hoodlum', false), mk(2, 'villager', false), mk(3, 'werewolf', true)], {roles: ROLES, hoodlumTargets: [2, 3]});
  assert.notEqual(r && r.winner, 'hoodlum');
});
test('checkWin: หมาป่าเดียวดายเหลือคนสุดท้าย → lonewolf', () => {
  const r = GL.checkWin([mk(1, 'lone_wolf', true), mk(2, 'villager', false)], {roles: ROLES});
  assert.equal(r && r.winner, 'lonewolf');
});
test('checkWin: แวมไพร์เหลือคนสุดท้าย → vampire', () => {
  const r = GL.checkWin([mk(1, 'vampire', true), mk(2, 'werewolf', false)], {roles: ROLES});
  assert.equal(r && r.winner, 'vampire');
});
test('checkWin: หมาป่าเดียวดายดวลชาวบ้าน → parity ถูกกด ยังไม่จบ', () => {
  const r = GL.checkWin([mk(1, 'lone_wolf', true), mk(2, 'villager', true)], {roles: ROLES});
  assert.equal(r, null);
});
test('checkWin: ผู้ต้องคำสาปยังไม่ถูกกัด → นับเป็นชาวบ้าน (ไม่ใช่หมาป่า)', () => {
  const r = GL.checkWin([mk(1, 'werewolf', true), mk(2, 'cursed', true), mk(3, 'villager', true)], {roles: ROLES});
  assert.equal(r, null);
});
test('checkWin: ผู้ต้องคำสาปกลายร่างแล้ว → นับเป็นหมาป่า', () => {
  const r = GL.checkWin([mk(1, 'werewolf', true), mk(2, 'cursed', true, {isTurned: true}), mk(3, 'villager', true)], {roles: ROLES});
  assert.equal(r && r.winner, 'werewolf');
});

test('tally: นับเสียงปกติ + นายก x2 + skip ไม่นับ', () => {
  const players = [mk(1, 'villager', true), mk(2, 'villager', true, {isMayor: true}), mk(3, 'villager', true), mk(4, 'werewolf', true)];
  const t = GL.tally(players, [
    {voterId: 3, targetId: 1},
    {voterId: 4, targetId: 1},
    {voterId: 2, targetId: 3},
    {voterId: 1, skip: true}
  ]);
  assert.equal(t[1], 2);
  assert.equal(t[3], 2);
  assert.equal(t[4], 0);
});
test('tally: ผู้เล่นตายถูก seed = 0', () => {
  const players = [mk(1, 'villager', true), mk(2, 'villager', false)];
  const t = GL.tally(players, [{voterId: 1, targetId: 2}]);
  assert.equal(t[2], 1);
});

test('balance: villagerCount = n - special', () => {
  assert.equal(GL.villagerCount(ctxFor(6, {werewolf: 1, seer: 1})), 4);
  assert.equal(GL.totalRoles(ctxFor(6, {werewolf: 1, seer: 1})), 2);
});
test('balance: wolfFactionCount นับเฉพาะฝ่ายหมาป่า + cursed ไม่นับจนกว่าจะกัด', () => {
  assert.equal(GL.wolfFactionCount(ctxFor(8, {werewolf: 2, minion: 1, cursed: 1})), 3);
  assert.equal(GL.wolfFactionCount(ctxFor(8, {lone_wolf: 1, villager: 4})), 1);
});
test('balance: instantParityWin — หมาป่า ≥ ชาวบ้าน', () => {
  assert.equal(GL.instantParityWin(ctxFor(4, {werewolf: 2, villager: 1})), true);
  assert.equal(GL.instantParityWin(ctxFor(6, {werewolf: 1, villager: 4})), false);
});
test('balance: instantParityWin — มีหมาป่าเดียวดายแล้วบล็อก parity', () => {
  assert.equal(GL.instantParityWin(ctxFor(4, {werewolf: 2, lone_wolf: 1})), false);
});
test('balance: balanceWarnings — ไม่มีหมาป่า / parity ทันที / คำแนะนำ', () => {
  const noWolf = GL.balanceWarnings(ctxFor(8, {seer: 1, villager: 5}));
  assert.ok(noWolf.some(m => m.indexOf('ไม่มีหมาป่า') >= 0));
  const parity = GL.balanceWarnings(ctxFor(4, {werewolf: 2, villager: 1}));
  assert.ok(parity.some(m => m.indexOf('ชนะทันที') >= 0));
  const hints = GL.balanceWarnings(ctxFor(12, {werewolf: 1, villager: 6}));
  assert.ok(hints.some(m => m.indexOf('แนะนำหมาป่า 2-3') >= 0));
  const few = GL.balanceWarnings(ctxFor(5, {werewolf: 1, tanner: 1, villager: 2}));
  assert.ok(few.some(m => m.indexOf('แนะนำผู้เล่น 6 คน') >= 0));
});
test('balance: balanceWarnings — ลูกหมาป่าไม่มีหมาป่าคู่ + นับลูกหมาป่าเป็นหมาป่า', () => {
  const msgs = GL.balanceWarnings(ctxFor(6, {wolfcub: 1, villager: 3}));
  assert.ok(msgs.some(m => m.indexOf('ควรมีหมาป่าอย่างน้อย 1 ตัว') >= 0));
  const parity = GL.balanceWarnings(ctxFor(4, {werewolf: 1, wolfcub: 1, villager: 1}));
  assert.ok(parity.some(m => m.indexOf('ชนะทันที') >= 0));
});
test('balance: balanceScore = villager*1 + Σ bp*จำนวน', () => {
  assert.equal(GL.balanceScore(ctxFor(6, {werewolf: 1, seer: 1})), 4 + -6 + 7);
  assert.equal(GL.balanceScore(ctxFor(5, {villager: 3, werewolf: 1})), 4 + -6);
});

/* ---------- applyNightResolution (fake deps) ---------- */
function makeG(players, night, round) {
  return {
    round: round || 1,
    players: players,
    wolvesInfectedRound: null,
    wolfCubBonusUsed: false,
    ghostWord: 'HELP',
    ghostRevealed: 0,
    night: Object.assign(
      {
        killTarget: null,
        killTarget2: null,
        wolfCubBonusActive: false,
        bodyguardTarget: null,
        priestTarget: null,
        savedByWitch: false,
        savedByWitchTarget: null,
        biteTarget: null,
        poisonTarget: null,
        grandmaTarget: null
      },
      night || {}
    )
  };
}
function makeDeps(g) {
  const state = {killed: [], logs: [], marked: null};
  const deps = {
    killP: (id, cause) => {
      const p = g.players.find(x => x.id === id);
      if (p && p.alive) {
        p.alive = false;
        p.deathCause = cause;
        state.killed.push({id, cause});
        return [id];
      }
      return [];
    },
    addLog: (type, msg) => state.logs.push({type, msg}),
    markWolfCubDead: deaths => {
      state.marked = deaths.slice();
    }
  };
  return {deps, state};
}
test('applyNightResolution: หมาป่ากัดชาวบ้าน → ตายจริง', () => {
  const g = makeG([mk(1, 'werewolf', true), mk(2, 'villager', true)], {killTarget: 2});
  const ui = {};
  const {deps, state} = makeDeps(g);
  const r = GL.applyNightResolution(g, ui, deps);
  assert.deepEqual(r.deaths, [2]);
  assert.equal(state.killed.length, 1);
  assert.equal(g.players[1].alive, false);
  assert.equal(ui.deaths[0], 2);
  assert.equal(ui.pendHunter, null);
});
test('applyNightResolution: บอดี้การ์ดคุ้มกัน → เหยื่อรอด', () => {
  const g = makeG([mk(1, 'werewolf', true), mk(2, 'villager', true), mk(3, 'bodyguard', true)], {killTarget: 2, bodyguardTarget: 2});
  const {deps, state} = makeDeps(g);
  const r = GL.applyNightResolution(g, {}, deps);
  assert.deepEqual(r.deaths, []);
  assert.equal(state.killed.length, 0);
});
test('applyNightResolution: แม่มดยารักษา → เหยื่อรอด', () => {
  const g = makeG([mk(1, 'werewolf', true), mk(2, 'villager', true)], {killTarget: 2, savedByWitch: true, savedByWitchTarget: 2});
  const {deps, state} = makeDeps(g);
  const r = GL.applyNightResolution(g, {}, deps);
  assert.deepEqual(r.deaths, []);
  assert.equal(state.killed.length, 0);
});
test('applyNightResolution: ผู้ต้องคำสาปถูกกัด → กลายร่างไม่ตาย', () => {
  const g = makeG([mk(1, 'werewolf', true), mk(2, 'cursed', true)], {killTarget: 2});
  const {deps, state} = makeDeps(g);
  const r = GL.applyNightResolution(g, {}, deps);
  assert.deepEqual(r.cursedTurned, [2]);
  assert.equal(g.players[1].isTurned, true);
  assert.equal(g.players[1].alive, true);
  assert.equal(state.killed.length, 0);
});
test('applyNightResolution: ถูกกัด + วางยาพร้อม → ตายด้วยยาพิษ', () => {
  const g = makeG([mk(1, 'werewolf', true), mk(2, 'cursed', true), mk(3, 'witch', true)], {killTarget: 2, poisonTarget: 2});
  const ui = {};
  const {deps, state} = makeDeps(g);
  const r = GL.applyNightResolution(g, ui, deps);
  assert.deepEqual(r.cursedTurned, [2]);
  assert.ok(r.deaths.includes(2));
  const rec = state.killed.find(x => x.id === 2);
  assert.equal(rec.cause, 'poison');
});
test('applyNightResolution: นักเลงทนทาน → บาดเจ็บแล้วตายคืนถัดไป', () => {
  const g = makeG([mk(1, 'werewolf', true), mk(2, 'tough_guy', true)], {killTarget: 2});
  const {deps} = makeDeps(g);
  const r = GL.applyNightResolution(g, {}, deps);
  assert.deepEqual(r.deaths, []);
  assert.equal(g.players[1].wounded, true);
  assert.equal(g.players[1].woundRound, 2);
  const g2 = makeG(g.players, {}, 2);
  const d2 = makeDeps(g2);
  const r2 = GL.applyNightResolution(g2, {}, d2.deps);
  assert.deepEqual(r2.deaths, [2]);
  assert.equal(d2.state.killed[0].cause, 'wound');
});
test('applyNightResolution: ผู้ป่วยติดเชื้อ → ทำให้หมาป่าติดเชื้อ คืนถัดไปเหยื่อรอด', () => {
  const g = makeG([mk(1, 'werewolf', true), mk(2, 'infected', true), mk(3, 'villager', true)], {killTarget: 2});
  const {deps} = makeDeps(g);
  const r = GL.applyNightResolution(g, {}, deps);
  assert.ok(r.deaths.includes(2));
  assert.equal(g.wolvesInfectedRound, 2);
  const g2 = makeG([mk(1, 'werewolf', true), mk(2, 'infected', false), mk(3, 'villager', true)], {killTarget: 3}, 2);
  g2.wolvesInfectedRound = 2;
  const d2 = makeDeps(g2);
  const r2 = GL.applyNightResolution(g2, {}, d2.deps);
  assert.deepEqual(r2.deaths, []);
  assert.ok(d2.state.logs.some(l => l.msg.indexOf('รอดทุกคน') >= 0));
});
test('applyNightResolution: เหยื่อแวมไพร์ → ตายวันรุ่งขึ้น', () => {
  const g = makeG([mk(1, 'vampire', true), mk(2, 'villager', true)], {biteTarget: 2});
  const {deps} = makeDeps(g);
  const r = GL.applyNightResolution(g, {}, deps);
  assert.deepEqual(r.deaths, []);
  assert.equal(g.players[1].bitten, true);
  assert.equal(g.players[1].biteRound, 2);
  const g2 = makeG(g.players, {}, 2);
  const d2 = makeDeps(g2);
  const r2 = GL.applyNightResolution(g2, {}, d2.deps);
  assert.deepEqual(r2.deaths, [2]);
  assert.equal(d2.state.killed[0].cause, 'bite');
});
test('applyNightResolution: แวมไพร์ถูกหมาป่ากัด → ไม่ตาย', () => {
  const g = makeG([mk(1, 'werewolf', true), mk(2, 'vampire', true)], {killTarget: 2});
  const {deps, state} = makeDeps(g);
  const r = GL.applyNightResolution(g, {}, deps);
  assert.deepEqual(r.deaths, []);
  assert.equal(state.killed.length, 0);
  assert.ok(state.logs.some(l => l.msg.indexOf('ไม่ตายจากการกัด') >= 0));
});
test('applyNightResolution: ผีตายคืนแรก + ส่งเบาะแส 1 ตัวอักษร', () => {
  const g = makeG([mk(1, 'villager', true), mk(2, 'ghost', true)], {});
  const ui = {};
  const {deps} = makeDeps(g);
  const r = GL.applyNightResolution(g, ui, deps);
  assert.deepEqual(r.deaths, [2]);
  assert.equal(ui.deathCauses ? ui.deathCauses[2] : g.players[1].deathCause, 'ghost');
  assert.equal(g.ghostRevealed, 1);
  const g2 = makeG(g.players, {}, 2);
  g2.ghostRevealed = g.ghostRevealed;
  const {deps: d2, state: s2} = makeDeps(g2);
  GL.applyNightResolution(g2, {}, d2);
  assert.equal(g2.ghostRevealed, 2);
  assert.ok(s2.logs.some(l => l.msg.indexOf('เบาะแส') >= 0));
});
test('applyNightResolution: หมาป่าตาย → markWolfCubDead ได้รับ deaths', () => {
  const g = makeG([mk(1, 'werewolf', true), mk(2, 'wolfcub', false), mk(3, 'villager', true)], {});
  const {deps, state} = makeDeps(g);
  GL.applyNightResolution(g, {}, deps);
  assert.ok(Array.isArray(state.marked));
});
test('applyNightResolution: นายพรานตาย → pendHunter ตั้งค่า', () => {
  const g = makeG([mk(1, 'werewolf', true), mk(2, 'hunter', true)], {killTarget: 2});
  const ui = {};
  const {deps} = makeDeps(g);
  GL.applyNightResolution(g, ui, deps);
  assert.ok(ui.pendHunter);
  assert.equal(ui.pendHunter.hunterId, 2);
  assert.equal(ui.pendHunter.context, 'dawn');
});
test('applyNightResolution: นายพรานยิงไปแล้ว → ไม่มี pendHunter', () => {
  const g = makeG([mk(1, 'werewolf', true), mk(2, 'hunter', true, {usedHunterShot: true})], {killTarget: 2});
  const ui = {};
  const {deps} = makeDeps(g);
  GL.applyNightResolution(g, ui, deps);
  assert.equal(ui.pendHunter, null);
});
test('applyNightResolution: ลูกหมาป่าตาย (wolfCubBonusActive) → เหยื่อที่ 2 ตายด้วย', () => {
  const g = makeG([mk(1, 'werewolf', true), mk(2, 'villager', true), mk(3, 'seer', true)], {killTarget: 2, killTarget2: 3, wolfCubBonusActive: true});
  const {deps} = makeDeps(g);
  const r = GL.applyNightResolution(g, {}, deps);
  assert.deepEqual(r.deaths, [2, 3]);
});
test('applyNightResolution: ยายแก่ตายก่อนรุ่งเช้า → คำสั่งขับไล่ยังมีผล', () => {
  const g = makeG([mk(1, 'werewolf', true), mk(2, 'grandma', true), mk(3, 'villager', true)], {poisonTarget: 2, grandmaTarget: 3});
  const {deps, state} = makeDeps(g);
  GL.applyNightResolution(g, {}, deps);
  assert.ok(state.logs.some(l => l.msg.indexOf('คำสั่งขับไล่') >= 0));
});

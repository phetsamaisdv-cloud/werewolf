'use strict';
/* ============================================================
   game-logic.js — ตรรกะเกมล้วน (pure logic)
   ไม่แตะ DOM / localStorage / timer — รันได้ทั้งในเบราว์เซอร์
   (โหลดก่อน app.js ผ่าน <script>) และใน Node (test/logic.test.mjs)
   ทุกฟังก์ชันรับ state เป็นพารามิเตอร์ ไม่พึ่ง global ของแอป
   ============================================================ */
(function (root, factory) {
  const api = factory();
  root.GameLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  /* ---------- ฝ่าย/ทีม ---------- */
  function isWolfTeam(p, roles) {
    if (!p) return false;
    if (p.roleId === 'cursed') return p.isTurned === true;
    return roles[p.roleId] && roles[p.roleId].faction === 'wolf';
  }
  function getTeamOf(p, roles) {
    if (!p) return 'village';
    if (p.roleId === 'cursed') return p.isTurned ? 'wolf' : 'village';
    return roles[p.roleId] ? roles[p.roleId].faction : 'village';
  }

  /* ---------- ตรวจชนะ (ย้ายจาก app.js checkWin — logic เดิมเป๊ะ) ---------- */
  function checkWin(players, opts) {
    const roles = (opts && opts.roles) || {};
    const hoodlumTargets = (opts && opts.hoodlumTargets) || null;
    const getP = id => players.find(p => p.id === id);
    const arr = players.filter(p => p.alive);
    const wolves = arr.filter(p => isWolfTeam(p, roles));
    const villagers = arr.filter(p => !isWolfTeam(p, roles));
    const lovers = arr.filter(p => p.isLover);
    if (arr.length === 2 && lovers.length === 2) {
      const g1 = getTeamOf(lovers[0], roles);
      const g2 = getTeamOf(lovers[1], roles);
      if (g1 !== g2) return {winner: 'lovers', reason: 'คู่รักต่างฝ่ายเหลือ 2 คนสุดท้าย'};
    }
    const cultLeader = players.find(p => p.roleId === 'cult_leader');
    if (cultLeader && cultLeader.alive && arr.every(p => p.cult || p.roleId === 'cult_leader')) {
      return {winner: 'cult', reason: 'ทุกคนอยู่ในลัทธิครบแล้ว'};
    }
    const hoodlum = arr.find(p => p.roleId === 'hoodlum');
    if (hoodlum && hoodlumTargets && hoodlumTargets.length === 2) {
      const bothDead = hoodlumTargets.every(id => {
        const t = getP(id);
        return t && !t.alive;
      });
      if (bothDead) return {winner: 'hoodlum', reason: 'นักเลง: เป้าหมายทั้ง 2 ตาย และตัวเองยังรอด'};
    }
    if (arr.length === 1) {
      if (arr[0].roleId === 'lone_wolf') return {winner: 'lonewolf', reason: 'หมาป่าเดียวดายเหลือรอดคนสุดท้าย'};
      if (arr[0].roleId === 'vampire') return {winner: 'vampire', reason: 'แวมไพร์เป็นผู้รอดคนสุดท้าย'};
    }
    if (wolves.length === 0) return {winner: 'village', reason: 'หมาป่าตายหมด'};
    const loneAlive = arr.some(p => p.roleId === 'lone_wolf');
    if (wolves.length >= villagers.length) {
      if (loneAlive && villagers.length > 0) return null;
      return {winner: 'werewolf', reason: 'หมาป่าเท่าหรือมากกว่าชาวบ้าน'};
    }
    return null;
  }

  /* ---------- นับคะแนนโหวต (นายก x2 — ย้ายจาก app.js tally) ---------- */
  function tally(players, votes) {
    const getP = id => players.find(p => p.id === id);
    const t = {};
    for (const p of players) {
      if (p.alive) t[p.id] = 0;
    }
    for (const v of votes || []) {
      if (v.skip) continue;
      const voter = getP(v.voterId);
      const w = voter && voter.isMayor ? 2 : 1;
      t[v.targetId] = (t[v.targetId] || 0) + w;
    }
    return t;
  }

  /* ---------- สมดุลบทบาท (ctx = {setup, roles, special}) ---------- */
  function totalRoles(ctx) {
    return ctx.special.reduce((s, r) => s + (ctx.setup.roles[r] || 0), 0);
  }
  function villagerCount(ctx) {
    return ctx.setup.n - totalRoles(ctx);
  }
  function wolfFactionCount(ctx) {
    let c = 0;
    for (const r of ctx.special) {
      const n = ctx.setup.roles[r] || 0;
      if (n > 0 && ctx.roles[r] && ctx.roles[r].faction === 'wolf') c += n;
    }
    return c;
  }
  function instantParityWin(ctx) {
    const wf = wolfFactionCount(ctx);
    const v = ctx.setup.n - wf;
    if (wf < v) return false;
    const hasLone = (ctx.setup.roles.lone_wolf || 0) > 0;
    return !(hasLone && v > 0);
  }
  function balanceWarnings(ctx) {
    const setup = ctx.setup;
    const msgs = [];
    const w = (setup.roles.werewolf || 0) + (setup.roles.wolfcub || 0);
    const wf = wolfFactionCount(ctx);
    const cursed = setup.roles.cursed;
    const infected = setup.roles.infected;
    const v = setup.n - wf;
    if (w === 0) msgs.push('⚠ ไม่มีหมาป่าในเกม → เริ่มเกมไม่ได้');
    else if (instantParityWin(ctx)) msgs.push('⚠ ฝ่ายหมาป่าเท่าหรือมากกว่าชาวบ้าน → หมาป่าชนะทันที');
    else if (wf >= v) msgs.push('⚠ ฝ่ายหมาป่ามากกว่าหรือเท่าชาวบ้าน — มีหมาป่าเดียวดายยื้อไว้ แต่แพ้ได้ทุกเมื่อ');
    else if (w === 1 && setup.n >= 10) msgs.push('💡 ผู้เล่น ' + setup.n + ' คน แนะนำหมาป่า 2-3 ตัว');
    else if (w >= 4) msgs.push('💡 หมาป่า 4+ ตัว อาจยากต่อชาวบ้าน');
    if (cursed > 0 && w === 0) msgs.push('💡 ผู้ต้องคำสาปต้องมีหมาป่าในเกมจึงจะทำงาน');
    if (infected > 0 && w === 0) msgs.push('💡 ผู้ป่วยติดเชื้อต้องมีหมาป่าในเกมจึงจะทำงาน');
    if (setup.roles.wolfcub > 0 && setup.roles.werewolf === 0) msgs.push('💡 ลูกหมาป่าควรมีหมาป่าอย่างน้อย 1 ตัว');
    const totalVillagers = (setup.roles.villager || 0) + villagerCount(ctx);
    if (totalVillagers === 0 && !msgs.length) msgs.push('💡 ไม่มีชาวบ้านธรรมดา → เกมจะสั้นลง');
    if ((setup.roles.lone_wolf || 0) > 0 && w === 0) msgs.push('💡 หมาป่าเดียวดายควรอยู่ร่วมเกมกับหมาป่าทีม');
    if ((setup.roles.cult_leader || 0) > 0 && setup.n < 8) msgs.push('💡 ลัทธิแนะนำผู้เล่น 8 คนขึ้นไป');
    if ((setup.roles.vampire || 0) > 0 && setup.n < 10) msgs.push('💡 แวมไพร์แนะนำผู้เล่น 10 คนขึ้นไป');
    if ((setup.roles.hoodlum || 0) > 0 && setup.n < 8) msgs.push('💡 นักเลงแนะนำผู้เล่น 8 คนขึ้นไป');
    if ((setup.roles.tanner || 0) > 0 && setup.n < 6) msgs.push('💡 ยาจกแนะนำผู้เล่น 6 คนขึ้นไป');
    return msgs;
  }
  function balanceScore(ctx) {
    let score = villagerCount(ctx) * 1;
    for (const r of ctx.special) {
      const bp = (ctx.roles[r] && ctx.roles[r].bp) || 0;
      score += bp * (ctx.setup.roles[r] || 0);
    }
    return score;
  }

  /* ---------- ผลกลางคืน (ย้ายจาก endNight หลังยืนยัน — รับ deps = {killP, addLog, markWolfCubDead}) ----------
     ทำงานบน g (S.g) + ui (S.ui) ที่ส่งเข้ามาโดยตรง — side effect ทั้งหมดอยู่ใน deps ที่ฝั่งแอปส่งให้ */
  function applyNightResolution(g, ui, deps) {
    const killP = deps.killP;
    const addLog = deps.addLog;
    const markWolfCubDead = deps.markWolfCubDead;
    const players = g.players;
    const getP = id => players.find(p => p.id === id);
    const wolvesInfected = g.round === g.wolvesInfectedRound;

    const kills = [];
    if (g.night.killTarget !== null) kills.push(g.night.killTarget);
    if (g.night.wolfCubBonusActive && g.night.killTarget2 !== null) kills.push(g.night.killTarget2);

    const protection = new Set();
    if (g.night.bodyguardTarget !== null) protection.add(g.night.bodyguardTarget);
    if (g.night.priestTarget !== null) protection.add(g.night.priestTarget);
    if (g.night.savedByWitch && g.night.savedByWitchTarget != null) {
      protection.add(g.night.savedByWitchTarget);
    }

    const deaths = [];
    const cursedTurned = [];
    const infectedSaveIds = [];

    /* ตายจากแผลถูกกัด (นักเลงทนทาน) และฝีกัดแวมไพร์ — ที่เลื่อนมาจากคืนก่อน */
    for (const p of players.slice()) {
      if (!p.alive) continue;
      if (p.wounded && p.woundRound === g.round) {
        p.wounded = false;
        deaths.push(...killP(p.id, 'wound'));
        addLog('death', '🩸 ' + p.name + ' ตายจากแผลถูกกัด (นักเลงทนทาน)');
      } else if (p.bitten && p.biteRound === g.round) {
        p.bitten = false;
        deaths.push(...killP(p.id, 'bite'));
        addLog('death', '🧛 ' + p.name + ' ตายจากฝีกัดแวมไพร์');
      }
    }

    for (const tid of kills) {
      if (protection.has(tid)) continue;
      const p = getP(tid);
      if (!p || !p.alive) continue;

      if (p.roleId === 'vampire') {
        addLog('night', '🧛 แวมไพร์ ' + p.name + ' ไม่ตายจากการกัดของหมาป่า');
        continue;
      }

      if (wolvesInfected) {
        infectedSaveIds.push(tid);
        continue;
      }

      if (p.roleId === 'cursed' && !p.isTurned) {
        p.isTurned = true;
        cursedTurned.push(p.id);
        addLog('night', '🌀 ผู้ต้องคำสาป ' + p.name + ' กลายเป็นหมาป่า');
        continue;
      }
      if (p.roleId === 'tough_guy' && !p.wounded) {
        p.wounded = true;
        p.woundRound = g.round + 1;
        addLog('night', '🩸 นักเลงทนทาน ' + p.name + ' ถูกกัด — ยังไม่ตาย แต่จะตายในคืนถัดไป');
        continue;
      }
      if (p.roleId === 'infected') {
        g.wolvesInfectedRound = g.round + 1;
        p.triggeredInfection = true;
        addLog('night', '🦠 ผู้ป่วยติดเชื้อ ' + p.name + ' ถูกกัด — หมาป่าจะติดเชื้อคืนถัดไป');
      }
      deaths.push(...killP(tid, 'night'));
    }

    /* เหยื่อแวมไพร์ — ตายในวันรุ่งขึ้น */
    if (g.night.biteTarget !== null) {
      const bp = getP(g.night.biteTarget);
      if (bp && bp.alive && !bp.bitten) {
        bp.bitten = true;
        bp.biteRound = g.round + 1;
        addLog('night', '🧛 ' + bp.name + ' ถูกแวมไพร์กัด — จะตายในวันรุ่งขึ้น');
      }
    }

    /* ผี — เสียชีวิตตั้งแต่คืนแรก */
    if (g.round === 1) {
      const ghost = players.find(p => p.roleId === 'ghost' && p.alive);
      if (ghost) {
        deaths.push(...killP(ghost.id, 'ghost'));
        addLog('death', '👻 ' + ghost.name + ' (ผี) เสียชีวิตตั้งแต่คืนแรก — ยังบอกเบาะแสได้วันละ 1 ตัวอักษร');
      }
    }

    if (g.night.poisonTarget !== null) {
      const tid = g.night.poisonTarget;
      const p = getP(tid);
      if (p && p.alive) {
        if (cursedTurned.includes(tid)) {
          addLog('night', '⚠ ' + p.name + ' ถูกกัดและวางยาพร้อมกัน → ตายเป็นหมาป่า');
        }
        deaths.push(...killP(tid, 'poison'));
      }
    }

    const actualSurvivors = infectedSaveIds.filter(id => {
      const p = getP(id);
      return p && p.alive;
    });
    if (actualSurvivors.length) {
      const survivorNames = actualSurvivors.map(id => getP(id).name).join(', ');
      addLog('night', '🦠 หมาป่าติดเชื้อ — เหยื่อที่ถูกเลือก: ' + survivorNames + ' (รอดทุกคน)');
    }

    for (const id of deaths) {
      const p = getP(id);
      if (!p) continue;
      const cause = (ui.deathCauses && ui.deathCauses[id]) || 'night';
      let msg = '💀 ' + p.name + ' ตายกลางคืน';
      if (cause === 'poison') msg = '☠️ ' + p.name + ' ตายจากยาพิษ';
      else if (cause === 'lover') msg = '💔 ' + p.name + ' ตายตามคู่รัก';
      else if (cause === 'wound') msg = '🩸 ' + p.name + ' ตายจากแผลถูกกัด';
      else if (cause === 'bite') msg = '🧛 ' + p.name + ' ตายจากฝีกัดแวมไพร์';
      else if (cause === 'fear') msg = '🪶 ' + p.name + ' ตายตามเวอร์จิเนีย วูล์ฟ';
      else if (cause === 'ghost') msg = '👻 ' + p.name + ' (ผี) เสียชีวิตตั้งแต่คืนแรก';
      addLog('death', msg);
    }
    markWolfCubDead(deaths);

    const grandP = players.find(p => p.roleId === 'grandma');
    if (grandP && !grandP.alive && g.night.grandmaTarget !== null && g.night.grandmaTarget !== grandP.id) {
      const banP = getP(g.night.grandmaTarget);
      if (banP && banP.alive) {
        addLog('death', '👵 ยายแก่ตายก่อนรุ่งเช้า — แต่คำสั่งขับไล่ ' + banP.name + ' ยังมีผลในวันนี้');
      }
    }

    /* เบาะแสผี — ทุกรุ่งเช้าเผย 1 ตัวอักษร จนครบคำ */
    const ghostP = players.find(p => p.roleId === 'ghost');
    if (ghostP && !ghostP.alive && g.ghostWord && (g.ghostRevealed || 0) < g.ghostWord.length) {
      const gi = g.ghostRevealed || 0;
      g.ghostRevealed = gi + 1;
      addLog('info', '👻 ผีส่งเบาะแส (' + g.ghostRevealed + '/' + g.ghostWord.length + '): ตัวอักษรที่ ' + (gi + 1) + ' = ' + g.ghostWord[gi]);
    }

    ui.deaths = deaths;
    const cursedStillAlive = cursedTurned.length > 0 && !deaths.includes(cursedTurned[0]);
    ui.cursedTurnedTonight = cursedStillAlive ? cursedTurned[0] : null;

    let dh = null;
    for (const id of deaths) {
      const p = getP(id);
      if (p && p.roleId === 'hunter' && !p.usedHunterShot) {
        dh = id;
        break;
      }
    }
    ui.pendHunter = dh !== null ? {hunterId: dh, context: 'dawn'} : null;

    return {deaths, cursedTurned};
  }

  return {
    isWolfTeam,
    getTeamOf,
    checkWin,
    tally,
    totalRoles,
    villagerCount,
    wolfFactionCount,
    instantParityWin,
    balanceWarnings,
    balanceScore,
    applyNightResolution
  };
});

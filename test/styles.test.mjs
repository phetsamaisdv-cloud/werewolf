import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

function grabBlock(src, selector) {
  const start = src.indexOf(selector + ' {');
  if (start < 0) throw new Error('block not found: ' + selector);
  const open = src.indexOf('{', start);
  let depth = 0;
  for (let j = open; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') {
      depth--;
      if (depth === 0) return src.slice(open + 1, j);
    }
  }
  throw new Error('unclosed block: ' + selector);
}
function tokens(block) {
  const out = {};
  const re = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(block))) out[m[1]] = m[2].trim();
  return out;
}
function parseColor(v) {
  v = String(v).trim();
  let m = /^#([0-9a-f]{6})$/i.exec(v);
  if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16), 1];
  m = /^#([0-9a-f]{3})$/i.exec(v);
  if (m) return [parseInt(m[1][0] + m[1][0], 16), parseInt(m[1][1] + m[1][1], 16), parseInt(m[1][2] + m[1][2], 16), 1];
  m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/.exec(v);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])];
  throw new Error('unreadable color: ' + v);
}
function composite(fg, bg) {
  return [0, 1, 2].map(i => Math.round(fg[i] * fg[3] + bg[i] * (1 - fg[3])));
}
function lum(rgb) {
  const f = c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
}
function ratio(a, b) {
  const la = lum(a);
  const lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
function parseRules(src) {
  const out = {};
  let depth = 0;
  let pending = '';
  let bodyFrom = 0;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '{') {
      if (depth === 0) {
        pending = src.slice(lastEnd, i).trim();
      }
      depth++;
      if (depth === 1) bodyFrom = i + 1;
    } else if (c === '}') {
      depth--;
      if (depth === 0) {
        const body = src.slice(bodyFrom, i);
        const bg = /(?:^|[\s;])background(?:-color)?:\s*([^;]+);/.exec(body);
        const col = /(?:^|[\s;])color:\s*([^;]+);/.exec(body);
        for (const s of pending.split(',')) {
          const key = s.trim();
          if (key && key[0] !== '@') out[key] = {background: bg ? bg[1].trim() : null, color: col ? col[1].trim() : null};
        }
        lastEnd = i + 1;
      }
    }
  }
  return out;
}
let lastEnd = 0;

function resolve(value, tk) {
  const v = String(value).trim();
  if (v.startsWith('var(')) {
    const name = /var\((--[\w-]+)/.exec(v);
    if (!name || !tk[name[1]]) throw new Error('unknown token in: ' + v);
    return parseColor(tk[name[1]]);
  }
  return parseColor(v);
}
function effectiveFg(fg, bgBase) {
  return fg[3] < 1 ? composite(fg, bgBase) : fg;
}

const THEMES = [
  ['dark', tokens(grabBlock(css, ':root'))],
  ['light', tokens(grabBlock(css, 'body.light'))]
];
const TEXT_TOKENS = ['--text', '--muted', '--muted2', '--text-dim', '--primary2'];
const BG_TOKENS = ['--bg', '--surface'];
const RULES = parseRules(css);
const BADGE_SELECTORS = ['.bd.w', '.bd.v', '.bd.n', '.bd.dead', '.badge-check', '.nt.i', '.nt.dg', '.nt.ok', '.nt.wr', '.btn.p'];

for (const [themeName, tk] of THEMES) {
  test('contrast (' + themeName + '): ข้อความหลักบน --bg/--surface ≥ 4.5 (AA)', () => {
    const fails = [];
    for (const t of TEXT_TOKENS) {
      for (const bgk of BG_TOKENS) {
        const r = ratio(parseColor(tk[t]), parseColor(tk[bgk]));
        if (r < 4.5) fails.push(t + ' on ' + bgk + ' = ' + r.toFixed(2));
      }
    }
    assert.deepEqual(fails, []);
  });
  test('contrast (' + themeName + '): primary-ink บนปุ่ม primary ≥ 4.5 (AA)', () => {
    const r = ratio(parseColor(tk['--primary-ink']), parseColor(tk['--primary']));
    assert.ok(r >= 4.5, 'primary-ink on --primary = ' + r.toFixed(2));
  });
  test('contrast (' + themeName + '): badge/notice/ปุ่ม จาก styles.css ≥ 4.5 (AA)', () => {
    const surface = parseColor(tk['--surface']);
    const fails = [];
    for (const sel of BADGE_SELECTORS) {
      const rule = RULES[sel];
      if (!rule || !rule.color || !rule.background) continue;
      const bgRaw = rule.background;
      let bg;
      if (/rgba?\(/.test(bgRaw) && !/var\(/.test(bgRaw)) {
        bg = composite(parseColor(bgRaw), surface);
      } else {
        bg = resolve(bgRaw, tk);
      }
      const fg = effectiveFg(resolve(rule.color, tk), bg);
      const r = ratio(fg, bg);
      if (r < 4.5) fails.push(sel + ' = ' + r.toFixed(2));
    }
    assert.deepEqual(fails, []);
    assert.ok(fails.length === 0);
  });
}

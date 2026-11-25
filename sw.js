/* Service Worker — offline shell + self-healing สำหรับ คืนหอนหลอนหมาป่า
   กฎสำคัญ: ห้ามให้ promise ที่ส่งเข้า event.respondWith() reject เด็ดขาด
   (ถ้า reject → navigation ทั้งหน้าล่มเป็น ERR_FAILED) */
'use strict';

const VERSION = 'v2.6.1';
const CACHE = 'werewolf-shell-' + VERSION;
const NAV_TIMEOUT_MS = 5000;

const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './game-logic.js',
  './app.js',
  './icon.svg',
  './assets/logo.png',
  './assets/hero.png',
  './assets/role.jpg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/icon-180.png',
  './assets/roles/apprentice_seer.jpg',
  './assets/roles/bodyguard.jpg',
  './assets/roles/cult_leader.jpg',
  './assets/roles/cupid.jpg',
  './assets/roles/cursed.jpg',
  './assets/roles/ghost.jpg',
  './assets/roles/grandma.jpg',
  './assets/roles/hoodlum.jpg',
  './assets/roles/hunter.jpg',
  './assets/roles/infected.jpg',
  './assets/roles/lone_wolf.jpg',
  './assets/roles/lycan.jpg',
  './assets/roles/mayor.jpg',
  './assets/roles/minion.jpg',
  './assets/roles/pacifist.jpg',
  './assets/roles/pi.jpg',
  './assets/roles/priest.jpg',
  './assets/roles/prince.jpg',
  './assets/roles/seer.jpg',
  './assets/roles/sorceress.jpg',
  './assets/roles/spellcaster.jpg',
  './assets/roles/tanner.jpg',
  './assets/roles/tough_guy.jpg',
  './assets/roles/troublemaker.jpg',
  './assets/roles/vampire.jpg',
  './assets/roles/villager.jpg',
  './assets/roles/virginia_woolf.jpg',
  './assets/roles/werewolf.jpg',
  './assets/roles/witch.jpg',
  './assets/roles/wolfcub.jpg'
];

/* ---------- helpers: จับ error ทุกจุด ห้ามให้ reject ---------- */

async function safeMatch(request) {
  try {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(request, {ignoreSearch: true});
    return hit || null;
  } catch (e) {
    return null;
  }
}

async function safePut(request, response) {
  try {
    const cache = await caches.open(CACHE);
    await cache.put(request, response);
  } catch (e) {
    /* เก็บแคชไม่ได้ไม่เป็นไร — ไม่กระทบการโหลด */
  }
}

/* InfinityFree (และโฮสต์ฟรีอื่น ๆ) แทรกหน้า anti-bot "aes.js" แทนไฟล์ .html/.js/.json
   เมื่อ request ครั้งแรกยังไม่มีคุกกี้ — ถ้าเก็บหน้านั้นลงแคช แอปจะพังถาวร
   ตัวตรวจนี้จะอ่านเนื้อหาก็ต่อเมื่อ content-type เป็น text/html เท่านั้น
   (รูป/CSS/JS จริงจะข้ามการอ่านทันที ไม่มีผลต่อความเร็ว) */
async function isChallengePage(res) {
  try {
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.indexOf('text/html') === -1) return false;
    const text = await res.clone().text();
    return text.indexOf('/aes.js') !== -1 || text.indexOf('slowAES') !== -1;
  } catch (e) {
    return false;
  }
}

/* เก็บลงแคชเฉพาะ response ที่ใช้ได้จริง: ok + ไม่ใช่หน้า challenge
   clone แบบ synchronous (ก่อน await จุดแรก) เพื่อให้เรียกแบบไม่ await ได้อย่างปลอดภัย */
async function cacheIfGood(request, res) {
  try {
    if (!res || !res.ok) return false;
    const copy = res.clone();
    if (await isChallengePage(copy)) return false;
    await safePut(request, copy.clone());
    return true;
  } catch (e) {
    return false;
  }
}

/* precache แบบ best-effort: ไฟล์ใดพลาด/challenge ก็ไม่ทำให้ install ทั้งชุดล้มเหลว */
async function precacheOne(cache, url) {
  try {
    const res = await fetch(url, {cache: 'reload', credentials: 'same-origin'});
    if (!res || !res.ok) return false;
    if (await isChallengePage(res)) return false;
    await cache.put(url, res.clone());
    return true;
  } catch (e) {
    return false;
  }
}

function fetchWithTimeout(request, ms) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(function () {
    if (ctrl) ctrl.abort();
  }, ms);
  const opts = ctrl ? {signal: ctrl.signal} : {};
  return fetch(request, opts).then(
    function (res) {
      clearTimeout(timer);
      return res;
    },
    function (err) {
      clearTimeout(timer);
      throw err;
    }
  );
}

function offlineResponse() {
  return new Response('ออฟไลน์ — ไม่สามารถโหลดทรัพยากรได้', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store'}
  });
}

/* หน้าสุดท้ายถ้าทั้ง network และ cache ใช้ไม่ได้ — ซ่อมตัวเอง:
   ถ้าเน็ตกลับมาแล้วแต่ SW เพี้ยน → unregister แล้วโหลดใหม่ */
function repairPage() {
  const html =
    '<!DOCTYPE html><html lang="th"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>คืนหอนหลอนหมาป่า</title></head>' +
    '<body style="font-family:system-ui,sans-serif;background:#0a0e1a;color:#e5e7eb;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;margin:0">' +
    '<div style="padding:24px"><h1 style="font-size:20px">เปิดหน้าไม่สำเร็จ</h1>' +
    '<p id="m" style="opacity:.8">กำลังตรวจสอบ...</p></div>' +
    '<script>' +
    'fetch("/",{cache:"no-store"}).then(function(r){return r.ok;}).catch(function(){return false;}).then(function(ok){' +
    '  var m=document.getElementById("m");' +
    '  if(!ok){m.textContent="ออฟไลน์อยู่ — เปิดหน้านี้ใหม่เมื่อมีอินเทอร์เน็ต";return;}' +
    '  if(!("serviceWorker" in navigator)){location.reload();return;}' +
    '  m.textContent="กำลังซ่อมแซม service worker...";' +
    '  navigator.serviceWorker.getRegistrations().then(function(rs){' +
    '    return Promise.all(rs.map(function(r){return r.unregister();}));' +
    '  }).then(function(){location.reload();}).catch(function(){' +
    '    m.textContent="กรุณาล้างแคชเบราว์เซอร์ของเว็บนี้ แล้วลองใหม่";' +
    '  });' +
    '});' +
    '</script></body></html>';
  return new Response(html, {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'}
  });
}

/* ---------- navigation: network-first → cache → หน้าซ่อม ---------- */
async function handleNavigation(request) {
  let res = null;
  try {
    res = await fetchWithTimeout(request, NAV_TIMEOUT_MS);
    if (res && res.ok) {
      cacheIfGood('./index.html', res);
      return res;
    }
  } catch (err) {
    /* เน็ตขาด/ช้าเกินไป → ตกไปใช้ cache ด้านล่าง */
  }

  const cached = (await safeMatch('./index.html')) || (await safeMatch('./'));
  if (cached) {
    /* ดึงของใหม่เงียบ ๆ เผื่อเน็ต/เซิร์ฟเวอร์กลับมา */
    fetch(request)
      .then(function (r) {
        return cacheIfGood('./index.html', r);
      })
      .catch(function () {});
    return cached;
  }
  return res || repairPage();
}

/* ---------- asset: cache-first + revalidate ตอนหลัง ---------- */
async function handleAsset(request) {
  const cached = await safeMatch(request);
  if (cached) {
    fetch(request)
      .then(function (r) {
        return cacheIfGood(request, r);
      })
      .catch(function () {});
    return cached;
  }
  try {
    const res = await fetch(request);
    if (res && res.ok) cacheIfGood(request, res);
    return res;
  } catch (err) {
    return offlineResponse();
  }
}

/* ---------- lifecycle ---------- */

self.addEventListener('install', function (event) {
  /* precache แบบ best-effort — โฮสต์ฟรีอย่าง InfinityFree อาจตอบหน้า challenge
     แทนไฟล์จริงในบางจังหวะ ถ้าใช้ strict (Promise.all + cache.add) แล้วไฟล์ใดพลาด
     SW จะค้าง state "installing" ไม่มีวัน activate ทำงานออฟไลน์ไม่ได้
     → precacheOne ไม่มีทาง reject และข้ามหน้า challenge ให้เอง */
  event.waitUntil(
    caches
      .open(CACHE)
      .then(function (cache) {
        return Promise.all(
          CORE_ASSETS.map(function (url) {
            return precacheOne(cache, url);
          })
        );
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (k) {
              return k !== CACHE;
            })
            .map(function (k) {
              return caches.delete(k);
            })
        );
      })
      .catch(function () {})
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }
  if (url.origin !== self.location.origin) return;

  const isNavigation = req.mode === 'navigate';

  /* handleNavigation/handleAsset เป็น async จึงไม่มี sync throw,
     และ .catch สุดท้ายกันไม่ให้ respondWith reject อีกชั้น */
  const outcome = (isNavigation ? handleNavigation(req) : handleAsset(req)).catch(function () {
    return fetch(req).catch(function () {
      return offlineResponse();
    });
  });

  event.respondWith(outcome);
});

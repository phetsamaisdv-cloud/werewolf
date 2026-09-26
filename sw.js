/* Service Worker — offline shell + self-healing สำหรับ คืนหอนหลอนหมาป่า
   กฎสำคัญ: ห้ามให้ promise ที่ส่งเข้า event.respondWith() reject เด็ดขาด
   (ถ้า reject → navigation ทั้งหน้าล่มเป็น ERR_FAILED) */
'use strict';

const VERSION = 'v2.1.0';
const CACHE = 'werewolf-shell-' + VERSION;
const NAV_TIMEOUT_MS = 5000;

const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon.svg',
  './assets/logo.png',
  './assets/hero.png',
  './assets/role.jpg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/icon-180.png',
  './PROJECT.md'
];

/* ---------- helpers: จับ error ทุกจุด ห้ามให้ reject ---------- */

async function safeMatch(request) {
  try {
    const hit = await caches.match(request, {ignoreSearch: true});
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
      safePut('./index.html', res.clone());
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
        if (r && r.ok) safePut('./index.html', r.clone());
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
        if (r && r.ok) safePut(request, r.clone());
      })
      .catch(function () {});
    return cached;
  }
  try {
    const res = await fetch(request);
    if (res && res.ok) safePut(request, res.clone());
    return res;
  } catch (err) {
    return offlineResponse();
  }
}

/* ---------- lifecycle ---------- */

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(function (cache) {
        return Promise.allSettled(
          CORE_ASSETS.map(function (url) {
            return cache.add(url);
          })
        );
      })
      .catch(function () {})
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

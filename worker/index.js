// حماية منصة بيرزيت بتسجيل دخول.
// الـ Worker بيشتغل قبل الملفات الثابتة لمسارات /birzeit/* بس (wrangler.jsonc → run_worker_first)،
// وباقي الموقع (الدليل) بيضل عام زي ما هو.
//
// المستخدمين بسرّ (Secret) واحد على Cloudflare اسمه BIRZEIT_USERS:
//   {"mohamad": "pbkdf2$100000$<salt>$<hash>", "user2": "..."}
// كلمات السر مخزّنة مشفّرة (PBKDF2)؛ ولّدها بـ birzeit/tools/add_user.py.
// ما في داعي لسرّ ثاني للجلسة: مفتاح توقيع الكوكي مشتق من BIRZEIT_USERS نفسه،
// فأي تغيير بالمستخدمين أو كلمات السر بيطلّع الكل تلقائياً.

const PREFIX = "/birzeit";
const COOKIE = "bz_session";
const SESSION_HOURS = 12;

const enc = new TextEncoder();

function b64(buf) {
  let s = "";
  for (const c of new Uint8Array(buf)) s += String.fromCharCode(c);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unb64(str) {
  const s = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}
// مقارنة بوقت ثابت (ما بتفضح كم حرف صح)
function same(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function users(env) {
  try {
    const u = JSON.parse(env.BIRZEIT_USERS || "");
    return u && typeof u === "object" && Object.keys(u).length ? u : null;
  } catch {
    return null;
  }
}

async function checkPassword(stored, password) {
  const [kind, iter, salt, hash] = String(stored).split("$");
  if (kind !== "pbkdf2" || !salt || !hash) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: unb64(salt), iterations: Number(iter) }, key, 256);
  return same(b64(bits), hash);
}

async function hmacKey(env) {
  const seed = await crypto.subtle.digest("SHA-256", enc.encode("birzeit-session:" + env.BIRZEIT_USERS));
  return crypto.subtle.importKey("raw", seed, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}
async function sign(env, payload) {
  return b64(await crypto.subtle.sign("HMAC", await hmacKey(env), enc.encode(payload)));
}
async function makeSession(env, user) {
  const payload = b64(enc.encode(JSON.stringify({ u: user, exp: Date.now() + SESSION_HOURS * 3600e3 })));
  return payload + "." + (await sign(env, payload));
}
async function readSession(env, request, list) {
  const m = (request.headers.get("Cookie") || "").match(new RegExp("(?:^|;\\s*)" + COOKIE + "=([^;]+)"));
  if (!m) return null;
  const [payload, sig] = m[1].split(".");
  if (!payload || !sig || !same(sig, await sign(env, payload))) return null;
  try {
    const s = JSON.parse(new TextDecoder().decode(unb64(payload)));
    return s.exp > Date.now() && list[s.u] ? s.u : null;
  } catch {
    return null;
  }
}

function cookie(value, maxAge) {
  return `${COOKIE}=${value}; Path=${PREFIX}; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}
// إعادة التوجيه بعد الدخول: بس لصفحات المنصة نفسها
function safeNext(n) {
  return typeof n === "string" && n.startsWith(PREFIX + "/") && !n.startsWith("//") && !n.includes("\\") ? n : PREFIX + "/";
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function loginPage(next, error, status) {
  const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>تسجيل الدخول — بلدية بيرزيت</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap">
<style>
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{font-family:'IBM Plex Sans Arabic','Segoe UI',Tahoma,sans-serif;display:flex;align-items:center;justify-content:center;padding:16px;
background:radial-gradient(circle at 15% 0%,rgba(202,138,4,.22),transparent 40%),radial-gradient(circle at 85% 110%,rgba(2,132,199,.4),transparent 45%),linear-gradient(135deg,#082f49,#0c4a6e 55%,#075985)}
.box{width:100%;max-width:380px;background:#fff;border-radius:18px;padding:28px 26px 22px;box-shadow:0 30px 70px rgba(2,6,23,.45);border-top:4px solid #ca8a04}
.logo{width:56px;height:56px;margin:0 auto 10px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:26px;background:linear-gradient(135deg,#facc15,#ca8a04)}
h1{margin:0;text-align:center;color:#0c4a6e;font-size:1.3rem}p.s{margin:4px 0 20px;text-align:center;color:#64748b;font-size:.88rem}
label{display:block;font-weight:700;color:#0c4a6e;font-size:.86rem;margin-bottom:5px}
input{width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:10px;font:inherit;font-size:1rem;margin-bottom:14px}
input:focus{outline:2px solid #0284c7;border-color:#0284c7}
button{width:100%;padding:12px;border:0;border-radius:11px;font:inherit;font-weight:800;font-size:1rem;cursor:pointer;color:#422006;background:linear-gradient(135deg,#facc15,#ca8a04)}
.err{margin:0 0 14px;padding:9px 12px;border-radius:10px;background:#fef2f2;color:#b91c1c;font-size:.88rem;border-right:3px solid #b91c1c}
.f{margin-top:16px;text-align:center;color:#94a3b8;font-size:.76rem}
</style></head><body>
<form class="box" method="post" action="${PREFIX}/login">
<div class="logo">🏛️</div><h1>بلدية بيرزيت</h1><p class="s">المنصة الجغرافية الذكية · للموظفين المخوّلين</p>
${error ? `<p class="err">${esc(error)}</p>` : ""}
<input type="hidden" name="next" value="${esc(next)}">
<label for="u">اسم المستخدم</label><input id="u" name="u" autocomplete="username" required autofocus>
<label for="p">كلمة السر</label><input id="p" name="p" type="password" autocomplete="current-password" required>
<button type="submit">دخول</button>
<div class="f">الدخول مسجّل · للمساعدة تواصل مع مسؤول النظام</div>
</form></body></html>`;
  return new Response(html, { status: status || 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Frame-Options": "DENY" } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path !== PREFIX && !path.startsWith(PREFIX + "/")) return env.ASSETS.fetch(request);

    const list = users(env);
    if (!list) {
      // ما في مستخدمين معرّفين: المنصة بتضل مسكّرة (أأمن من إنها تنفتح للكل)
      return new Response("المنصة غير مهيّأة بعد: لازم يُضاف السر BIRZEIT_USERS على Cloudflare.", {
        status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
    }

    if (path === PREFIX + "/login") {
      if (request.method === "POST") {
        const form = await request.formData();
        const u = String(form.get("u") || "").trim().toLowerCase();
        const p = String(form.get("p") || "");
        const next = safeNext(String(form.get("next") || ""));
        const ok = Object.prototype.hasOwnProperty.call(list, u) && (await checkPassword(list[u], p));
        if (!ok) {
          console.log(JSON.stringify({ event: "login_failed", user: u, ip: request.headers.get("CF-Connecting-IP") }));
          return loginPage(next, "اسم المستخدم أو كلمة السر غير صحيحة.", 401);
        }
        console.log(JSON.stringify({ event: "login", user: u, ip: request.headers.get("CF-Connecting-IP") }));
        return new Response(null, { status: 303, headers: { Location: next, "Set-Cookie": cookie(await makeSession(env, u), SESSION_HOURS * 3600), "Cache-Control": "no-store" } });
      }
      return loginPage(safeNext(url.searchParams.get("next")));
    }
    if (path === PREFIX + "/logout") {
      return new Response(null, { status: 303, headers: { Location: PREFIX + "/login", "Set-Cookie": cookie("", 0), "Cache-Control": "no-store" } });
    }

    if (await readSession(env, request, list)) {
      const res = await env.ASSETS.fetch(request);
      // المحتوى خاص: لا يُخزّن بكاش مشترك
      const out = new Response(res.body, res);
      out.headers.set("Cache-Control", "private, no-store");
      return out;
    }
    // صفحات: تحويل لتسجيل الدخول؛ ملفات (بيانات، سكربتات): رفض
    const wantsPage = request.method === "GET" && (request.headers.get("Accept") || "").includes("text/html");
    if (wantsPage) {
      const next = safeNext(path + url.search);
      return new Response(null, { status: 303, headers: { Location: `${PREFIX}/login?next=${encodeURIComponent(next)}`, "Cache-Control": "no-store" } });
    }
    return new Response("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });
  },
};

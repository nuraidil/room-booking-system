/* ============================================================
   SCREENS — render functions return HTML strings.
   Reads dynamic state from window.WF (+ helpers in app.js).
   ============================================================ */

/* ---------- shared helpers ---------- */
function to12(t){ const [h,m]=t.split(':').map(Number); const p=h>=12?'PM':'AM'; const hr=h%12||12; return `${hr}:${String(m).padStart(2,'0')} ${p}`; }
function to12s(t){ const [h]=t.split(':').map(Number); const p=h>=12?'PM':'AM'; return `${h%12||12}${p}`; }
function fmtT(t){ return WF.is24h ? t : to12(t); }
function fmtTs(t){ return WF.is24h ? t : to12s(t); }
function ico(label, cls){ return `<span class="ico ${cls||''}">${label||''}</span>`; }

/* ---------- catalog DATA (static — available rooms / incoming admin queue) ---------- */
const EVENT_TYPES = ["Workshop","Hackathon","Meeting","Lecture","Seminar"];
const FACILITIES  = ["Projector","Microphone","Whiteboard","Air-Con","WiFi","HDMI"];
const FLOORS      = ["Any Floor","Level 1","Level 2","Level 3","Level 4","Level 5"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri"];
const HOURS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"];
const ROOMS = [
  { id:"R001", name:"DK5 Lecture Hall", floor:"Level 5", cap:120, score:97, event:"Workshop",  fac:["Projector","Microphone","Air-Con","WiFi"] },
  { id:"R002", name:"Innovation Lab",   floor:"Level 2", cap:60,  score:91, event:"Hackathon", fac:["Projector","Whiteboard","WiFi","HDMI"] },
  { id:"R003", name:"Meeting Room 3B",  floor:"Level 3", cap:20,  score:85, event:"Meeting",   fac:["Projector","Whiteboard","Air-Con"] },
  { id:"R004", name:"Seminar Room A",   floor:"Level 4", cap:45,  score:78, event:"Seminar",   fac:["Microphone","WiFi","Air-Con"] },
  { id:"R005", name:"Computer Lab 1",   floor:"Level 1", cap:35,  score:72, event:"Workshop",  fac:["Projector","WiFi","HDMI"] },
];
const ADDONS = [
  ["mic","Microphone","Wired/wireless handset"],
  ["projector","Projector","HDMI + VGA input"],
  ["ext","Extension Wire","5m multi-socket"],
  ["chairs","Extra Chairs","Folding chairs, 10/unit"],
];
const REQUESTS = [
  { id:"REQ-001", room:"DK5 Lecture Hall", floor:"Level 5", user:"Ahmad Naqiuddin", sid:"A22CS0045", event:"Workshop", date:"9 Jun 2026", start:"09:00", end:"11:00", cap:80, addOns:["Projector","Microphone"], pri:"high" },
  { id:"REQ-002", room:"Innovation Lab",   floor:"Level 2", user:"Siti Rahmah",     sid:"A21IS0123", event:"Hackathon",date:"11 Jun 2026", start:"10:00", end:"18:00", cap:50, addOns:["Projector","Extension Wire","Extra Chairs"], pri:"high" },
  { id:"REQ-003", room:"Meeting Room 3B",  floor:"Level 3", user:"Lim Kah Wei",     sid:"A23CS0087", event:"Meeting",  date:"12 Jun 2026", start:"14:00", end:"16:00", cap:15, addOns:[], pri:"normal" },
  { id:"REQ-004", room:"Seminar Room A",   floor:"Level 4", user:"Nur Farah",       sid:"A22SE0034", event:"Seminar",  date:"13 Jun 2026", start:"08:00", end:"12:00", cap:40, addOns:["Microphone","Projector"], pri:"normal" },
  { id:"REQ-005", room:"Computer Lab 1",   floor:"Level 1", user:"Raj Kumar",       sid:"A21CS0212", event:"Workshop", date:"16 Jun 2026", start:"10:00", end:"13:00", cap:30, addOns:[], pri:"low" },
];
const ISSUE_CHIPS = [
  ["projector","Projector issue"],["mic","Mic not working"],["ac","A/C malfunction"],
  ["power","Power/socket issue"],["wifi","No WiFi"],["lights","Lighting problem"],["furniture","Broken furniture"],
];
window.ROOMS = ROOMS; window.REQUESTS = REQUESTS;

/* ---------- generic bits ---------- */
function frame(url, inner){
  return `<div class="frame"><div class="titlebar">
      <span class="tl"></span><span class="tl"></span><span class="tl"></span>
      <span class="url">${url}</span>
    </div><div class="screen">${inner}</div></div>`;
}
function emptyBox(glyph, title, sub, ctaLabel, ctaTarget){
  return `<div class="emptybox">
    <div class="ph" style="width:54px;height:54px;border-radius:50%;">${glyph}</div>
    <span class="b7 t15">${title}</span>
    <span class="t12 muted" style="max-width:320px;text-align:center;">${sub}</span>
    ${ctaLabel?`<button class="btn primary sm mt8" data-act="goto" data-target="${ctaTarget}">${ctaLabel}</button>`:''}
  </div>`;
}
function statusTag(state){
  const map = { active:'confirmed', expired:'completed', cancelled:'cancelled', pending:'pending' };
  return `<span class="tag ${state==='active'?'solid':''}">${map[state]||state}</span>`;
}

/* persistent left navigation sidebar */
function navSidebar(active){
  const counts = { mybookings: WF.session.bookings.length, reports: WF.session.reports.length };
  const items = [
    ["Dashboard","dashboard","▦"],
    ["New Booking","recommend","+"],
    ["Calendar","calendar","▤"],
    ["My Bookings","mybookings","◷"],
    ["Reports","reports","≡"],
  ];
  return `<aside class="side">
    <div class="brandbar">
      <div class="ph" style="width:34px;height:34px;">FSK</div>
      <div class="col"><span class="b7 t13">FSKTM</span><span class="t10 muted mono">Venue Booking</span></div>
    </div>
    <nav class="navlist">
      ${items.map(([l,t,g])=>{const c=counts[t];return `<div class="navitem ${active===t?'on':''}" data-act="goto" data-target="${t}">${ico(g,'sm')}${l}${c?`<span class="navcount">${c}</span>`:''}</div>`;}).join('')}
    </nav>
    <div class="side-admin">
      <div class="navitem admin" data-act="adminGate">${ico('⛊','sm')}Admin Mode</div>
    </div>
    <div class="userbar">
      <div class="row gap10">
        <div class="ph avatar" style="width:32px;height:32px;">AN</div>
        <div class="col"><span class="b6 t12">Ahmad Naqiuddin</span><span class="t10 muted mono">A22CS0045</span></div>
      </div>
      <button class="btn sm block" data-act="logout">⎋ &nbsp;Log Out</button>
    </div>
  </aside>`;
}
/* app shell wrapper */
function shell(url, active, inner){
  return frame(url, `<div class="appbody">${navSidebar(active)}<main class="appmain">${inner}</main></div>`);
}

/* ============================================================
   LOGIN / SIGN-UP
   ============================================================ */
function renderLogin(){
  const tab = WF.authTab;
  const login = `
    <div class="col gap14">
      <div class="col gap6"><span class="t12 b6 muted">Matric / Staff ID or Email</span><div class="field ph-only">e.g. A22CS0045</div></div>
      <div class="col gap6"><span class="t12 b6 muted">Password</span><div class="field ph-only">••••••••</div></div>
      <div class="row between">
        <label class="row gap8" style="cursor:pointer;"><span class="cbox on">✓</span><span class="t12 muted">Remember me</span></label>
        <span class="t12 muted" style="text-decoration:underline;">Forgot password?</span>
      </div>
      <button class="btn primary block" data-act="goto" data-target="dashboard" style="padding:12px;">Log In</button>
      <div class="t12 muted" style="text-align:center;">Don't have an account? <span class="linktab" data-act="authtab" data-v="signup">Sign up</span></div>
    </div>`;
  const signup = `
    <div class="col gap14">
      <div class="col gap6"><span class="t12 b6 muted">Full Name</span><div class="field ph-only">e.g. Ahmad Naqiuddin</div></div>
      <div class="row gap12">
        <div class="col gap6" style="flex:1;"><span class="t12 b6 muted">Matric / Staff ID</span><div class="field ph-only">A22CS0045</div></div>
        <div class="col gap6" style="flex:1;"><span class="t12 b6 muted">Faculty Email</span><div class="field ph-only">name@graduate.utm.my</div></div>
      </div>
      <div class="row gap12">
        <div class="col gap6" style="flex:1;"><span class="t12 b6 muted">Password</span><div class="field ph-only">••••••••</div></div>
        <div class="col gap6" style="flex:1;"><span class="t12 b6 muted">Confirm Password</span><div class="field ph-only">••••••••</div></div>
      </div>
      <label class="row gap8" style="cursor:pointer;"><span class="cbox on">✓</span><span class="t12 muted">I agree to the facility usage terms</span></label>
      <button class="btn primary block" data-act="goto" data-target="dashboard" style="padding:12px;">Create Account</button>
      <div class="t12 muted" style="text-align:center;">Already have an account? <span class="linktab" data-act="authtab" data-v="login">Log in</span></div>
    </div>`;
  return frame("auth / login", `
    <div class="authwrap">
      <div class="authcard">
        <div class="col gap10" style="align-items:center;text-align:center;margin-bottom:6px;">
          <div class="ph" style="width:46px;height:46px;">FSK</div>
          <div class="col"><span class="b8 t18">FSKTM Venue Booking</span><span class="t12 muted">Faculty of Computing · Self-service portal</span></div>
        </div>
        <div class="authtabs">
          <button class="${tab==='login'?'on':''}" data-act="authtab" data-v="login">Log In</button>
          <button class="${tab==='signup'?'on':''}" data-act="authtab" data-v="signup">Sign Up</button>
        </div>
        ${tab==='login'?login:signup}
      </div>
    </div>`);
}

/* ============================================================
   ADMIN GATE
   ============================================================ */
function renderAdminAuth(){
  return frame("auth / admin", `
    <div class="authwrap">
      <div class="authcard">
        <div class="col gap10" style="align-items:center;text-align:center;margin-bottom:4px;">
          <div class="ph" style="width:46px;height:46px;">⛊</div>
          <div class="col"><span class="b8 t18">Admin Access</span><span class="t12 muted">Restricted area — staff credentials required</span></div>
        </div>
        <div class="col gap14">
          <div class="col gap6"><span class="t12 b6 muted">Admin Username</span><div class="field ph-only">admin.fsktm</div></div>
          <div class="col gap6"><span class="t12 b6 muted">Password</span><div class="field ph-only">••••••••</div></div>
          <div class="row gap8" style="padding:9px 11px;border:1px dashed var(--line-2);border-radius:6px;background:var(--paper);">
            <span class="t11 muted">⚠ Admin actions are logged. Authorised faculty staff only.</span>
          </div>
          <button class="btn primary block" data-act="goto" data-target="admin" style="padding:12px;">Enter Admin Board</button>
          <button class="btn block" data-act="adminCancel">Cancel</button>
        </div>
      </div>
    </div>`);
}

/* ============================================================
   P1 — DASHBOARD (dynamic)
   ============================================================ */
function renderP1(){
  const active = activeBookings();
  const stats = [
    ["Active Bookings", String(active.length), "Currently held"],
    ["Hours Booked", hoursBooked()+"h", "Active total"],
    ["Rooms Used", String(usedRoomsCount()), "All time"],
  ];
  const activeList = active.length ? active.map(b=>`
      <div class="lrow" data-act="goto" data-target="mybookings" style="cursor:pointer;">
        <div class="stripe"></div>
        <div class="col gap6" style="flex:1;min-width:0;">
          <div class="row gap8 wrap">
            <span class="b7 t14">${b.roomName}</span>
            <span class="tag solid">${b.event}</span>
            ${statusTag(b.state)}
          </div>
          <div class="row gap16 wrap muted mono t12">
            <span>▦ ${dateLabel(b.day)}</span>
            <span>◷ ${fmtT(b.start)} – ${fmtT(b.end)}</span>
            <span>⌂ ${b.floor}</span>
            <span>◯ ${b.cap} cap.</span>
          </div>
        </div>
        <span class="t11 muted mono">${b.id}</span><span class="muted">›</span>
      </div>`).join('')
    : `<div style="padding:6px;">${emptyBox('◷','No active bookings','When you reserve a room it shows up here and on the calendar.','+ Create New Booking','recommend')}</div>`;

  const activity = WF.session.activity.length ? WF.session.activity.map(a=>`
      <div class="lrow" style="gap:10px;">
        <div class="ico">${ico('')}</div>
        <div class="col" style="flex:1;min-width:0;"><span class="b6 t13">${a.action}</span><span class="t11 muted mono">${a.room}</span></div>
        <span class="t11 muted mono">${a.time}</span>
      </div>`).join('')
    : `<div class="lrow muted t12" style="justify-content:center;padding:22px;">No activity yet.</div>`;

  return shell("app / dashboard", 'dashboard', `
    <header class="topbar">
      <div class="col gap4">
        <span class="b8 t20">Good morning, Ahmad</span>
        <span class="t13 muted">Sunday, 8 June 2026 · FSKTM Faculty of Computing</span>
      </div>
      <div class="row gap12">
        <button class="btn sm" data-act="adminGate">⛊ Admin Mode</button>
        <button class="btn primary" data-act="goto" data-target="recommend">+ &nbsp;Create New Booking</button>
      </div>
    </header>
    <div class="scrollpad">
      <div class="row gap16" style="align-items:stretch;">
        ${stats.map(([l,v,s])=>`<div class="stat" style="flex:1;">
          <div class="box">${ico('▦')}</div>
          <div class="col"><span class="t12 muted">${l}</span><span class="b8 t22">${v}</span><span class="t10 muted mono">${s}</span></div>
        </div>`).join('')}
      </div>
      <div class="uicard">
        <div class="head"><span class="b7 t15">Active Bookings</span><span class="tag solid">${active.length}</span></div>
        <div>${activeList}</div>
      </div>
      <div class="row gap16" style="align-items:stretch;">
        <div class="uicard" style="flex:1;">
          <div class="head"><span class="b7 t14">Recent Activity</span></div>
          <div>${activity}</div>
        </div>
        <div class="uicard" style="flex:1;background:var(--fill);border-color:var(--line-2);display:flex;flex-direction:column;justify-content:space-between;padding:22px;">
          <div class="col gap8">
            <span class="label-kicker">Quick Access</span>
            <span class="b8 t18">Need a room right now?</span>
            <span class="t13 muted">Our smart engine matches you to the best available space in seconds.</span>
          </div>
          <button class="btn primary mt16" style="width:fit-content;" data-act="goto" data-target="recommend">+ &nbsp;Create New Booking</button>
        </div>
      </div>
    </div>`);
}

/* ============================================================
   P2 — RECOMMENDER
   ============================================================ */
function renderP2(){
  const s = WF.p2;
  const filters = `
    <aside class="filterpanel">
      <span class="label-kicker">▤ Filters</span>
      <div class="col gap10">
        <div class="row between"><span class="b6 t13">◯ Min. Capacity</span><span class="tag dark">${s.cap}</span></div>
        <div class="slider"><div class="fillbar" style="width:${(s.cap-5)/145*100}%"></div><div class="knob" style="left:${(s.cap-5)/145*100}%"></div></div>
        <div class="row between mono t10 muted"><span>5</span><span>150</span></div>
      </div>
      <div class="col gap10">
        <span class="b6 t13">Event Type</span>
        <div class="row gap6 wrap">${EVENT_TYPES.map(e=>`<span class="chip ${s.events.includes(e)?'on':''}" data-act="p2event" data-v="${e}">${e}</span>`).join('')}</div>
      </div>
      <div class="col gap8">
        <span class="b6 t13">Required Facilities</span>
        ${FACILITIES.map(f=>`<label class="row gap10" style="padding:7px 8px;border-radius:6px;cursor:pointer;" data-act="p2fac" data-v="${f}">
          <span class="cbox ${s.facilities.includes(f)?'on':''}">${s.facilities.includes(f)?'✓':''}</span>${ico('▦','sm')}<span class="t13">${f}</span>
        </label>`).join('')}
      </div>
      <div class="col gap6">
        <span class="b6 t13">⌂ Preferred Floor</span>
        ${FLOORS.map(fl=>`<div class="navitem ${s.floor===fl?'on':''}" style="margin:0;padding:8px 11px;font-size:12px;" data-act="p2floor" data-v="${fl}">${fl}</div>`).join('')}
      </div>
    </aside>`;
  const results = `
    <main class="resultscol">
      <div class="col gap4"><span class="b7 t15">${ROOMS.length} rooms matched</span><span class="t11 muted mono">Ranked by compatibility score</span></div>
      ${ROOMS.map((r,i)=>`<div class="uicard" data-act="selectRoom" data-room="${r.name}" style="cursor:pointer;${i===0?'border-color:var(--line-strong);border-width:2px;':''}">
        <div class="row" style="align-items:stretch;">
          <div class="ph img" style="width:160px;min-height:118px;border:0;border-right:1px solid var(--line);border-radius:0;">[ room photo ]</div>
          <div class="row" style="flex:1;padding:16px;gap:16px;align-items:flex-start;">
            <div class="col gap6" style="flex:1;min-width:0;">
              <div class="row gap8">${i===0?'<span class="tag dark">BEST MATCH</span>':''}<span class="t10 muted mono">${r.id}</span></div>
              <span class="b7 t15">${r.name}</span>
              <div class="row gap16 muted mono t11"><span>⌂ ${r.floor}</span><span>◯ ${r.cap} pax</span></div>
              <div class="row gap6 wrap mt4">${r.fac.map(f=>`<span class="tag">${f}</span>`).join('')}</div>
            </div>
            <div class="col gap8" style="align-items:flex-end;">
              <div class="row gap4" style="align-items:baseline;"><span class="b8 t20">${r.score}</span><span class="t10 muted mono">/100</span></div>
              <div style="width:70px;height:6px;background:var(--fill-2);border-radius:999px;overflow:hidden;"><div style="height:100%;width:${r.score}%;background:var(--line-strong);"></div></div>
              <span class="muted mt8">›</span>
            </div>
          </div>
        </div>
      </div>`).join('')}
    </main>`;
  return shell("app / recommend", 'recommend', `
    <header class="topbar">
      <div class="row gap16">
        <button class="btn sm" data-act="goto" data-target="dashboard">← Back</button>
        <div class="col gap4"><span class="b8 t18">Smart Room Recommender</span><span class="t13 muted">Tell us what you need — we'll find the best match.</span></div>
      </div>
      <span class="tag">✦ AI-Powered Engine</span>
    </header>
    <div class="subbody">${filters}${results}</div>`);
}

/* ============================================================
   P3 — ADD-ONS & SUMMARY (dynamic config)
   ============================================================ */
function renderP3(){
  const s = WF.p3;
  const room = ROOMS.find(r=>r.name===WF.selectedRoom) || ROOMS[0];
  const sel = s.addons;
  const startSel = `<select class="field" data-change="p3start">${TIME_OPTS.map(t=>`<option value="${t}" ${s.start===t?'selected':''}>${fmtT(t)}</option>`).join('')}</select>`;
  const endSel = `<select class="field" data-change="p3end">${TIME_OPTS.filter(t=>t>s.start).map(t=>`<option value="${t}" ${s.end===t?'selected':''}>${fmtT(t)}</option>`).join('')}</select>`;
  const body = `
    <div class="subbody-scroll">
      <div class="p3grid">
        <div class="col gap16">
          <div class="uicard">
            <div class="head"><span class="label-kicker">Selected Room</span></div>
            <div class="row gap14" style="padding:16px 18px;">
              <div class="ph" style="width:52px;height:52px;">⌂</div>
              <div class="col gap6"><span class="b7 t16">${room.name}</span>
                <div class="row gap12"><span class="tag">⌂ ${room.floor}</span><span class="tag">◯ ${room.cap} pax</span><span class="tag dark">${room.event}</span></div>
              </div>
            </div>
          </div>
          <div class="uicard">
            <div class="head"><span class="label-kicker">Date & Time</span></div>
            <div style="padding:16px 18px;" class="col gap14">
              <div class="col gap8"><span class="t12 b6 muted">▦ Day</span>
                <div class="row gap6 wrap">${DAYS.map(d=>`<span class="chip ${s.day===d?'on':''}" data-act="p3day" data-v="${d}">${d} · ${DAY_DATES[d].split(' ')[0]}</span>`).join('')}</div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
                <div class="col gap6"><span class="t12 b6 muted">◷ Start</span>${startSel}</div>
                <div class="col gap6"><span class="t12 b6 muted">◷ End</span>${endSel}</div>
              </div>
              <div class="row between" style="padding:11px 16px;border-radius:8px;background:var(--fill);">
                <span class="mono b6 t14">◷ ${fmtT(s.start)}</span>
                <div style="flex:1;height:2px;background:var(--line-2);margin:0 16px;border-radius:2px;"></div>
                <span class="mono b6 t14">${fmtT(s.end)} ◷</span>
              </div>
            </div>
          </div>
          <div class="uicard">
            <div class="head"><div class="col gap4"><span class="label-kicker">Facility Add-On Request</span><span class="t12 muted">Select equipment to attach to your booking.</span></div></div>
            <div style="padding:18px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              ${ADDONS.map(([id,label,desc])=>{const on=sel[id]!==undefined;return `
                <div class="uicard" data-act="p3addon" data-v="${id}" style="padding:14px;cursor:pointer;${on?'border-color:var(--line-strong);background:var(--paper);':''}">
                  <div class="row between" style="margin-bottom:8px;"><div class="ph" style="width:36px;height:36px;">${ico('')}</div>${on?'<span class="tag dark">✓</span>':''}</div>
                  <div class="b6 t13">${label}</div><div class="t11 muted">${desc}</div>
                  ${on?`<div class="row gap8 mt12" data-noclick>
                    <button class="btn sm" data-act="p3qty" data-v="${id}:-1" style="width:26px;height:26px;padding:0;justify-content:center;">−</button>
                    <span class="mono b6 t13">${sel[id]}</span>
                    <button class="btn sm" data-act="p3qty" data-v="${id}:1" style="width:26px;height:26px;padding:0;justify-content:center;">+</button>
                    <span class="t11 muted mono">unit${sel[id]>1?'s':''}</span></div>`:''}
                </div>`;}).join('')}
            </div>
          </div>
          <div class="uicard">
            <div class="head"><span class="label-kicker">Event Details</span></div>
            <div style="padding:18px;" class="col gap12">
              <div class="field area ph-only" style="height:74px;padding-top:11px;">Describe the purpose or agenda of your event…</div>
              <label class="row gap10" data-act="p3email" style="cursor:pointer;"><span class="switch ${s.email?'on':''}"><span class="nub"></span></span><span class="t13">✉ Send automated email reminder notification</span></label>
            </div>
          </div>
        </div>
        <div>
          <div class="uicard" style="position:sticky;top:0;">
            <div class="head" style="background:#2c2c2c;border-color:#2c2c2c;"><span class="b7 t14" style="color:#fff;">Booking Summary</span></div>
            <div style="padding:18px;" class="col gap14">
              <div class="col gap4"><span class="label-kicker">Room</span><span class="b6 t14">${room.name}</span><span class="t11 muted mono">${room.floor} · ${room.cap} pax</span></div>
              <div class="divline"></div>
              <div class="col gap4"><span class="label-kicker">Date</span><span class="b6 t13">${dateLabel(s.day)}</span></div>
              <div class="col gap4"><span class="label-kicker">Time</span><span class="mono b6 t14">${fmtT(s.start)} – ${fmtT(s.end)}</span></div>
              ${Object.keys(sel).length?`<div class="divline"></div><div class="col gap6"><span class="label-kicker">Add-Ons</span>${Object.entries(sel).map(([id,q])=>{const a=ADDONS.find(x=>x[0]===id);return `<div class="row between"><span class="t12">${ico('','sm')} ${a[1]}</span><span class="tag">×${q}</span></div>`;}).join('')}</div>`:''}
              ${s.email?`<div class="row gap8" style="padding:9px 11px;border-radius:8px;background:var(--fill);"><span class="t11 mono">✉ Email reminder active</span></div>`:''}
              <div class="divline"></div>
              <div class="row gap8" style="padding:10px 12px;border-radius:8px;border:1px dashed var(--line-2);background:var(--paper);"><span class="t11 muted">⚠ Bookings must be cancelled 2 hours prior to avoid penalties.</span></div>
              <button class="btn primary block" data-act="confirm" style="padding:12px;">✓ &nbsp;Confirm Reservation</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  return shell("app / summary", 'recommend', `
    <header class="topbar">
      <div class="row gap16">
        <button class="btn sm" data-act="goto" data-target="recommend">← Back</button>
        <div class="col gap4"><span class="b8 t18">Facility Add-Ons & Booking Summary</span><span class="t13 muted">Configure your reservation and confirm.</span></div>
      </div>
      <div class="seg" style="border-color:var(--line-2);"><button class="${!WF.is24h?'on':''}" data-act="time" data-v="12">12h</button><button class="${WF.is24h?'on':''}" data-act="time" data-v="24">24h</button></div>
    </header>
    ${body}`);
}

/* ============================================================
   P4 — CALENDAR (dynamic: only the user's active bookings)
   ============================================================ */
function renderP4(){
  const sel = WF.p4.sel;
  const active = activeBookings();
  const cols = ROOMS.map(r=>r.name);
  const at = (room,day,hour)=> active.find(b=>b.roomName===room && b.day===day && b.start<=hour && b.end>hour);
  const startsAt = (room,day,hour)=> active.find(b=>b.roomName===room && b.day===day && b.start===hour);

  let grid = `<div class="calhead cal5"><div></div>${cols.map(r=>`<div>${r}</div>`).join('')}</div>`;
  DAYS.forEach(day=>{
    grid += `<div class="dayband">${day} · ${DAY_DATES[day]}</div>`;
    HOURS.forEach(hour=>{
      let cells = `<div>${fmtTs(hour)}</div>`;
      cols.forEach(room=>{
        const bk = at(room,day,hour);
        const isStart = startsAt(room,day,hour);
        let cls='cell'; if(bk) cls+=' booked'; if(bk && sel===bk.id) cls+=' selcell';
        let inner = (bk && isStart) ? `<div class="ev">${bk.event}</div>` : '';
        const attr = bk ? `data-act="p4book" data-v="${bk.id}"` : '';
        const cur = bk ? 'cursor:pointer;' : 'cursor:default;';
        cells += `<div class="${cls}" ${attr} style="${cur}">${inner}</div>`;
      });
      grid += `<div class="calrow cal5">${cells}</div>`;
    });
  });

  let panel = '';
  if(sel){
    const b = active.find(x=>x.id===sel);
    if(b){
      panel = `<div class="slotpanel">
        <div class="row between" style="margin-bottom:10px;"><span class="b7 t14">${b.event}</span><button class="btn sm" data-act="p4close" style="padding:4px 8px;">✕</button></div>
        <div class="t12 muted mono" style="margin-bottom:4px;">${b.roomName} · ${dateLabel(b.day)}</div>
        <div class="mono b6 t13" style="margin-bottom:6px;">${fmtT(b.start)} – ${fmtT(b.end)}</div>
        <div class="t11 muted mono" style="margin-bottom:14px;">${b.id}</div>
        <div class="row gap8">
          <button class="btn" style="flex:1;justify-content:center;" data-act="cancelBk" data-v="${b.id}">✕ Cancel</button>
          <button class="btn primary" style="flex:1;justify-content:center;" data-act="endBk" data-v="${b.id}">⏻ End session</button>
        </div>
      </div>`;
    }
  }

  const legend = [["Available","#fff"],["Your Booking","var(--fill-2)"]];
  const hint = active.length===0
    ? `<div class="row gap8" style="padding:10px 26px;background:var(--paper);border-bottom:1px solid var(--line);"><span class="t12 muted">No bookings scheduled yet — confirm a reservation and it will appear on this calendar.</span></div>`
    : '';

  return shell("app / calendar", 'calendar', `
    <header class="topbar">
      <div class="col gap4"><span class="b8 t18">FSKTM Venue Calendar</span><span class="t11 muted mono">Your reserved venues · Week view</span></div>
      <div class="row gap12">
        <div class="seg" style="border-color:var(--line-2);"><button class="${!WF.is24h?'on':''}" data-act="time" data-v="12">12h</button><button class="${WF.is24h?'on':''}" data-act="time" data-v="24">24h</button></div>
        <button class="btn sm" data-act="goto" data-target="recommend">+ New Booking</button>
        <button class="btn sm" data-act="adminGate">⛊ Admin Mode</button>
      </div>
    </header>
    <div class="row gap12" style="padding:11px 26px;border-bottom:1px solid var(--line);background:#fff;">
      <button class="btn sm" style="padding:5px 9px;">‹</button>
      <span class="b7 t14">Week of 9 – 13 Jun 2026</span>
      <button class="btn sm" style="padding:5px 9px;">›</button>
      <div class="row gap16" style="margin-left:auto;">${legend.map(([l,c])=>`<span class="row gap6 t11 muted mono"><span class="sw" style="background:${c};"></span>${l}</span>`).join('')}</div>
    </div>
    ${hint}
    <div style="overflow:auto;background:#fff;flex:1;"><div class="cal">${grid}</div></div>
    ${panel}`);
}

/* ============================================================
   MY BOOKINGS (dynamic)
   ============================================================ */
function renderMyBookings(){
  const active = activeBookings();
  const history = historyBookings();
  const bookingRow = (b, isActive)=>`
    <div class="lrow">
      <div class="stripe" style="${isActive?'':'background:var(--line-2);'}"></div>
      <div class="col gap6" style="flex:1;min-width:0;">
        <div class="row gap8 wrap"><span class="b7 t14">${b.roomName}</span><span class="tag solid">${b.event}</span>${statusTag(b.state)}${b.reported?'<span class="tag">report filed</span>':''}</div>
        <div class="row gap16 wrap muted mono t12">
          <span>▦ ${dateLabel(b.day)}</span><span>◷ ${fmtT(b.start)} – ${fmtT(b.end)}</span><span>⌂ ${b.floor}</span>
          ${Object.keys(b.addons||{}).length?`<span>✦ ${Object.keys(b.addons).length} add-on${Object.keys(b.addons).length>1?'s':''}</span>`:''}
        </div>
      </div>
      <span class="t11 muted mono">${b.id}</span>
      ${isActive?`<div class="row gap8">
        <button class="btn sm" data-act="cancelBk" data-v="${b.id}">✕ Cancel</button>
        <button class="btn sm primary" data-act="endBk" data-v="${b.id}">⏻ End session</button>
      </div>`:''}
    </div>`;

  const empty = WF.session.bookings.length===0;
  const inner = empty
    ? `<div class="scrollpad">${emptyBox('◷','No bookings yet','You have not reserved any venues yet. Start a booking and it will appear here.','+ Create New Booking','recommend')}</div>`
    : `<div class="scrollpad">
        <div class="uicard">
          <div class="head"><span class="b7 t15">Active</span><span class="tag solid">${active.length}</span></div>
          <div>${active.length?active.map(b=>bookingRow(b,true)).join(''):'<div class="lrow muted t12" style="justify-content:center;padding:22px;">No active bookings.</div>'}</div>
        </div>
        <div class="uicard">
          <div class="head"><span class="b7 t15">History</span><span class="tag">${history.length}</span></div>
          <div>${history.length?history.map(b=>bookingRow(b,false)).join(''):'<div class="lrow muted t12" style="justify-content:center;padding:22px;">No past bookings.</div>'}</div>
        </div>
      </div>`;

  return shell("app / my-bookings", 'mybookings', `
    <header class="topbar">
      <div class="col gap4"><span class="b8 t18">My Bookings</span><span class="t13 muted">All venues you've reserved.</span></div>
      <button class="btn primary" data-act="goto" data-target="recommend">+ &nbsp;Create New Booking</button>
    </header>
    ${inner}`);
}

/* ============================================================
   REPORTS (dynamic)
   ============================================================ */
function renderReports(){
  const reps = WF.session.reports;
  const inner = reps.length===0
    ? `<div class="scrollpad">${emptyBox('⚠','No reports submitted','After a booking ends you can report room condition issues — your reports appear here.','Go to My Bookings','mybookings')}</div>`
    : `<div class="scrollpad">
        ${reps.map(r=>`<div class="uicard">
          <div class="head"><div class="row gap8"><span class="b7 t14">${r.roomName}</span><span class="tag dark">${r.status}</span></div><span class="t11 muted mono">${r.id} · ${r.time}</span></div>
          <div style="padding:16px 18px;" class="col gap10">
            ${r.issues.length?`<div class="row gap8 wrap">${r.issues.map(id=>{const c=ISSUE_CHIPS.find(x=>x[0]===id);return `<span class="tag">${c?c[1]:id}</span>`;}).join('')}</div>`:'<span class="t12 muted">No specific equipment flagged.</span>'}
            ${r.details?`<span class="t13">${r.details}</span>`:''}
          </div>
        </div>`).join('')}
      </div>`;
  return shell("app / reports", 'reports', `
    <header class="topbar">
      <div class="col gap4"><span class="b8 t18">Room Condition Reports</span><span class="t13 muted">Issues you've reported after using a venue.</span></div>
      <span class="tag">${reps.length} total</span>
    </header>
    ${inner}`);
}

/* ============================================================
   P5 — ADMIN SWIPE BOARD
   ============================================================ */
function renderP5(){
  const s = WF.p5;
  const pending = REQUESTS.filter(r=>!s.approved.includes(r.id)&&!s.declined.includes(r.id));
  const idx = Math.min(s.idx, Math.max(0,pending.length-1));
  const cur = pending[idx] || null;
  const statRows = [["Pending",pending.length],["Approved",s.approved.length],["Declined",s.declined.length],["Total",REQUESTS.length]];

  const cardArea = cur ? `
    <div class="row gap16" style="margin-bottom:6px;">
      <button class="btn sm" style="padding:6px 9px;" data-act="p5nav" data-v="-1">‹</button>
      <span class="mono t12 muted">${idx+1} / ${pending.length}</span>
      <button class="btn sm" style="padding:6px 9px;" data-act="p5nav" data-v="1">›</button>
    </div>
    <div class="swipe">
      <div class="pstripe"></div>
      <div class="row between" style="margin-bottom:16px;">
        <div class="col gap6"><div class="row gap8"><span class="t11 muted mono">${cur.id}</span><span class="tag">${cur.pri.toUpperCase()}</span></div>
          <span class="b8 t18">${cur.room}</span><span class="t11 muted mono">${cur.floor}</span></div>
        <div class="col gap4" style="align-items:flex-end;"><span class="b7 t13">${cur.user}</span><span class="t11 muted mono">${cur.sid}</span></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
        <div class="metsq">▦ ${cur.date}</div><div class="metsq">◷ ${fmtT(cur.start)} – ${fmtT(cur.end)}</div>
        <div class="metsq">⌂ ${cur.floor}</div><div class="metsq">◯ ${cur.cap} pax</div>
      </div>
      <div class="row gap8 wrap" style="margin-bottom:16px;"><span class="tag dark">${cur.event}</span>${cur.addOns.map(a=>`<span class="tag">${a}</span>`).join('')}</div>
      <div class="t12 muted" style="text-align:center;border-top:1px dashed var(--line-2);padding-top:12px;">← Drag left to decline · Drag right to approve →</div>
    </div>
    <div class="row gap16" style="width:100%;max-width:480px;">
      <button class="btn" style="flex:1;justify-content:center;border-color:var(--line-strong);" data-act="p5decline">✕ &nbsp;Decline</button>
      <button class="btn primary" style="flex:1;justify-content:center;" data-act="p5approve">✓ &nbsp;Approve</button>
    </div>`
  : `<div class="col gap12" style="align-items:center;text-align:center;padding:40px;">
      <div class="ph" style="width:72px;height:72px;border-radius:50%;">✓</div>
      <span class="b8 t20">All caught up!</span><span class="t13 muted">No pending booking requests at this time.</span>
      <button class="btn primary mt8" data-act="goto" data-target="calendar">Back to Schedule</button>
    </div>`;

  const processed = [...s.approved.map(id=>[id,'✓']), ...s.declined.map(id=>[id,'✕'])];
  return frame("app / admin", `
    <header class="topbar" style="background:#2c2c2c;border-color:#000;">
      <div class="row gap14">
        <button class="btn sm" data-act="goto" data-target="calendar" style="background:transparent;color:#ddd;border-color:#5a5a5a;">← Back to Schedule</button>
        <div class="row gap8"><span style="color:var(--ink-3);">⛊</span><div class="col gap4"><span class="b8 t16" style="color:#fff;">Admin Swipe Board</span><span class="t11 mono" style="color:#9b9b9b;">FSKTM Faculty Venue Management</span></div></div>
      </div>
      <div class="row gap12"><span class="tag" style="background:#3a3a3a;border-color:#5a5a5a;color:#ddd;">● ${pending.length} pending</span>
        <button class="btn sm" data-act="goto" data-target="calendar" style="background:#f0f0f0;border-color:#f0f0f0;">▦ Global Schedule</button></div>
    </header>
    <div class="appbody" style="min-height:560px;">
      <aside class="side" style="width:210px;">
        <div style="padding:18px;display:flex;flex-direction:column;gap:12px;flex:1;">
          <span class="label-kicker">Session Stats</span>
          ${statRows.map(([l,v])=>`<div class="row between" style="padding:11px 13px;border-radius:8px;background:#fff;border:1px solid var(--line);"><span class="t13">${l}</span><span class="b8 t18">${v}</span></div>`).join('')}
          <div style="margin-top:auto;"><span class="label-kicker">Processed</span>
            <div class="col gap6 mt8">${processed.length?processed.map(([id,g])=>`<div class="row gap8 t11 mono muted">${g} ${id}</div>`).join(''):'<span class="t11 muted mono">— none yet —</span>'}</div>
          </div>
        </div>
      </aside>
      <main class="appmain" style="background:var(--paper);align-items:center;justify-content:center;">
        <div class="col gap20" style="align-items:center;width:100%;padding:32px;">${cardArea}</div>
      </main>
    </div>`);
}

/* ============================================================
   P6 — DAMAGE REPORT MODAL (overlay)
   ============================================================ */
function renderP6Overlay(){
  const s = WF.p6;
  const room = WF.session.pendingRoom || WF.selectedRoom;
  return `<div class="overlay">
    <div class="modal">
      <div class="mhead">
        <div class="row between" style="align-items:flex-start;">
          <div class="row gap12"><div class="ph" style="width:40px;height:40px;background:#3a3a3a;border-color:#555;color:#ddd;">⚠</div>
            <div class="col gap4"><span class="t10 mono" style="color:#9b9b9b;letter-spacing:.07em;">POST-USE CHECK</span><span class="b8 t15" style="color:#fff;">Room Condition Report</span></div></div>
          <button class="btn sm" data-act="p6skip" style="background:transparent;border-color:#5a5a5a;color:#ddd;padding:4px 8px;">✕</button>
        </div>
        <div class="t13" style="color:#cfcfcf;margin-top:12px;">Your booking for <b style="color:#fff;">${room}</b> has ended. Help us keep the space in great condition.</div>
      </div>
      <div style="padding:20px;" class="col gap16">
        <div class="col gap10"><span class="b7 t14">Is there any broken equipment or room issues to report?</span>
          <div class="row gap8 wrap">${ISSUE_CHIPS.map(([id,l])=>`<span class="chip ${s.chips.includes(id)?'on':''}" data-act="p6chip" data-v="${id}">${ico('','sm')}${l}</span>`).join('')}</div>
        </div>
        <div class="col gap6"><span class="t12 b6 muted">Additional details (optional)</span>
          <div class="field area ph-only" style="height:64px;padding-top:11px;">Describe the issue in more detail, e.g. 'Projector remote is missing'…</div></div>
        <div class="row gap12" style="padding-top:2px;">
          <button class="btn" data-act="p6skip">⤼ No issues, skip</button>
          <button class="btn primary" style="flex:1;justify-content:center;" data-act="p6submit">➤ &nbsp;Submit Report</button>
        </div>
      </div>
    </div>
  </div>`;
}
function renderP6Submitted(){
  return `<div class="overlay"><div class="modal"><div style="padding:44px;" class="col gap12" style="align-items:center;text-align:center;">
    <div class="col gap12" style="align-items:center;text-align:center;">
      <div class="ph" style="width:64px;height:64px;border-radius:50%;">✓</div>
      <span class="b8 t18">Report Submitted!</span>
      <span class="t13 muted">Saved to your Reports. Thank you for keeping FSKTM facilities in shape.</span>
    </div>
  </div></div></div>`;
}

window.SCREENS = { renderLogin, renderAdminAuth, renderP1, renderP2, renderP3, renderP4, renderP5, renderMyBookings, renderReports, renderP6Overlay, renderP6Submitted };

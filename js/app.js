import { demoSensorSnapshot, sampleWeek, sampleHistory, sampleActivities, sensorHistory } from './demo-data.js';

const DEFAULTS = { focus: 25, shortBreak: 5, longBreak: 15, sessionsBeforeLongBreak: 4, autoStart: false, notifications: false, sound: true, theme: 'light' };
const KEYS = { prefs: 'sfg.preferences.v1', timer: 'sfg.timer.v1', devices: 'sfg.devices.v1', sessions: 'sfg.sessions.v1', lamp: 'sfg.lamp.v1', hideSamples: 'sfg.hideSamples.v1' };
const PAGE_META = {
  dashboard: ['Dashboard', 'STUDY WORKSPACE', 'A clear view of your study rhythm.'],
  focus: ['Focus Room', 'FOCUS SPACE', 'A quieter place to do one thing at a time.'],
  environment: ['Environment', 'ROOM CONDITIONS', 'Illustrative sensor readings and demo controls.'],
  analytics: ['Study Analytics', 'YOUR PROGRESS', 'Understand your routine with transparent, sample-based summaries.'],
  devices: ['My Devices', 'DEVICE MANAGEMENT', 'Manage devices stored in this browser demo.'],
  settings: ['Settings', 'PREFERENCES', 'Make the study experience work the way you do.']
};
const ICONS = {
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  timer:'<circle cx="12" cy="13" r="8.5"/><path d="M12 8v5l3.5 2M9 2h6M12 2v2M19 6l1.5-1.5"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
  chart:'<path d="M3 3v18h18M8 15l4-4 4 3 5-7"/><path d="M17 7h4v4"/>',
  cpu:'<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 9h6v6H9zM9 1v4m6-4v4M9 19v4m6-4v4M1 9h4m-4 6h4m14-6h4m-4 6h4"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.7-1.4-2.4L7.5 15a8 8 0 0 1 0-1.9L6.1 12l1.4-2.4 1.7.7a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 1.9Z"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  'chevron-down':'<path d="m6 9 6 6 6-6"/>',
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  close:'<path d="m18 6-12 12M6 6l12 12"/>',
  arrow:'<path d="M5 12h14m-7-7 7 7-7 7"/>',
  arrowUp:'<path d="m7 14 5-5 5 5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  pause:'<path d="M8 5h3v14H8zm6 0h3v14h-3z"/>',
  play:'<path d="m8 5 12 7-12 7z"/>',
  reset:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  coffee:'<path d="M10 2v2m4-2v2M4 7h14l-1.5 12h-11L4 7Zm14 2h2a2 2 0 0 1 0 4h-2M7 22h9"/>',
  bulb:'<path d="M9 18h6m-5 4h4m-5-7a7 7 0 1 1 6 0c-.8.5-1 1.2-1 2h-4c0-.8-.2-1.5-1-2Z"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>',
  device:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  focus:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  moon:'<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
  trash:'<path d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6"/>',
  plus:'<path d="M12 5v14m-7-7h14"/>',
  lightning:'<path d="m13 2-3 8h7L11 22l2-9H6l7-11Z"/>',
  history:'<path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5m4-1v5l3 2"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  motion:'<path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14M16.24 7.76a6 6 0 0 1 0 8.48M7.76 7.76a6 6 0 0 0 0 8.48"/>',
  buzzer:'<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>'
};
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.info}</svg>`;
const readJSON = (key, fallback) => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
const store = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { toast('This browser could not save your preference.', 'error'); } };
const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || min));

/**
 * Hardware Integration Bridge for NodeMCU ESP8266
 * 
 * Provides an event-driven adapter for PIR motion sensing, LDR ambient light,
 * White LED PWM lamp output, and buzzer alert triggers.
 * 
 * For future hardware deployment:
 * HardwareBridge.connectWebSocket('ws://<esp8266-ip>:81') or HardwareBridge.fetchStatus('/api/devices/LAMP_001/status')
 */
export const HardwareBridge = {
  mode: 'DEMO', // 'DEMO' | 'WEBSOCKET' | 'REST'
  data: { ...demoSensorSnapshot },
  subscribers: new Set(),

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  },

  notify() {
    this.subscribers.forEach(cb => {
      try { cb(this.data); } catch (e) { console.error('HardwareBridge subscriber error:', e); }
    });
  },

  update(patch) {
    this.data = {
      ...this.data,
      ...patch,
      lastUpdated: new Date().toISOString()
    };
    this.notify();
  },

  // Toggle demo motion state (allows instant testing of "Motion Detected" vs "No Motion")
  simulateMotion(forceState) {
    const nextDetected = forceState !== undefined ? Boolean(forceState) : !this.data.motionDetected;
    this.update({
      motionDetected: nextDetected,
      motionStatus: nextDetected ? 'Motion Detected' : 'No Motion',
      lastMotionTime: nextDetected ? 'Just now' : (this.data.lastMotionTime || '5 min ago'),
      source: 'DEMO'
    });
  },

  // Stub for NodeMCU ESP8266 WebSocket live connection
  connectWebSocket(url = 'ws://192.168.4.1:81') {
    try {
      this.mode = 'WEBSOCKET';
      const ws = new WebSocket(url);
      ws.onopen = () => {
        console.log('[ESP8266] WebSocket connection established:', url);
        this.update({ source: 'ESP8266_WS' });
      };
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const isMotion = payload.pir === 1 || payload.motion === true || payload.motionDetected === true;
          this.update({
            motionDetected: isMotion,
            motionStatus: isMotion ? 'Motion Detected' : 'No Motion',
            relativeLight: Number.isFinite(payload.light) ? payload.light : this.data.relativeLight,
            lighting: payload.light < 30 ? 'DIM' : payload.light > 75 ? 'BRIGHT' : 'ADEQUATE',
            lampOn: payload.lamp !== undefined ? Boolean(payload.lamp) : this.data.lampOn,
            brightnessPercent: Number.isFinite(payload.brightness) ? payload.brightness : this.data.brightnessPercent,
            source: 'ESP8266_LIVE'
          });
        } catch (err) {
          console.error('[ESP8266] Invalid JSON payload received:', err);
        }
      };
      ws.onerror = (err) => console.warn('[ESP8266] WebSocket error (offline demo active):', err);
      ws.onclose = () => {
        console.log('[ESP8266] WebSocket closed, returning to demo mode');
        this.mode = 'DEMO';
      };
      return ws;
    } catch (e) {
      console.warn('[ESP8266] WebSocket unavailable in this environment:', e);
      this.mode = 'DEMO';
    }
  },

  // Stub for NodeMCU ESP8266 REST API polling
  async fetchStatus(apiUrl = '/api/devices/LAMP_001/status') {
    try {
      this.mode = 'REST';
      const res = await fetch(apiUrl);
      if (res.ok) {
        const payload = await res.json();
        const isMotion = payload.pir === 1 || payload.motionDetected === true;
        this.update({
          motionDetected: isMotion,
          motionStatus: isMotion ? 'Motion Detected' : 'No Motion',
          relativeLight: payload.relativeLight ?? this.data.relativeLight,
          lighting: payload.lighting || (payload.relativeLight < 30 ? 'DIM' : payload.relativeLight > 75 ? 'BRIGHT' : 'ADEQUATE'),
          lampOn: payload.lampOn ?? this.data.lampOn,
          brightnessPercent: payload.brightnessPercent ?? this.data.brightnessPercent,
          source: 'ESP8266_REST'
        });
      }
    } catch (e) {
      // Keep demo state if backend is offline
    }
  },

  // Send hardware control command to ESP8266
  async sendCommand(command) {
    console.log('[ESP8266 Command Sent]:', command);
  }
};

const prefs = { ...DEFAULTS, ...readJSON(KEYS.prefs, {}) };
const rawStoredDevices = readJSON(KEYS.devices, null);
const initialDevices = rawStoredDevices ? rawStoredDevices.map(d => ({
  name: d.name,
  id: d.id,
  hardware: d.hardware || 'NodeMCU ESP8266',
  motion: d.motion || 'PIR Motion Sensor',
  light: d.light || 'LDR',
  mode: d.mode || 'Demo'
})) : [{ name:'Smart Focus Lamp', id:'LAMP_001', hardware:'NodeMCU ESP8266', motion:'PIR Motion Sensor', light:'LDR', mode:'Demo' }];

const state = {
  page: 'dashboard',
  prefs,
  timer: { mode:'focus', running:false, remainingMs:prefs.focus*60000, endAt:null, completed:0, cycle:1, focusElapsed:0, ...(readJSON(KEYS.timer, {}) || {}) },
  devices: initialDevices,
  sessions: readJSON(KEYS.sessions, []),
  lamp: { on:HardwareBridge.data.lampOn, auto:true, brightness:HardwareBridge.data.brightnessPercent, ...(readJSON(KEYS.lamp, {}) || {}) },
  hideSamples: readJSON(KEYS.hideSamples, false),
  timerInterval: null,
  charts: {},
  analyticsPeriod: 7,
  tableSort: 'date',
  sortDirection: 'desc'
};
const content = document.getElementById('page-content');

function persistPrefs(){ store(KEYS.prefs, state.prefs); }
function saveTimer(){ store(KEYS.timer, state.timer); }
function saveSessions(){ store(KEYS.sessions, state.sessions); }
function saveLamp(){ store(KEYS.lamp, state.lamp); }
function dateLong(date=new Date()){ return new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(date); }
function niceDate(iso){ return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(new Date(`${iso}T12:00:00`)); }
function toast(message, kind='success'){ const region=document.getElementById('toast-region');const item=document.createElement('div');item.className=`toast ${kind==='error'?'error':kind==='info'?'info':''}`;item.textContent=message;region.append(item);setTimeout(()=>item.remove(),3600); }
function applyTheme(){ document.body.classList.toggle('dark-theme',state.prefs.theme==='dark');document.querySelector('meta[name="theme-color"]')?.setAttribute('content',state.prefs.theme==='dark'?'#141b17':'#f6f8f6'); }
function updateHeader(){ const [title,eyebrow]=PAGE_META[state.page];document.getElementById('page-title').textContent=title;document.getElementById('header-eyebrow').textContent=eyebrow;document.querySelectorAll('[data-page]').forEach(el=>el.classList.toggle('active',el.dataset.page===state.page)); }
function renderNavIcons(){ document.querySelectorAll('#navigation [data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));document.querySelectorAll('.icon-button [data-icon],.top-profile [data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon)); }
function renderMobileNav(){ const nav=document.getElementById('mobile-navigation');const items=[['dashboard','grid','Home'],['focus','timer','Focus'],['environment','sun','Room'],['analytics','chart','Analytics'],['devices','cpu','Devices'],['settings','settings','Settings']];nav.innerHTML=items.map(([p,i,l])=>`<button data-page="${p}" class="${state.page===p?'active':''}" aria-label="Open ${l}">${icon(i)}<span>${l}</span></button>`).join(''); }
function navigate(page){ if(!PAGE_META[page])return;state.page=page;updateHeader();renderMobileNav();renderCurrentPage();content.focus({preventScroll:true});window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}); }
function demoBanner(text='Sample information is shown for demonstration. No physical hardware is connected.'){ return `<div class="demo-banner"><span class="demo-dot"></span><strong>DEMO DATA</strong><span>${text}</span></div>`; }
function pageIntro(title,sub,extra=''){return `<div class="page-intro"><div><h2>${title}</h2><p>${sub}</p></div>${extra}</div>`;}
function metric(label,value,note,ico,tone=''){return `<article class="metric-card"><div class="metric-head"><span>${label}</span><span class="metric-icon ${tone}">${icon(ico)}</span></div><div class="metric-value">${value}</div><div class="metric-note">${note}</div></article>`;}
function cardHead(title,subtitle='',right=''){return `<div class="card-header"><div><h3 class="card-title">${title}</h3>${subtitle?`<p class="card-subtitle">${subtitle}</p>`:''}</div>${right}</div>`;}
function timerModeDuration(){return (state.timer.mode==='focus'?state.prefs.focus:state.timer.mode==='longBreak'?state.prefs.longBreak:state.prefs.shortBreak)*60000;}
function remainingNow(){return state.timer.running&&state.timer.endAt?Math.max(0,state.timer.endAt-Date.now()):Math.max(0,state.timer.remainingMs);}
function fmt(ms){const sec=Math.ceil(Math.max(0,ms)/1000);return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}
function modeName(){return state.timer.mode==='focus'?'Focus Session':state.timer.mode==='longBreak'?'Long Break':'Short Break';}
function ringMarkup(extra=''){const dur=timerModeDuration();const ratio=Math.max(0,Math.min(1,remainingNow()/dur));return `<div class="timer-ring ${state.timer.mode!=='focus'?'blue':''}" style="--progress:${(ratio*100).toFixed(2)}%"><div class="timer-ring-inner"><div class="timer-digits">${fmt(remainingNow())}</div><div class="timer-state">${state.timer.running?'IN PROGRESS':state.timer.remainingMs===0?'COMPLETE':'READY'}</div>${extra}</div></div>`;}
function timerButtons(){const label=state.timer.running?'Pause':state.timer.remainingMs===0?'Start again':state.timer.remainingMs<timerModeDuration()?'Resume':'Start';return `<div class="timer-control-row"><button class="btn ${state.timer.running?'':'btn-primary'}" data-action="timer-toggle">${icon(state.timer.running?'pause':'play')}${label}</button><button class="btn" data-action="timer-reset" aria-label="Reset timer">${icon('reset')} Reset</button></div>`;}
function dashboardTimer(){return `<section class="card timer-card">${cardHead('Focus timer',`Cycle ${state.timer.cycle} · ${state.timer.completed} completed sessions`,`<span class="timer-mode-label ${state.timer.mode!=='focus'?'blue':''}"><i class="mode-dot"></i>${modeName()}</span>`)}<div class="timer-layout">${ringMarkup()}<div class="timer-details"><div class="mode-switch"><button data-action="set-mode" data-mode="focus" class="${state.timer.mode==='focus'?'selected':''}">Focus</button><button data-action="set-mode" data-mode="shortBreak" class="${state.timer.mode!=='focus'?'selected blue':''}">Break</button></div><h3>${state.timer.mode==='focus'?'Ready for a focused session?':'Take a moment to recharge.'}</h3><p>${state.timer.mode==='focus'?'One calm, uninterrupted block is a good place to begin.':'Step away from the desk and give your eyes a rest.'}</p>${timerButtons()}<div class="timer-secondary-controls"><span class="subtle-label">${state.prefs.focus} min focus · ${state.prefs.shortBreak} min break</span></div></div></div><div class="timer-meta"><span>Completed today <strong>${state.timer.completed}</strong></span><span>Next long break <strong>${Math.max(0,state.prefs.sessionsBeforeLongBreak-(state.timer.completed%state.prefs.sessionsBeforeLongBreak))} sessions</strong></span></div></section>`;}
function activityRows(){
  const local=state.sessions.slice(-3).reverse().map(s=>({type:s.mode==='focus'?'focus':'break',title:s.mode==='focus'?'Focus session completed':'Break completed',detail:`${s.minutes} min · Local session`,time:new Date(s.completedAt).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}));
  return [...local,...(state.hideSamples?[]:sampleActivities)].slice(0,4).map(a=>{
    const aIcon = a.type==='break'?'coffee':a.type==='lamp'?'bulb':a.type==='motion'?'motion':a.type==='pause'?'history':'check';
    const aTone = a.type==='break'?'blue':a.type==='pause'?'amber':a.type==='motion'?'blue':'';
    return `<div class="activity-row"><span class="activity-icon ${aTone}">${icon(aIcon)}</span><div class="activity-copy"><strong>${a.title}</strong><small>${a.detail}</small></div><span class="activity-time">${a.time}</span></div>`;
  }).join('');
}
function miniEnvCards(){
  const isMotion = HardwareBridge.data.motionDetected;
  return `<div class="env-stack"><article class="env-mini-card"><span class="env-symbol ${isMotion?'':'amber'}">${icon('motion')}</span><div class="env-mini-copy"><strong>PIR Motion Status</strong><small>${isMotion?'Active movement detected':'No movement detected'} · PIR · Demo</small></div><span class="status-badge ${isMotion?'':'amber'}">${isMotion?'Motion Detected':'No Motion'}</span></article><article class="env-mini-card"><span class="env-symbol blue">${icon('bulb')}</span><div class="env-mini-copy"><strong>Ambient lighting</strong><small>${HardwareBridge.data.lighting.toLowerCase()} · LDR · Demo</small></div><span class="status-badge blue">White LED ${state.lamp.on?'on':'off'}</span></article></div>`;
}
function chartShell(id,fallback=false){return `<div class="chart-wrap" data-chart-wrap="${id}"><canvas id="${id}" aria-label="${id.replaceAll('-',' ')} chart" role="img"></canvas>${fallback?'<div class="chart-fallback" hidden></div>':''}</div>`;}
function weeklyChartCard(){const total=sampleWeek.reduce((a,b)=>a+b.minutes,0);return `<section class="card chart-card">${cardHead('Weekly study activity','Illustrative focus minutes across the week',`<span class="weekly-total"><strong>${Math.floor(total/60)}h ${total%60}m</strong> this week</span>`)}${chartShell('weekly-chart',true)}<div class="subtle-label">Sample data · actual study time may differ</div></section>`;}
function dashboardPage(){return `${pageIntro('Welcome back, Student','Small focused sessions lead to meaningful progress.',`<span class="date-label">${dateLong()}</span>`)}${demoBanner('Metrics, sensor values and activity are illustrative sample data—not live measurements.')}<section class="stats-grid">${metric("Today's focus time",'2h 15m','Sample total · +18 min vs. prior day','clock')}${metric('Completed sessions','4','Illustrative sessions today','check','blue')}${metric('Break time','25 min','Sample recovery time','coffee','amber')}${metric('Study consistency','84%','Based on sample daily sessions','chart')}</section><div class="dashboard-main-grid">${dashboardTimer()}${miniEnvCards()}</div><div class="lower-grid"><section>${weeklyChartCard()}</section><section class="card">${cardHead('Recent activity','Demonstration history only',`<button class="text-link" data-page="analytics">View analytics ${icon('arrow')}</button>`)}<div class="activity-list">${activityRows()}</div><div class="subtle-label">Sample activity · local sessions are saved only in this browser</div></section></div>`;}
function focusPage(){const modeOptions=`<div class="focus-mode-tabs"><button data-action="set-mode" data-mode="focus" class="${state.timer.mode==='focus'?'selected':''}">Focus</button><button data-action="set-mode" data-mode="shortBreak" class="${state.timer.mode!=='focus'?'selected blue':''}">Break</button></div>`;const done=state.timer.completed%state.prefs.sessionsBeforeLongBreak;return `<div class="focus-page">${pageIntro('Focus Room','Settle into a session at your own pace.',`<span class="status-badge ${state.timer.running?'':'amber'}">${state.timer.running?'Timer running':'Ready when you are'}</span>`)}${demoBanner('Timer activity is kept locally. The room sensors shown elsewhere are simulated.') }<section class="focus-hero"><div class="focus-hero-head"><div><h2>${modeName()}</h2><p>One session at a time. Your progress stays on this device.</p></div><span class="timer-mode-label ${state.timer.mode!=='focus'?'blue':''}"><i class="mode-dot"></i>${state.timer.running?'IN PROGRESS':'PERSONAL TIMER'}</span></div><div class="focus-center">${ringMarkup()}<div class="focus-message">${state.timer.mode==='focus'?'“Give this moment your full attention.”':'“A little rest helps you return refreshed.”'}</div>${modeOptions}<div class="subtle-label">${state.timer.completed} completed · cycle ${state.timer.cycle} of ${state.prefs.sessionsBeforeLongBreak}</div><div class="focus-controls">${timerButtons()}</div></div></section><div class="focus-bottom-row"><section class="card settings-card">${cardHead('Session lengths','Changes apply to the current timer only when it is idle.')}${[['focus','Focus session'],['shortBreak','Short break'],['longBreak','Long break']].map(([key,label])=>`<div class="setting-row"><div class="setting-label"><strong>${label}</strong><small>${key==='longBreak'?'Extended recovery interval':key==='focus'?'A focused work block':'Between focus sessions'}</small></div><div class="field-inline"><input type="number" min="1" max="180" step="1" value="${state.prefs[key]}" data-pref="${key}" aria-label="${label} duration in minutes"><span>min</span></div></div>`).join('')}<div class="setting-row"><div class="setting-label"><strong>Sessions before long break</strong><small>Long break follows this many focus sessions</small></div><div class="field-inline"><input type="number" min="2" max="8" value="${state.prefs.sessionsBeforeLongBreak}" data-pref="sessionsBeforeLongBreak" aria-label="Sessions before long break"><span>sessions</span></div></div><button class="btn btn-primary btn-sm" data-action="save-timer-settings">Save session settings</button></section><section class="card settings-card">${cardHead('Your rhythm','A simple count of completed focus blocks.') }<div class="metric-value">${state.timer.completed} <span style="font-size:13px;font-weight:500;letter-spacing:0">sessions</span></div><p class="card-subtitle">${state.prefs.sessionsBeforeLongBreak-done===state.prefs.sessionsBeforeLongBreak?state.prefs.sessionsBeforeLongBreak:state.prefs.sessionsBeforeLongBreak-done} until your next long break</p><div class="progress-track"><span style="width:${Math.min(100,(done/state.prefs.sessionsBeforeLongBreak)*100)}%"></span></div><div class="cycle-dots">${Array.from({length:state.prefs.sessionsBeforeLongBreak},(_,i)=>`<i class="cycle-dot ${i<done?'done':''}"></i>`).join('')}</div><div class="setting-row" style="margin-top:17px"><div class="setting-label"><strong>Auto-start next focus</strong><small>Begin work automatically after a break</small></div><label class="switch"><input type="checkbox" data-pref="autoStart" ${state.prefs.autoStart?'checked':''} aria-label="Auto-start next focus session"><span class="switch-track"></span></label></div><div class="info-panel" style="margin-top:14px">${icon('info')}<span>Timer countdown uses wall-clock time, so it remains accurate if the tab sleeps or you return later.</span></div></section></div></div>`;}
function environmentPage(){
  const isMotion = HardwareBridge.data.motionDetected;
  const lighting = HardwareBridge.data.lighting;
  const hint = lighting==='DIM'?'Consider increasing your White LED study lamp brightness.':lighting==='BRIGHT'?'Ambient light is bright; reduce lamp output if needed.':'Lighting appears adequate for this illustrative demo.';
  return `${pageIntro('Environment','A quick look at the study space around your lamp.',`<span class="date-label" id="sensor-updated">Updated ${HardwareBridge.data.lastMotionTime||'just now'}</span>`)}${demoBanner('All sensor values are simulated. White LED lamp controls and buzzer alerts affect this interface and local audio.')}<div class="monitor-grid">
    <section class="card sensor-card">
      ${cardHead('PIR motion status','Passive Infrared activity detection',`<span class="status-badge ${isMotion?'':'amber'}">${isMotion?'Motion Detected':'No Motion'}</span>`)}
      <div class="sensor-reading" style="font-size:26px;margin:22px 0 2px">${isMotion?'Motion Detected':'No Motion'}</div>
      <div class="sensor-description">${isMotion?'Infrared activity detected · User in motion near desk':'No infrared movement detected · Idle / away state'}</div>
      <div class="motion-demo-actions">
        <button class="btn btn-sm" data-action="toggle-motion" aria-label="Toggle simulated PIR motion state">${icon('motion')} Simulate ${isMotion?'No Motion':'Motion Detected'}</button>
        <span class="subtle-label">Interactive demo toggle</span>
      </div>
      <div class="sensor-info-row">
        <span>PIR Motion Sensor · Demo</span>
        <span class="info-tip" title="PIR sensors detect infrared changes caused by motion. They do not measure distance, cannot identify persons, and do not reliably detect a person sitting completely still." aria-label="PIR sensor characteristics">i</span>
      </div>
    </section>
    <section class="card sensor-card">
      ${cardHead('Ambient lighting','Relative light classification',`<span class="status-badge blue">${lighting[0]+lighting.slice(1).toLowerCase()}</span>`)}
      <div class="sensor-reading">${HardwareBridge.data.relativeLight}<small> / 100</small></div>
      <div class="sensor-description">Relative LDR reading · not a calibrated lux measurement</div>
      <div class="sensor-info-row">
        <span>${hint}</span>
        <span class="info-tip" title="LDR values are relative and are not calibrated lux values.">i</span>
      </div>
    </section>
    <section class="card">
      ${cardHead('White LED lamp controls','Demo controls · physical lamp not connected',`<span class="status-badge ${state.lamp.on?'':'amber'}">${state.lamp.on?'On in demo':'Off in demo'}</span>`)}
      <div class="lamp-control-grid">
        <div>
          <div class="lamp-toggle-row">
            <div class="toggle-copy">
              <strong>White LED power</strong>
              <small>Frontend demo state only</small>
            </div>
            <label class="switch">
              <input type="checkbox" data-lamp="on" ${state.lamp.on?'checked':''} aria-label="Turn demo White LED lamp on">
              <span class="switch-track"></span>
            </label>
          </div>
          <div class="lamp-toggle-row">
            <div class="toggle-copy">
              <strong>Automatic lighting</strong>
              <small>Simulated PWM response to LDR light state</small>
            </div>
            <label class="switch">
              <input type="checkbox" data-lamp="auto" ${state.lamp.auto?'checked':''} aria-label="Enable automatic demo brightness">
              <span class="switch-track"></span>
            </label>
          </div>
        </div>
        <div class="range-row">
          <div class="range-label">
            <span>Displayed brightness</span>
            <strong id="brightness-value">${state.lamp.brightness}%</strong>
          </div>
          <input type="range" min="0" max="100" value="${state.lamp.brightness}" data-lamp="brightness" aria-label="Demo White LED brightness">
        </div>
      </div>
      <div class="subtle-label" style="margin-top:15px">No command is sent to hardware in this version. Ready for ESP8266 PWM integration.</div>
    </section>
    <section class="card">
      ${cardHead('Sensor & hardware availability','Demo mode provides simulated readings')}
      <div class="activity-list">
        <div class="activity-row">
          <span class="activity-icon ${isMotion?'':'amber'}">${icon('motion')}</span>
          <div class="activity-copy">
            <strong>PIR Motion Sensor</strong>
            <small>Digital motion trigger · simulated data</small>
          </div>
          <span class="status-badge ${isMotion?'':'amber'}">${isMotion?'Active':'Idle'}</span>
        </div>
        <div class="activity-row">
          <span class="activity-icon blue">${icon('sun')}</span>
          <div class="activity-copy">
            <strong>Ambient light sensor</strong>
            <small>LDR (Photoresistor) · simulated data</small>
          </div>
          <span class="status-badge amber">Demo</span>
        </div>
        <div class="activity-row">
          <span class="activity-icon">${icon('bulb')}</span>
          <div class="activity-copy">
            <strong>White LED study lamp</strong>
            <small>PWM brightness output · offline demo</small>
          </div>
          <span class="status-badge ${state.lamp.on?'':'red'}">${state.lamp.on?'On in demo':'Offline'}</span>
        </div>
        <div class="activity-row">
          <span class="activity-icon amber">${icon('buzzer')}</span>
          <div class="activity-copy">
            <strong>Buzzer sound alert</strong>
            <small>Piezo buzzer · Web Audio simulation active</small>
          </div>
          <span class="status-badge ${state.prefs.sound?'':'amber'}">${state.prefs.sound?'Enabled':'Muted'}</span>
        </div>
      </div>
    </section>
    <section class="card sensor-chart-card">
      ${cardHead('Illustrative sensor history','PIR motion triggers and ambient light levels over time',`<span class="subtle-label">Sample · no live feed</span>`)}
      ${chartShell('sensor-chart',true)}
      <div class="subtle-label">PIR motion trigger counts per 30-min interval and relative light index (LDR). PIR records movement events, not physical distance.</div>
    </section>
  </div>`;
}
function analyticsRows(){
  const rows=[];
  if(!state.hideSamples)rows.push(...sampleHistory.map(x=>({...x,source:'sample'})));
  const grouped={};
  for(const s of state.sessions){
    const d=new Date(s.completedAt).toISOString().slice(0,10);
    grouped[d]??={date:d,focus:0,sessions:0,break:0,interruptions:0,motionEvents:0,source:'local'};
    if(s.mode==='focus'){
      grouped[d].focus+=s.minutes;
      grouped[d].sessions+=1;
      grouped[d].motionEvents+=Math.round(s.minutes * 0.6);
    } else {
      grouped[d].break+=s.minutes;
      grouped[d].motionEvents+=Math.round(s.minutes * 0.3);
    }
  }
  rows.push(...Object.values(grouped));
  return rows;
}
function analyticsPage(){
  const rows=analyticsRows();
  const filtered=rows.slice().sort((a,b)=>state.tableSort==='date'?(state.sortDirection==='asc'?a.date.localeCompare(b.date):b.date.localeCompare(a.date)):(state.sortDirection==='asc'?a.focus-b.focus:b.focus-a.focus)).slice(0,state.analyticsPeriod==='all'?rows.length:Number(state.analyticsPeriod));
  const focusTotal=rows.reduce((a,b)=>a+b.focus,0);
  const sessionsTotal=rows.reduce((a,b)=>a+b.sessions,0);
  const breakTotal=rows.reduce((a,b)=>a+b.break,0);
  const motionTotal=rows.reduce((a,b)=>a+(b.motionEvents||0),0);
  return `${pageIntro('Study Analytics','A clear, explainable view of activity—not a measure of concentration.',`<select class="table-select" data-analytics-period aria-label="Choose history period"><option value="7" ${state.analyticsPeriod===7?'selected':''}>Last 7 entries</option><option value="30" ${state.analyticsPeriod===30?'selected':''}>Last 30 entries</option><option value="all" ${state.analyticsPeriod==='all'?'selected':''}>All history</option></select>`)}${demoBanner('Sample history and locally completed timer sessions are clearly separated; PIR events represent movement triggers.')}<section class="analytics-summary">
    ${metric('Total focus time',`${Math.floor(focusTotal/60)}h ${focusTotal%60}m`,state.hideSamples?'Local browser sessions':'Sample + local session history','clock')}
    ${metric('Completed focus sessions',sessionsTotal,'Recorded sessions only','check','blue')}
    ${metric('Total break time',`${breakTotal} min`,'Sample + local session history','coffee','amber')}
    ${metric('PIR motion events',`${motionTotal} triggers`,'Movement triggers recorded · sample + local','motion')}
  </section><div class="analytics-charts"><section class="card">${cardHead('Weekly focus time','Sample minutes per day · same dataset as dashboard')}${chartShell('analytics-weekly-chart',true)}</section><section class="card">${cardHead('Focus vs. break','Illustrative time distribution')}${chartShell('focus-break-chart',true)}<div class="subtle-label">Focus / break durations from sample summary data.</div></section></div><div class="analytics-bottom"><section class="card table-card">${cardHead('Study & motion history','Sample entries plus sessions completed in this browser',`<button class="text-link" data-action="sort-history">Sort ${state.tableSort==='date'?'by focus time':'by date'} ${icon('arrow')}</button>`)}${filtered.length?`<div class="table-wrap"><table class="history-table"><thead><tr><th>Date</th><th>Focus duration</th><th>Completed sessions</th><th>Break duration</th><th>Motion triggers</th><th>Interruptions</th></tr></thead><tbody>${filtered.map(r=>`<tr><td>${niceDate(r.date)} ${r.source==='local'?'<span class="subtle-label">LOCAL</span>':''}</td><td>${Math.floor(r.focus/60)}h ${r.focus%60}m</td><td>${r.sessions}</td><td>${r.break} min</td><td>${r.motionEvents||0}</td><td>${r.interruptions}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state"><span class="empty-icon">${icon('book')}</span><strong>No study history yet</strong><p>Complete a focus session and it will appear here.</p></div>`}</section></div>`;
}
function deviceCard(d,index){
  return `<section class="card device-card"><div class="device-top"><div class="device-title"><span class="device-icon">${icon('device')}</span><div><h3>${escapeHTML(d.name)}</h3><p>${escapeHTML(d.id)} · ${d.mode||'Demo'}</p></div></div><span class="status-badge amber">Demo</span></div><div class="device-meta"><div><small>Hardware</small><strong>${escapeHTML(d.hardware||'NodeMCU ESP8266')}</strong></div><div><small>Last communication</small><strong>Not connected</strong></div><div><small>Motion sensor</small><strong>${escapeHTML(d.motion||'PIR Motion Sensor')} · Demo</strong></div><div><small>Light sensor</small><strong>${escapeHTML(d.light||'LDR')} · Demo</strong></div></div><div class="device-actions"><button class="btn btn-sm" data-action="device-details" data-index="${index}">View details</button>${index>0?`<button class="btn btn-sm btn-danger" data-action="remove-device" data-index="${index}">${icon('trash')} Remove</button>`:''}</div></section>`;
}
function escapeHTML(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function devicesPage(){return `${pageIntro('My Devices','Sample device information is stored in this browser only.')} ${demoBanner('The lamp below is a sample record, not a paired or authenticated physical device.')}<div class="device-grid">${state.devices.length?state.devices.map(deviceCard).join(''):`<section class="card"><div class="empty-state"><span class="empty-icon">${icon('device')}</span><strong>No devices registered</strong><p>Add a local sample device using the form.</p></div></section>`}<section class="card register-card">${cardHead('Register a demo device','Add a local record for presentation purposes.') }<form id="device-form"><div class="form-grid"><div class="form-field"><label for="device-name">Device name</label><input id="device-name" name="name" required minlength="2" maxlength="40" placeholder="e.g. Desk lamp"></div><div class="form-field"><label for="device-id">Device ID</label><input id="device-id" name="id" required pattern="[A-Za-z0-9_-]{3,24}" maxlength="24" placeholder="e.g. LAMP_002" aria-describedby="device-id-help"><p class="form-help" id="device-id-help">3–24 characters: letters, numbers, _ or -.</p></div></div><button class="btn btn-primary" style="margin-top:14px" type="submit">${icon('plus')} Add demo device</button></form></section><div class="info-panel" style="grid-column:1/-1">${icon('info')}<span>Real multi-user deployment will require backend registration, user-device pairing, and ESP8266 token authentication. This demo never implies that a device is physically connected.</span></div></div>`;}
function settingsPage(){
  return `${pageIntro('Settings','Your preferences are saved locally in this browser.')}<div class="settings-layout"><div><section class="card settings-card settings-section">${cardHead('Study preferences','Set the timing, buzzer, and notifications that suit you.') }<div class="settings-fields">${[['focus','Focus duration'],['shortBreak','Short break'],['longBreak','Long break'],['sessionsBeforeLongBreak','Sessions before long break']].map(([key,label])=>`<div class="form-field"><label for="pref-${key}">${label} ${key==='sessionsBeforeLongBreak'?'(2–8)':'(minutes)'}</label><input type="number" id="pref-${key}" data-pref="${key}" min="${key==='sessionsBeforeLongBreak'?2:1}" max="${key==='sessionsBeforeLongBreak'?8:180}" value="${state.prefs[key]}" aria-label="${label}"></div>`).join('')}</div><div class="setting-row" style="margin-top:14px"><div class="setting-label"><strong>Auto-start next focus session</strong><small>Begin a new focus block when a break ends</small></div><label class="switch"><input type="checkbox" data-pref="autoStart" ${state.prefs.autoStart?'checked':''} aria-label="Auto-start next focus session"><span class="switch-track"></span></label></div><div class="setting-row"><div class="setting-label"><strong>Browser notifications</strong><small>Ask permission when enabling this option</small></div><label class="switch"><input type="checkbox" data-pref="notifications" ${state.prefs.notifications?'checked':''} aria-label="Enable browser notifications"><span class="switch-track"></span></label></div><div class="setting-row"><div class="setting-label"><strong>Buzzer & sound alerts</strong><small>Audio alert on timer completion (simulates NodeMCU buzzer)</small></div><div style="display:flex;align-items:center;gap:10px"><button class="btn btn-sm" data-action="test-buzzer" aria-label="Test buzzer alert tone">${icon('buzzer')} Test tone</button><label class="switch"><input type="checkbox" data-pref="sound" ${state.prefs.sound?'checked':''} aria-label="Enable buzzer alert tone"><span class="switch-track"></span></label></div></div></section><section class="card settings-card settings-section">${cardHead('Appearance','Choose a comfortable interface theme.') }<div class="theme-options"><button class="theme-option ${state.prefs.theme==='light'?'selected':''}" data-action="theme" data-theme="light">${icon('sun')} Light</button><button class="theme-option ${state.prefs.theme==='dark'?'selected':''}" data-action="theme" data-theme="dark">${icon('moon')} Dark</button></div></section></div><div><section class="card settings-card settings-section">${cardHead('Demo data','Reset or clear information stored in this browser.') }<div class="info-panel" style="margin-bottom:14px">${icon('info')}<span>These actions only clear local demo settings and history. No external account or hardware is affected.</span></div><div class="settings-actions"><button class="btn" data-action="restore-timer">${icon('reset')} Restore default timer settings</button><button class="btn" data-action="clear-history">${icon('trash')} Clear sample activity history</button><button class="btn btn-danger" data-action="reset-demo">${icon('trash')} Reset all demo data</button></div></section><section class="card settings-card">${cardHead('About this demo','Future hardware integration')}<p class="card-subtitle" style="line-height:1.7">Designed for <strong>NodeMCU ESP8266</strong> with a <strong>PIR motion sensor</strong>, <strong>LDR light sensor</strong>, <strong>White LED</strong> (PWM), and <strong>Piezo buzzer</strong>.<br>Integration points: <code>HardwareBridge.connectWebSocket('ws://...')</code>, <code>GET /api/devices/:deviceId/status</code> (returns PIR motion, light, lamp state), and <code>POST /api/devices/:deviceId/commands</code>. PIR detects infrared movement events; it does not measure distance or identify people.</p><div class="subtle-label" style="margin-top:14px">Smart Focus Guardian · local frontend demo</div></section></div></div>`;
}
function renderCurrentPage(){for(const chart of Object.values(state.charts))chart?.destroy?.();state.charts={};const renderers={dashboard:dashboardPage,focus:focusPage,environment:environmentPage,analytics:analyticsPage,devices:devicesPage,settings:settingsPage};const html=renderers[state.page]();content.innerHTML=state.page==='analytics'?withConsistencyChart(html):html;renderNavIcons();initCharts();updateTimerUI();}
function chartDefaults(){return {responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'#203b2e',padding:10,cornerRadius:8,titleFont:{family:'DM Sans',size:10},bodyFont:{family:'DM Sans',size:10}},},scales:{x:{grid:{display:false},border:{display:false},ticks:{color:'#89948c',font:{family:'DM Sans',size:9}}},y:{beginAtZero:true,grid:{color:'rgba(130,150,135,.14)',drawTicks:false},border:{display:false},ticks:{color:'#89948c',font:{family:'DM Sans',size:9},padding:8}}}};}
function fallbackBars(id, values, labels){const wrap=document.querySelector(`[data-chart-wrap="${id}"]`);if(!wrap)return;const canvas=wrap.querySelector('canvas');const fallback=wrap.querySelector('.chart-fallback');if(canvas)canvas.hidden=true;if(!fallback)return;fallback.hidden=false;const max=Math.max(...values,1);fallback.innerHTML=values.map((v,i)=>`<div class="chart-fallback-col"><i style="height:${Math.max(4,v/max*75)}%"></i><small>${labels[i]}</small></div>`).join('');}
function makeBar(id,labels,values,color='#75a98b',label='Minutes'){const ctx=document.getElementById(id);if(!ctx)return;if(!window.Chart){fallbackBars(id,values,labels);return;}const c=new Chart(ctx,{type:'bar',data:{labels,datasets:[{label,data:values,backgroundColor:labels.map((_,i)=>i===new Date().getDay()-1?'#174c3c':color),borderRadius:6,borderSkipped:false,maxBarThickness:34}]},options:{...chartDefaults(),plugins:{...chartDefaults().plugins,tooltip:{...chartDefaults().plugins.tooltip,callbacks:{label:c=>` ${c.parsed.y} minutes`}}},scales:{...chartDefaults().scales,y:{...chartDefaults().scales.y,ticks:{...chartDefaults().scales.y.ticks,callback:v=>`${v}m`}}}}});state.charts[id]=c;}
function makeDoughnut(id,vals){const ctx=document.getElementById(id);if(!ctx)return;if(!window.Chart){fallbackBars(id,vals,['Focus','Break']);return;}state.charts[id]=new Chart(ctx,{type:'doughnut',data:{labels:['Focus time','Break time'],datasets:[{data:vals,backgroundColor:['#2f7d5b','#91addb'],borderWidth:0,hoverOffset:5}]},options:{responsive:true,maintainAspectRatio:false,cutout:'72%',plugins:{legend:{display:true,position:'bottom',labels:{usePointStyle:true,pointStyle:'circle',padding:18,color:'#78827b',font:{family:'DM Sans',size:10}}},tooltip:chartDefaults().plugins.tooltip}}});}
function makeSensorChart(id){
  const ctx=document.getElementById(id);
  if(!ctx)return;
  if(!window.Chart){fallbackBars(id,sensorHistory.map(x=>x.motionEvents),sensorHistory.map(x=>x.label));return;}
  state.charts[id]=new Chart(ctx,{
    type:'line',
    data:{
      labels:sensorHistory.map(x=>x.label),
      datasets:[
        {label:'PIR motion triggers (events)',data:sensorHistory.map(x=>x.motionEvents),borderColor:'#2f7d5b',backgroundColor:'#2f7d5b22',tension:.35,pointRadius:3,fill:true},
        {label:'Relative light index (0–100)',data:sensorHistory.map(x=>x.light),borderColor:'#4778c7',backgroundColor:'#4778c722',tension:.35,pointRadius:3,fill:false}
      ]
    },
    options:{
      ...chartDefaults(),
      plugins:{
        ...chartDefaults().plugins,
        legend:{display:true,position:'top',align:'end',labels:{usePointStyle:true,pointStyle:'circle',padding:12,color:'#78827b',font:{family:'DM Sans',size:9}}}
      },
      scales:{
        ...chartDefaults().scales,
        y:{...chartDefaults().scales.y,title:{display:true,text:'Trigger events / Relative index',color:'#89948c',font:{family:'DM Sans',size:9}}}
      }
    }
  });
}
function makeConsistency(id){const ctx=document.getElementById(id);const ordered=sampleHistory.slice().reverse();const labels=ordered.map(x=>new Intl.DateTimeFormat('en-US',{weekday:'short'}).format(new Date(`${x.date}T12:00:00`)));const values=ordered.map(x=>x.sessions);if(!ctx)return;if(!window.Chart){fallbackBars(id,values,labels);return;}state.charts[id]=new Chart(ctx,{type:'line',data:{labels,datasets:[{label:'Completed sessions',data:values,borderColor:'#2f7d5b',backgroundColor:'#2f7d5b20',fill:true,tension:.35,pointRadius:3,pointBackgroundColor:'#2f7d5b'}]},options:{...chartDefaults(),plugins:{...chartDefaults().plugins,tooltip:{...chartDefaults().plugins.tooltip,callbacks:{label:c=>` ${c.parsed.y} recorded sessions`}}},scales:{...chartDefaults().scales,y:{...chartDefaults().scales.y,ticks:{...chartDefaults().scales.y.ticks,stepSize:1,callback:v=>`${v}`}}}}});}
function withConsistencyChart(html){return html.replace('</div><div class="analytics-bottom">',`<section class="card consistency-card">${cardHead('Study consistency','Daily completed session counts · sample history only')}${chartShell('consistency-chart',true)}<div class="subtle-label">Consistency is calculated from recorded sessions; it does not measure concentration or cognitive performance.</div></section></div><div class="analytics-bottom">`);}
function initCharts(){if(state.page==='dashboard')makeBar('weekly-chart',sampleWeek.map(x=>x.day),sampleWeek.map(x=>x.minutes));if(state.page==='environment')makeSensorChart('sensor-chart');if(state.page==='analytics'){makeBar('analytics-weekly-chart',sampleWeek.map(x=>x.day),sampleWeek.map(x=>x.minutes));makeDoughnut('focus-break-chart',[135*7,25*7]);makeConsistency('consistency-chart');}}
function updateTimerUI(){if(!['dashboard','focus'].includes(state.page))return;const digits=document.querySelectorAll('.timer-digits');const states=document.querySelectorAll('.timer-state');const rings=document.querySelectorAll('.timer-ring');const buttons=document.querySelectorAll('[data-action="timer-toggle"]');const duration=timerModeDuration();const remaining=remainingNow();const pct=Math.max(0,Math.min(100,remaining/duration*100));digits.forEach(e=>e.textContent=fmt(remaining));states.forEach(e=>e.textContent=state.timer.running?'IN PROGRESS':state.timer.remainingMs===0?'COMPLETE':'READY');rings.forEach(e=>{e.style.setProperty('--progress',`${pct}%`);e.classList.toggle('blue',state.timer.mode!=='focus')});buttons.forEach(b=>{const label=state.timer.running?'Pause':state.timer.remainingMs===0?'Start again':state.timer.remainingMs<duration?'Resume':'Start';b.innerHTML=`${icon(state.timer.running?'pause':'play')}${label}`;b.classList.toggle('btn-primary',!state.timer.running)});const mode=document.querySelector('.timer-mode-label');if(mode){mode.classList.toggle('blue',state.timer.mode!=='focus');mode.innerHTML=`<i class="mode-dot"></i>${modeName()}`;}const label=document.querySelector('.focus-hero-head .timer-mode-label');if(label)label.innerHTML=`<i class="mode-dot"></i>${state.timer.running?'IN PROGRESS':'PERSONAL TIMER'}`;}
function startTimer(){if(state.timer.running)return;if(state.timer.remainingMs<=0)state.timer.remainingMs=timerModeDuration();state.timer.endAt=Date.now()+state.timer.remainingMs;state.timer.running=true;saveTimer();ensureTimerInterval();updateTimerUI();toast(`${modeName()} started.`,'info');}
function pauseTimer(){if(!state.timer.running)return;state.timer.remainingMs=remainingNow();state.timer.running=false;state.timer.endAt=null;saveTimer();updateTimerUI();toast('Timer paused.');}
function resetTimer(){state.timer.running=false;state.timer.endAt=null;state.timer.remainingMs=timerModeDuration();saveTimer();updateTimerUI();toast('Timer reset.');}
function setTimerMode(mode){if(!['focus','shortBreak'].includes(mode))return;if(state.timer.running){toast('Pause or finish the current session before switching modes.','error');return;}state.timer.mode=mode;state.timer.remainingMs=timerModeDuration();state.timer.endAt=null;saveTimer();renderCurrentPage();}
function ensureTimerInterval(){if(state.timerInterval)return;state.timerInterval=setInterval(()=>{if(!state.timer.running)return;state.timer.remainingMs=remainingNow();if(state.timer.remainingMs<=0)finishTimer();else updateTimerUI();},250);}
function finishTimer(){
  state.timer.remainingMs=0;
  state.timer.running=false;
  state.timer.endAt=null;
  const finishedMode=state.timer.mode;
  const mins=finishedMode==='focus'?state.prefs.focus:finishedMode==='longBreak'?state.prefs.longBreak:state.prefs.shortBreak;
  state.sessions.push({mode:finishedMode==='focus'?'focus':'break',minutes:mins,completedAt:new Date().toISOString()});
  saveSessions();
  if(finishedMode==='focus'){
    state.timer.completed+=1;
    state.timer.cycle=((state.timer.completed-1)%state.prefs.sessionsBeforeLongBreak)+1;
    const long=state.timer.completed%state.prefs.sessionsBeforeLongBreak===0;
    state.timer.mode=long?'longBreak':'shortBreak';
    state.timer.remainingMs=(long?state.prefs.longBreak:state.prefs.shortBreak)*60000;
    state.timer.endAt=Date.now()+state.timer.remainingMs;
    state.timer.running=true;
    toast(`Focus complete. Your ${long?'long':'short'} break starts now.`);
    notify('Focus session complete',`Your ${long?'long':'short'} break is ready.`);
  } else {
    state.timer.mode='focus';
    state.timer.remainingMs=state.prefs.focus*60000;
    state.timer.endAt=null;
    if(state.prefs.autoStart){
      state.timer.running=true;
      state.timer.endAt=Date.now()+state.timer.remainingMs;
      toast('Break complete. Your next focus session has started.');
    } else {
      toast('Break complete. Start your next focus session when ready.');
    }
    notify('Break complete','Take a breath, then begin your next focus block.');
  }
  saveTimer();
  playSound();
  if(['dashboard','focus'].includes(state.page)) renderCurrentPage();
}
function notify(title,body){if(state.prefs.notifications&&'Notification'in window&&Notification.permission==='granted')new Notification(title,{body});}
function playSound(){
  if(!state.prefs.sound)return;
  try{
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return;
    const ctx=new Ctx();
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    // Two-tone chime simulating piezo buzzer
    osc.type='sine';
    osc.frequency.setValueAtTime(780, ctx.currentTime);
    osc.frequency.setValueAtTime(1040, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime+0.35);
    osc.onended=()=>ctx.close();
  }catch{}
}
function setPref(key,value){
  if(key==='autoStart'||key==='sound'){state.prefs[key]=Boolean(value);persistPrefs();return;}
  if(key==='notifications'){
    if(value&&'Notification'in window&&Notification.permission==='default'){
      Notification.requestPermission().then(p=>{state.prefs.notifications=p==='granted';persistPrefs();toast(p==='granted'?'Notifications enabled.':'Browser notification permission was not granted.','info');renderCurrentPage();});
      return;
    }
    state.prefs.notifications=Boolean(value)&&(!('Notification'in window)||Notification.permission==='granted');
    persistPrefs();
    return;
  }
  const max=key==='sessionsBeforeLongBreak'?8:180,min=key==='sessionsBeforeLongBreak'?2:1;
  state.prefs[key]=clamp(value,min,max);
  persistPrefs();
  if(!state.timer.running&&state.timer.mode===(key==='focus'?'focus':key==='shortBreak'?'shortBreak':key==='longBreak'?'longBreak':'')){
    state.timer.remainingMs=timerModeDuration();
    saveTimer();
  }
}
function handlePrefInput(el){
  const k=el.dataset.pref;
  if(el.type==='checkbox'){
    setPref(k,el.checked);
    if(k==='autoStart'||k==='notifications'||k==='sound')toast(`${k==='autoStart'?'Auto-start':k==='sound'?'Buzzer / Sound':'Notifications'} preference updated.`);
    return;
  }
  if(el.value==='')return;
  const value=clamp(el.value,k==='sessionsBeforeLongBreak'?2:1,k==='sessionsBeforeLongBreak'?8:180);
  setPref(k,value);
  renderCurrentPage();
}
function saveTimerSettings(){document.querySelectorAll('.focus-bottom-row [data-pref]').forEach(el=>{if(el.type==='checkbox')setPref(el.dataset.pref,el.checked);else if(el.value)setPref(el.dataset.pref,el.value)});toast('Timer preferences saved.');renderCurrentPage();}
function renderProfileModal(){openModal(`<h2 id="modal-title">Student profile</h2><p>This is a local demo account. There is no sign-in or user profile service connected.</p><div class="modal-detail"><div><small>Account</small><strong>Student</strong></div><div><small>Mode</small><strong>Demo Account</strong></div><div><small>Data storage</small><strong>This browser only</strong></div><div><small>Hardware</small><strong>Not connected</strong></div></div><button class="btn btn-primary" data-action="close-modal">Done</button>`);}
function openModal(html){const modal=document.getElementById('modal');document.getElementById('modal-content').innerHTML=html;modal.hidden=false;modal.querySelector('.modal-close').focus();}
function closeModal(){document.getElementById('modal').hidden=true;}
function clickAction(action,el){
  switch(action){
    case 'timer-toggle':state.timer.running?pauseTimer():startTimer();break;
    case 'timer-reset':resetTimer();break;
    case 'set-mode':setTimerMode(el.dataset.mode);break;
    case 'save-timer-settings':saveTimerSettings();break;
    case 'test-buzzer':playSound();toast('Playing buzzer alert chime.');break;
    case 'toggle-motion':HardwareBridge.simulateMotion();renderCurrentPage();toast(`PIR status: ${HardwareBridge.data.motionStatus}`);break;
    case 'theme':state.prefs.theme=el.dataset.theme;persistPrefs();applyTheme();renderCurrentPage();toast(`${state.prefs.theme==='dark'?'Dark':'Light'} theme enabled.`);break;
    case 'notifications':openModal(`<h2 id="modal-title">Notifications</h2><p>You’re all caught up. Session reminders appear here as browser notifications only if you enable them in Settings and grant browser permission.</p><div class="info-panel">${icon('bell')}<span>Timer status and sensor alerts shown in this demo are local. No live hardware alerts are available.</span></div><button class="btn btn-primary" style="margin-top:16px" data-page="settings">Open settings</button>`);break;
    case 'profile-menu':renderProfileModal();break;
    case 'close-modal':closeModal();break;
    case 'sort-history':state.tableSort=state.tableSort==='date'?'focus':'date';state.sortDirection=state.sortDirection==='asc'?'desc':'asc';renderCurrentPage();break;
    case 'device-details':{
      const d=state.devices[Number(el.dataset.index)];
      if(d)openModal(`<h2 id="modal-title">${escapeHTML(d.name)}</h2><p>Device details · demo record only</p><div class="modal-detail"><div><small>Device ID</small><strong>${escapeHTML(d.id)}</strong></div><div><small>Mode</small><strong>Demo</strong></div><div><small>Motion sensor</small><strong>${escapeHTML(d.motion||'PIR Motion Sensor')}</strong></div><div><small>Light sensor</small><strong>${escapeHTML(d.light||'LDR')}</strong></div><div><small>Connectivity</small><strong>Not connected</strong></div><div><small>Last communication</small><strong>None</strong></div></div><button class="btn btn-primary" data-action="close-modal">Close</button>`);
      break;
    }
    case 'remove-device':{
      const idx=Number(el.dataset.index);
      if(idx>0&&confirm(`Remove the local demo record “${state.devices[idx]?.name}”?`)){
        state.devices.splice(idx,1);
        store(KEYS.devices,state.devices);
        renderCurrentPage();
        toast('Demo device record removed.');
      }
      break;
    }
    case 'restore-timer':
      if(confirm('Restore default timer preferences?')){
        state.prefs={...state.prefs,...DEFAULTS};
        persistPrefs();
        if(!state.timer.running){
          state.timer.mode='focus';
          state.timer.remainingMs=state.prefs.focus*60000;
          saveTimer();
        }
        renderCurrentPage();
        toast('Default timer settings restored.');
      }
      break;
    case 'clear-history':
      if(confirm('Clear the sample activity history from this browser view?')){
        state.hideSamples=true;
        store(KEYS.hideSamples,true);
        renderCurrentPage();
        toast('Sample activity history cleared.');
      }
      break;
    case 'reset-demo':
      if(confirm('Reset all demo data, including timer history, devices, preferences and lamp controls?')){
        Object.values(KEYS).forEach(k=>localStorage.removeItem(k));
        location.reload();
      }
      break;
  }
}
document.addEventListener('click',e=>{
  const pageButton=e.target.closest('[data-page]');
  if(pageButton){e.preventDefault();closeModal();navigate(pageButton.dataset.page);return;}
  const actionButton=e.target.closest('[data-action]');
  if(actionButton){clickAction(actionButton.dataset.action,actionButton);return;}
});
document.addEventListener('change',e=>{
  const el=e.target;
  if(el.matches('[data-pref]')){handlePrefInput(el);return;}
  if(el.matches('[data-lamp]')){
    if(el.dataset.lamp==='brightness'){
      state.lamp.brightness=Number(el.value);
      const out=document.getElementById('brightness-value');
      if(out)out.textContent=`${el.value}%`;
      saveLamp();
      return;
    }
    state.lamp[el.dataset.lamp]=el.checked;
    if(el.dataset.lamp==='auto'&&el.checked){
      state.lamp.brightness=HardwareBridge.data.lighting==='DIM'?85:HardwareBridge.data.lighting==='BRIGHT'?45:70;
    }
    saveLamp();
    renderCurrentPage();
    toast(el.dataset.lamp==='on'?`White LED lamp turned ${el.checked?'on':'off'} in demo.`:`Automatic brightness ${el.checked?'enabled':'disabled'} in demo.`,'info');
    return;
  }
  if(el.matches('[data-analytics-period]')){state.analyticsPeriod=el.value==='all'?'all':Number(el.value);renderCurrentPage();}
});
document.addEventListener('input',e=>{
  const el=e.target;
  if(el.matches('[data-lamp="brightness"]')){
    state.lamp.brightness=Number(el.value);
    const out=document.getElementById('brightness-value');
    if(out)out.textContent=`${el.value}%`;
    saveLamp();
  }
});
document.addEventListener('submit',e=>{
  if(e.target.id!=='device-form')return;
  e.preventDefault();
  const form=new FormData(e.target);
  const name=String(form.get('name')||'').trim();
  const id=String(form.get('id')||'').trim();
  if(!/^[A-Za-z0-9_-]{3,24}$/.test(id)){toast('Device ID must be 3–24 letters, numbers, underscores, or hyphens.','error');return;}
  if(state.devices.some(d=>d.id.toLowerCase()===id.toLowerCase())){toast('That device ID is already in your local device list.','error');return;}
  state.devices.push({name,id,mode:'Demo',hardware:'NodeMCU ESP8266',motion:'PIR Motion Sensor',light:'LDR'});
  store(KEYS.devices,state.devices);
  renderCurrentPage();
  toast(`${name} added as a local demo record.`);
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
document.getElementById('modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});
document.addEventListener('visibilitychange',()=>{if(state.timer.running){state.timer.remainingMs=remainingNow();if(state.timer.remainingMs<=0)finishTimer();else{saveTimer();updateTimerUI();}}});
window.addEventListener('beforeunload',saveTimer);

function recoverTimer(){
  if(state.timer.running&&state.timer.endAt){
    state.timer.remainingMs=Math.max(0,state.timer.endAt-Date.now());
    if(state.timer.remainingMs===0)finishTimer();else ensureTimerInterval();
  }else if(!Number.isFinite(state.timer.remainingMs)||state.timer.remainingMs<=0){
    state.timer.remainingMs=timerModeDuration();
  }
}

function init(){
  state.timer.completed=Number(state.timer.completed)||0;
  state.timer.cycle=Number(state.timer.cycle)||1;
  if(!Number.isFinite(state.timer.remainingMs))state.timer.remainingMs=timerModeDuration();
  renderNavIcons();
  applyTheme();
  renderMobileNav();
  updateHeader();
  renderCurrentPage();
  recoverTimer();
  ensureTimerInterval();
  setInterval(()=>{
    if(state.page==='dashboard'){
      const date=document.querySelector('.page-intro .date-label');
      if(date)date.textContent=dateLong();
    }
  },60000);
}

init();

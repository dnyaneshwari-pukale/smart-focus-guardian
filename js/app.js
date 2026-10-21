import { demoSensorSnapshot, sampleWeek, sampleHistory, sampleActivities, sensorHistory } from './demo-data.js';
import { API, API_CONFIG, setApiBaseUrl, setUserToken, clearUserToken } from './api.js';

const DEFAULTS = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
  sessionsBeforeLongBreak: 4,
  autoStart: false,
  notifications: false,
  sound: true,
  theme: 'light',
  autoLamp: true,
  ldrThreshold: 35,
  systemMode: 'demo' // 'demo' | 'hardware'
};

const KEYS = {
  user: 'sfg.user.v1',
  prefs: 'sfg.preferences.v1',
  timer: 'sfg.timer.v1',
  devices: 'sfg.devices.v1',
  sessions: 'sfg.sessions.v1',
  lamp: 'sfg.lamp.v1',
  hideSamples: 'sfg.hideSamples.v1',
  systemMode: 'sfg.systemMode.v1'
};

const PAGE_META = {
  dashboard: ['Dashboard', 'STUDY WORKSPACE', 'A clear view of your study rhythm.'],
  focus: ['Focus Room', 'FOCUS SPACE', 'A quieter place to do one thing at a time.'],
  environment: ['Environment', 'ROOM CONDITIONS', 'Real-time sensor readings and lamp controls.'],
  analytics: ['Study Analytics', 'YOUR PROGRESS', 'Understand your routine with verified session statistics.'],
  devices: ['My Devices', 'DEVICE MANAGEMENT', 'Manage registered NodeMCU ESP8266 devices.'],
  settings: ['Settings', 'PREFERENCES', 'Configure timer, lighting thresholds, and hardware integration.'],
  login: ['Sign In', 'STUDENT ACCESS', 'Sign in to access your personal study workspace and devices.'],
  register: ['Create Account', 'GET STARTED', 'Join Smart Focus Guardian to save your study progress.']
};

const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  timer: '<circle cx="12" cy="13" r="8.5"/><path d="M12 8v5l3.5 2M9 2h6M12 2v2M19 6l1.5-1.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
  chart: '<path d="M3 3v18h18M8 15l4-4 4 3 5-7"/><path d="M17 7h4v4"/>',
  cpu: '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 9h6v6H9zM9 1v4m6-4v4M9 19v4m6-4v4M1 9h4m-4 6h4m14-6h4m-4 6h4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.7-1.4-2.4L7.5 15a8 8 0 0 1 0-1.9L6.1 12l1.4-2.4 1.7.7a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 1.9Z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  close: '<path d="m18 6-12 12M6 6l12 12"/>',
  arrow: '<path d="M5 12h14m-7-7 7 7-7 7"/>',
  arrowUp: '<path d="m7 14 5-5 5 5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  pause: '<path d="M8 5h3v14H8zm6 0h3v14h-3z"/>',
  play: '<path d="m8 5 12 7-12 7z"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  coffee: '<path d="M10 2v2m4-2v2M4 7h14l-1.5 12h-11L4 7Zm14 2h2a2 2 0 0 1 0 4h-2M7 22h9"/>',
  bulb: '<path d="M9 18h6m-5 4h4m-5-7a7 7 0 1 1 6 0c-.8.5-1 1.2-1 2h-4c0-.8-.2-1.5-1-2Z"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>',
  device: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  focus: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  moon: '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
  trash: '<path d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6"/>',
  plus: '<path d="M12 5v14m-7-7h14"/>',
  lightning: '<path d="m13 2-3 8h7L11 22l2-9H6l7-11Z"/>',
  history: '<path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5m4-1v5l3 2"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  motion: '<path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14M16.24 7.76a6 6 0 0 1 0 8.48M7.76 7.76a6 6 0 0 0 0 8.48"/>',
  buzzer: '<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24m-2.12-5.66A9.97 9.97 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  logOut: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9"/>'
};

const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.info}</svg>`;
const readJSON = (key, fallback) => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
const store = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { toast('This browser could not save your preference.', 'error'); } };
const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || min));
const escapeHTML = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Initial persistent preferences
const storedPrefs = readJSON(KEYS.prefs, {});
const storedSystemMode = localStorage.getItem(KEYS.systemMode) || storedPrefs.systemMode || 'demo';

export const state = {
  page: 'dashboard',
  user: readJSON(KEYS.user, null),
  systemMode: storedSystemMode, // 'demo' | 'hardware'
  backend: {
    connected: false,
    checkedAt: null,
    mode: 'checking',
    notice: ''
  },
  device: {
    id: 'LAMP_001',
    name: 'Smart Focus Lamp',
    effectiveStatus: 'demo', // 'online' | 'offline' | 'demo'
    lastSeen: null
  },
  sensor: {
    pirMotion: true,
    motionStatus: 'Motion Detected',
    lastMotionTime: 'Just now',
    relativeLight: 62,
    lightingCategory: 'ADEQUATE',
    lampOn: true,
    source: 'DEMO',
    recordedAt: new Date().toISOString()
  },
  commandFeedback: {
    status: 'idle', // 'idle' | 'pending' | 'acknowledged' | 'failed'
    message: ''
  },
  prefs: { ...DEFAULTS, ...storedPrefs, systemMode: storedSystemMode },
  timer: {
    mode: 'focus',
    running: false,
    remainingMs: (storedPrefs.focus || DEFAULTS.focus) * 60000,
    endAt: null,
    completed: 0,
    cycle: 1,
    currentSessionId: null,
    ...(readJSON(KEYS.timer, {}) || {})
  },
  devices: readJSON(KEYS.devices, [
    { name: 'Smart Focus Lamp', id: 'LAMP_001', hardware: 'NodeMCU ESP8266', motion: 'PIR Motion Sensor', light: 'LDR', mode: storedSystemMode === 'hardware' ? 'Hardware' : 'Demo' }
  ]),
  sessions: readJSON(KEYS.sessions, []),
  serverSessions: [],
  analyticsSummary: null,
  weeklyData: null,
  lamp: {
    on: true,
    auto: true,
    brightness: 70,
    ...(readJSON(KEYS.lamp, {}) || {})
  },
  hideSamples: readJSON(KEYS.hideSamples, false),
  timerInterval: null,
  charts: {},
  analyticsPeriod: 7,
  tableSort: 'date',
  sortDirection: 'desc'
};

const content = document.getElementById('page-content');

function persistPrefs() { store(KEYS.prefs, state.prefs); }
function saveTimer() { store(KEYS.timer, state.timer); }
function saveSessions() { store(KEYS.sessions, state.sessions); }
function saveLamp() { store(KEYS.lamp, state.lamp); }
function dateLong(date = new Date()) { return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(date); }
function niceDate(iso) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${iso}T12:00:00`)); }

function toast(message, kind = 'success') {
  const region = document.getElementById('toast-region');
  if (!region) return;
  const item = document.createElement('div');
  item.className = `toast ${kind === 'error' ? 'error' : kind === 'info' ? 'info' : ''}`;
  item.textContent = message;
  region.append(item);
  setTimeout(() => item.remove(), 3600);
}

function applyTheme() {
  document.body.classList.toggle('dark-theme', state.prefs.theme === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', state.prefs.theme === 'dark' ? '#141b17' : '#f6f8f6');
}

function updateHeader() {
  const [title, eyebrow] = PAGE_META[state.page];
  document.getElementById('page-title').textContent = title;
  document.getElementById('header-eyebrow').textContent = eyebrow;
  document.querySelectorAll('[data-page]').forEach(el => el.classList.toggle('active', el.dataset.page === state.page));

  // Update topbar badges
  const modePill = document.querySelector('.demo-pill');
  const modeLabel = document.getElementById('topbar-mode-label');
  if (modePill && modeLabel) {
    const isHw = state.systemMode === 'hardware';
    modePill.classList.toggle('hardware', isHw);
    modeLabel.textContent = isHw ? 'HARDWARE MODE' : 'DEMO MODE';
  }

  const backendBadge = document.getElementById('backend-status-badge');
  if (backendBadge) {
    if (state.backend.connected) {
      backendBadge.className = 'backend-badge connected';
      backendBadge.textContent = 'Backend: Connected';
      backendBadge.title = `Connected to API at ${API_CONFIG.baseUrl} (${state.backend.mode === 'mysql' ? 'MySQL Active' : 'In-Memory Fallback'})`;
    } else {
      backendBadge.className = 'backend-badge offline';
      backendBadge.textContent = 'Backend: Offline';
      backendBadge.title = `Cannot reach API at ${API_CONFIG.baseUrl}. Operating in offline client mode.`;
    }
  }

  // Update student profile indicators in topbar and sidebar
  const userName = state.user?.name || state.user?.fullName || 'Student';
  const userEmail = state.user?.email || 'Demo Account';
  const userInitial = (userName.charAt(0) || 'S').toUpperCase();

  const topProfileName = document.querySelector('.top-profile-name');
  if (topProfileName) topProfileName.textContent = state.user ? userName : 'Student';
  const topAvatar = document.querySelector('.top-profile .avatar');
  if (topAvatar) topAvatar.textContent = userInitial;

  const sideAvatar = document.querySelector('.sidebar-profile .avatar');
  if (sideAvatar) sideAvatar.textContent = userInitial;
  const sideCopyStrong = document.querySelector('.sidebar-profile .profile-copy strong');
  if (sideCopyStrong) sideCopyStrong.textContent = userName;
  const sideCopySmall = document.querySelector('.sidebar-profile .profile-copy small');
  if (sideCopySmall) sideCopySmall.textContent = state.user ? userEmail : 'Demo Account';

  const navAuthLabel = document.getElementById('nav-auth-label');
  if (navAuthLabel) {
    navAuthLabel.textContent = state.user ? 'Account' : 'Sign In';
  }
}

function renderNavIcons() {
  document.querySelectorAll('#navigation [data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
  document.querySelectorAll('.icon-button [data-icon],.top-profile [data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
}

function renderMobileNav() {
  const nav = document.getElementById('mobile-navigation');
  if (!nav) return;
  const items = [
    ['dashboard', 'grid', 'Home'],
    ['focus', 'timer', 'Focus'],
    ['environment', 'sun', 'Room'],
    ['analytics', 'chart', 'Analytics'],
    ['devices', 'cpu', 'Devices'],
    ['settings', 'settings', 'Settings']
  ];
  nav.innerHTML = items.map(([p, i, l]) =>
    `<button data-page="${p}" class="${state.page === p ? 'active' : ''}" aria-label="Open ${l}">${icon(i)}<span>${l}</span></button>`
  ).join('');
}

function navigate(page) {
  if (!PAGE_META[page]) return;
  state.page = page;
  if (location.hash !== `#${page}`) {
    history.pushState(null, '', `#${page}`);
  }
  updateHeader();
  renderMobileNav();
  renderCurrentPage();
  content.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function demoBanner(text = '') {
  if (state.systemMode === 'hardware') {
    const isOnline = state.device.effectiveStatus === 'online';
    return `<div class="demo-banner" style="border-color:${isOnline ? 'var(--mint)' : 'var(--amber-soft)'};background:${isOnline ? 'var(--surface-soft)' : '#fbf8f2'}">
      <span class="demo-dot" style="background:${isOnline ? 'var(--green-700)' : 'var(--amber)'}"></span>
      <strong>HARDWARE MODE</strong>
      <span>${isOnline ? 'Receiving live telemetry from NodeMCU ESP8266.' : 'Awaiting communication from NodeMCU ESP8266. Check Wi-Fi & backend IP.'}</span>
    </div>`;
  }
  return `<div class="demo-banner"><span class="demo-dot"></span><strong>DEMO DATA</strong><span>${text || 'Sample information is shown for demonstration. Interactive demo toggles active.'}</span></div>`;
}

function pageIntro(title, sub, extra = '') {
  return `<div class="page-intro"><div><h2>${title}</h2><p>${sub}</p></div>${extra}</div>`;
}

function metric(label, value, note, ico, tone = '') {
  return `<article class="metric-card"><div class="metric-head"><span>${label}</span><span class="metric-icon ${tone}">${icon(ico)}</span></div><div class="metric-value">${value}</div><div class="metric-note">${note}</div></article>`;
}

function cardHead(title, subtitle = '', right = '') {
  return `<div class="card-header"><div><h3 class="card-title">${title}</h3>${subtitle ? `<p class="card-subtitle">${subtitle}</p>` : ''}</div>${right}</div>`;
}

function timerModeDuration() {
  return (state.timer.mode === 'focus' ? state.prefs.focus : state.timer.mode === 'longBreak' ? state.prefs.longBreak : state.prefs.shortBreak) * 60000;
}

function remainingNow() {
  return state.timer.running && state.timer.endAt ? Math.max(0, state.timer.endAt - Date.now()) : Math.max(0, state.timer.remainingMs);
}

function fmt(ms) {
  const sec = Math.ceil(Math.max(0, ms) / 1000);
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

function modeName() {
  return state.timer.mode === 'focus' ? 'Focus Session' : state.timer.mode === 'longBreak' ? 'Long Break' : 'Short Break';
}

function ringMarkup(extra = '') {
  const dur = timerModeDuration();
  const ratio = Math.max(0, Math.min(1, remainingNow() / dur));
  return `<div class="timer-ring ${state.timer.mode !== 'focus' ? 'blue' : ''}" style="--progress:${(ratio * 100).toFixed(2)}%"><div class="timer-ring-inner"><div class="timer-digits">${fmt(remainingNow())}</div><div class="timer-state">${state.timer.running ? 'IN PROGRESS' : state.timer.remainingMs === 0 ? 'COMPLETE' : 'READY'}</div>${extra}</div></div>`;
}

function timerButtons() {
  const label = state.timer.running ? 'Pause' : state.timer.remainingMs === 0 ? 'Start again' : state.timer.remainingMs < timerModeDuration() ? 'Resume' : 'Start';
  return `<div class="timer-control-row"><button class="btn ${state.timer.running ? '' : 'btn-primary'}" data-action="timer-toggle">${icon(state.timer.running ? 'pause' : 'play')}${label}</button><button class="btn" data-action="timer-reset" aria-label="Reset timer">${icon('reset')} Reset</button></div>`;
}

function dashboardTimer() {
  return `<section class="card timer-card">${cardHead('Focus timer', `Cycle ${state.timer.cycle} · ${state.timer.completed} completed sessions`, `<span class="timer-mode-label ${state.timer.mode !== 'focus' ? 'blue' : ''}"><i class="mode-dot"></i>${modeName()}</span>`)}<div class="timer-layout">${ringMarkup()}<div class="timer-details"><div class="mode-switch"><button data-action="set-mode" data-mode="focus" class="${state.timer.mode === 'focus' ? 'selected' : ''}">Focus</button><button data-action="set-mode" data-mode="shortBreak" class="${state.timer.mode !== 'focus' ? 'selected blue' : ''}">Break</button></div><h3>${state.timer.mode === 'focus' ? 'Ready for a focused session?' : 'Take a moment to recharge.'}</h3><p>${state.timer.mode === 'focus' ? 'One calm, uninterrupted block is a good place to begin.' : 'Step away from the desk and give your eyes a rest.'}</p>${timerButtons()}<div class="timer-secondary-controls"><span class="subtle-label">${state.prefs.focus} min focus · ${state.prefs.shortBreak} min break</span></div></div></div><div class="timer-meta"><span>Completed today <strong>${state.timer.completed}</strong></span><span>Next long break <strong>${Math.max(0, state.prefs.sessionsBeforeLongBreak - (state.timer.completed % state.prefs.sessionsBeforeLongBreak))} sessions</strong></span></div></section>`;
}

function activityRows() {
  const local = state.sessions.slice(-4).reverse().map(s => ({
    type: s.mode === 'focus' ? 'focus' : 'break',
    title: s.mode === 'focus' ? 'Focus session completed' : 'Break completed',
    detail: `${s.minutes} min · Local session`,
    time: new Date(s.completedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }));

  const list = state.hideSamples ? local : [...local, ...sampleActivities];
  return list.slice(0, 4).map(a => {
    const aIcon = a.type === 'break' ? 'coffee' : a.type === 'lamp' ? 'bulb' : a.type === 'motion' ? 'motion' : a.type === 'pause' ? 'history' : 'check';
    const aTone = a.type === 'break' ? 'blue' : a.type === 'pause' ? 'amber' : a.type === 'motion' ? 'blue' : '';
    return `<div class="activity-row"><span class="activity-icon ${aTone}">${icon(aIcon)}</span><div class="activity-copy"><strong>${a.title}</strong><small>${a.detail}</small></div><span class="activity-time">${a.time}</span></div>`;
  }).join('');
}

function miniEnvCards() {
  const isMotion = state.sensor.pirMotion;
  const isHardware = state.systemMode === 'hardware';
  const isOnline = isHardware && state.device.effectiveStatus === 'online';
  const devStatusLabel = isHardware ? (isOnline ? 'ESP8266 Online' : 'ESP8266 Offline') : 'Demo Device';
  const devStatusTone = isHardware ? (isOnline ? '' : 'amber') : 'blue';
  const motionBadgeLabel = isHardware && !isOnline ? 'Sensor Offline' : (isMotion ? 'Motion Detected' : 'No Motion');
  const motionBadgeTone = isHardware && !isOnline ? 'amber' : (isMotion ? '' : 'amber');
  const updateTime = state.sensor.lastMotionTime || 'Just now';
  const tag = isHardware ? (isOnline ? 'Hardware Stream' : 'Awaiting Hardware') : 'Simulated Demo';

  return `<div class="env-stack">
    <article class="env-mini-card">
      <span class="env-symbol ${motionBadgeTone}">${icon('motion')}</span>
      <div class="env-mini-copy">
        <strong>PIR Motion Status</strong>
        <small>${motionBadgeLabel} · ${tag}</small>
      </div>
      <span class="status-badge ${motionBadgeTone}">${motionBadgeLabel}</span>
    </article>
    <article class="env-mini-card">
      <span class="env-symbol blue">${icon('bulb')}</span>
      <div class="env-mini-copy">
        <strong>Ambient Light & Lamp</strong>
        <small>${state.sensor.lightingCategory.toLowerCase()} (${state.sensor.relativeLight}/100) · LDR · White LED ${state.lamp.on ? 'ON' : 'OFF'}</small>
      </div>
      <span class="status-badge ${state.lamp.on ? '' : 'amber'}">Lamp ${state.lamp.on ? 'ON' : 'OFF'}</span>
    </article>
    <article class="env-mini-card">
      <span class="env-symbol ${devStatusTone}">${icon('cpu')}</span>
      <div class="env-mini-copy">
        <strong>Device Status & Last Update</strong>
        <small>${escapeHTML(state.device.name || 'Smart Focus Lamp')} · Updated: ${updateTime}</small>
      </div>
      <span class="status-badge ${devStatusTone}">${devStatusLabel}</span>
    </article>
  </div>`;
}

function chartShell(id, fallback = false) {
  return `<div class="chart-wrap" data-chart-wrap="${id}"><canvas id="${id}" aria-label="${id.replaceAll('-', ' ')} chart" role="img"></canvas>${fallback ? '<div class="chart-fallback" hidden></div>' : ''}</div>`;
}

function weeklyChartCard() {
  const weekList = state.weeklyData || sampleWeek;
  const total = weekList.reduce((a, b) => a + (b.minutes || 0), 0);
  return `<section class="card chart-card">
    ${cardHead('Weekly study activity', `${state.systemMode === 'hardware' ? 'Database verified' : 'Illustrative'} focus minutes across the week`, `<span class="weekly-total"><strong>${Math.floor(total / 60)}h ${total % 60}m</strong> this week</span>`)}
    ${chartShell('weekly-chart', true)}
    <div class="subtle-label">${state.systemMode === 'hardware' ? 'Live session database records' : 'Sample data · local sessions are stored in browser & database'}</div>
  </section>`;
}

function dashboardPage() {
  const summary = state.analyticsSummary;
  const todayFocus = summary ? `${Math.floor(summary.today.focusMinutes / 60)}h ${summary.today.focusMinutes % 60}m` : '2h 15m';
  const completedToday = summary ? String(summary.today.completedSessions) : String(state.timer.completed || 4);
  const breakToday = summary ? `${summary.today.breakMinutes} min` : '25 min';
  const consistency = summary ? `${summary.consistency}%` : '84%';

  return `${pageIntro('Welcome back, Student', 'Small focused sessions lead to meaningful progress.', `<span class="date-label">${dateLong()}</span>`)}
  ${demoBanner()}
  <section class="stats-grid">
    ${metric("Today's focus time", todayFocus, state.systemMode === 'hardware' ? 'Verified focus time today' : 'Sample total + local sessions', 'clock')}
    ${metric('Completed sessions', completedToday, 'Recorded sessions today', 'check', 'blue')}
    ${metric('Break time', breakToday, 'Recovery intervals today', 'coffee', 'amber')}
    ${metric('Study consistency', consistency, 'Based on target 4 sessions/day', 'chart')}
  </section>
  <div class="dashboard-main-grid">${dashboardTimer()}${miniEnvCards()}</div>
  <div class="lower-grid">
    <section>${weeklyChartCard()}</section>
    <section class="card">
      ${cardHead('Recent activity', state.systemMode === 'hardware' ? 'Logged session history' : 'Demonstration history', `<button class="text-link" data-page="analytics">View analytics ${icon('arrow')}</button>`)}
      <div class="activity-list">${activityRows()}</div>
      <div class="subtle-label">PIR detects infrared motion; does not verify continuous seated attention.</div>
    </section>
  </div>`;
}

function focusPage() {
  const modeOptions = `<div class="focus-mode-tabs"><button data-action="set-mode" data-mode="focus" class="${state.timer.mode === 'focus' ? 'selected' : ''}">Focus</button><button data-action="set-mode" data-mode="shortBreak" class="${state.timer.mode !== 'focus' ? 'selected blue' : ''}">Break</button></div>`;
  const done = state.timer.completed % state.prefs.sessionsBeforeLongBreak;
  return `<div class="focus-page">
    ${pageIntro('Focus Room', 'Settle into a session at your own pace.', `<span class="status-badge ${state.timer.running ? '' : 'amber'}">${state.timer.running ? 'Timer running' : 'Ready when you are'}</span>`)}
    ${demoBanner()}
    <section class="focus-hero">
      <div class="focus-hero-head">
        <div><h2>${modeName()}</h2><p>One session at a time. Sessions are verified with the backend.</p></div>
        <span class="timer-mode-label ${state.timer.mode !== 'focus' ? 'blue' : ''}"><i class="mode-dot"></i>${state.timer.running ? 'IN PROGRESS' : 'PERSONAL TIMER'}</span>
      </div>
      <div class="focus-center">
        ${ringMarkup()}
        <div class="focus-message">${state.timer.mode === 'focus' ? '“Give this moment your full attention.”' : '“A little rest helps you return refreshed.”'}</div>
        ${modeOptions}
        <div class="subtle-label">${state.timer.completed} completed · cycle ${state.timer.cycle} of ${state.prefs.sessionsBeforeLongBreak}</div>
        <div class="focus-controls">${timerButtons()}</div>
      </div>
    </section>
    <div class="focus-bottom-row">
      <section class="card settings-card">
        ${cardHead('Session lengths', 'Changes apply to the current timer only when it is idle.')}
        ${[['focus', 'Focus session'], ['shortBreak', 'Short break'], ['longBreak', 'Long break']].map(([key, label]) => `
          <div class="setting-row">
            <div class="setting-label"><strong>${label}</strong><small>${key === 'longBreak' ? 'Extended recovery interval' : key === 'focus' ? 'A focused work block' : 'Between focus sessions'}</small></div>
            <div class="field-inline"><input type="number" min="1" max="180" step="1" value="${state.prefs[key]}" data-pref="${key}" aria-label="${label} duration in minutes"><span>min</span></div>
          </div>`).join('')}
        <div class="setting-row">
          <div class="setting-label"><strong>Sessions before long break</strong><small>Long break follows this many focus sessions</small></div>
          <div class="field-inline"><input type="number" min="2" max="8" value="${state.prefs.sessionsBeforeLongBreak}" data-pref="sessionsBeforeLongBreak" aria-label="Sessions before long break"><span>sessions</span></div>
        </div>
        <button class="btn btn-primary btn-sm" data-action="save-timer-settings">Save session settings</button>
      </section>
      <section class="card settings-card">
        ${cardHead('Your rhythm', 'A simple count of completed focus blocks.')}
        <div class="metric-value">${state.timer.completed} <span style="font-size:13px;font-weight:500;letter-spacing:0">sessions</span></div>
        <p class="card-subtitle">${state.prefs.sessionsBeforeLongBreak - done === state.prefs.sessionsBeforeLongBreak ? state.prefs.sessionsBeforeLongBreak : state.prefs.sessionsBeforeLongBreak - done} until your next long break</p>
        <div class="progress-track"><span style="width:${Math.min(100, (done / state.prefs.sessionsBeforeLongBreak) * 100)}%"></span></div>
        <div class="cycle-dots">${Array.from({ length: state.prefs.sessionsBeforeLongBreak }, (_, i) => `<i class="cycle-dot ${i < done ? 'done' : ''}"></i>`).join('')}</div>
        <div class="setting-row" style="margin-top:17px">
          <div class="setting-label"><strong>Auto-start next focus</strong><small>Begin work automatically after a break</small></div>
          <label class="switch"><input type="checkbox" data-pref="autoStart" ${state.prefs.autoStart ? 'checked' : ''} aria-label="Auto-start next focus session"><span class="switch-track"></span></label>
        </div>
        <div class="info-panel" style="margin-top:14px">${icon('info')}<span>Timer countdown uses wall-clock timestamps so it stays accurate if you switch tabs or sleep your screen.</span></div>
      </section>
    </div>
  </div>`;
}

function environmentPage() {
  const isHardware = state.systemMode === 'hardware';
  const isOnline = isHardware && state.device.effectiveStatus === 'online';
  const isMotion = state.sensor.pirMotion;
  const pirDisplay = isHardware && !isOnline ? 'Sensor Offline' : (isMotion ? 'Motion Detected' : 'No Motion');
  const pirTone = isHardware && !isOnline ? 'amber' : (isMotion ? '' : 'amber');
  const pirDesc = isHardware && !isOnline 
    ? 'NodeMCU ESP8266 is offline or waiting for first telemetry poll.'
    : (isMotion ? 'Infrared change detected · Desk area activity logged' : 'No infrared movement detected · Stationary or idle state');
  const lighting = isHardware && !isOnline ? 'OFFLINE' : (state.sensor.lightingCategory || 'ADEQUATE');
  const lightDisplay = isHardware && !isOnline ? 'Offline' : String(state.sensor.relativeLight);
  const cmdStatus = state.commandFeedback.status;
  const cmdMsg = state.commandFeedback.message;

  const hint = isHardware && !isOnline
    ? 'Connect NodeMCU ESP8266 to Wi-Fi to receive live LDR ambient illumination.'
    : (lighting === 'DIM'
      ? 'Ambient light is low. White LED study lamp activation recommended.'
      : lighting === 'BRIGHT'
        ? 'Ambient light is bright; lamp brightness may be reduced.'
        : 'Lighting is in the recommended range for study tasks.');

  return `${pageIntro('Environment', 'Real-time readings and controls for your study desk.', `<span class="date-label" id="sensor-updated">Updated ${state.sensor.lastMotionTime || 'just now'}</span>`)}
  ${demoBanner()}
  <div class="monitor-grid">
    <section class="card sensor-card">
      ${cardHead('PIR motion status', 'Passive Infrared activity detection', `<span class="status-badge ${pirTone}">${pirDisplay}</span>`)}
      <div class="sensor-reading" style="font-size:26px;margin:22px 0 2px">${pirDisplay}</div>
      <div class="sensor-description">${pirDesc}</div>
      <div class="motion-demo-actions">
        <button class="btn btn-sm" data-action="toggle-motion" aria-label="Toggle simulated PIR motion state">${icon('motion')} Simulate ${isMotion ? 'No Motion' : 'Motion Detected'}</button>
        <span class="subtle-label">${isHardware ? 'Hardware mode active (simulation available)' : 'Interactive demo toggle'}</span>
      </div>
      <div class="sensor-info-row">
        <span>PIR Motion Sensor · ${isHardware ? (isOnline ? 'NodeMCU ESP8266 Live' : 'Device Offline') : 'Demo Mode'}</span>
        <span class="info-tip" title="PIR sensors detect infrared changes caused by motion. They do not measure distance, cannot identify persons, and do not reliably detect a person sitting completely still." aria-label="PIR sensor characteristics">i</span>
      </div>
    </section>

    <section class="card sensor-card">
      ${cardHead('Ambient lighting', 'Relative LDR light index', `<span class="status-badge ${isHardware && !isOnline ? 'amber' : 'blue'}">${lighting[0] + lighting.slice(1).toLowerCase()}</span>`)}
      <div class="sensor-reading">${lightDisplay}${isHardware && !isOnline ? '' : '<small> / 100</small>'}</div>
      <div class="sensor-description">Relative LDR sensor reading · not a calibrated lux measurement</div>
      <div class="sensor-info-row">
        <span>${hint}</span>
        <span class="info-tip" title="LDR values are relative (0-100 index) based on photoresistor analog voltage. Not a calibrated lux measurement." aria-label="LDR sensor note">i</span>
      </div>
    </section>

    <section class="card">
      ${cardHead('White LED study lamp controls', isHardware ? 'REST Command Dispatch to ESP8266' : 'Demo lamp controls', `<span class="status-badge ${state.lamp.on ? '' : 'amber'}">${state.lamp.on ? 'Lamp ON' : 'Lamp OFF'}</span>`)}
      <div class="lamp-control-grid">
        <div>
          <div class="lamp-toggle-row">
            <div class="toggle-copy">
              <strong>White LED power</strong>
              <small>${isHardware ? 'Queues command for NodeMCU ESP8266' : 'Frontend demo state'}</small>
            </div>
            <label class="switch">
              <input type="checkbox" data-lamp="on" ${state.lamp.on ? 'checked' : ''} aria-label="Turn White LED lamp on or off">
              <span class="switch-track"></span>
            </label>
          </div>
          <div class="lamp-toggle-row">
            <div class="toggle-copy">
              <strong>Automatic lighting</strong>
              <small>Auto-activate when room LDR &lt; ${state.prefs.ldrThreshold}%</small>
            </div>
            <label class="switch">
              <input type="checkbox" data-lamp="auto" ${state.lamp.auto ? 'checked' : ''} aria-label="Enable automatic brightness">
              <span class="switch-track"></span>
            </label>
          </div>
        </div>
        <div class="range-row">
          <div class="range-label">
            <span>PWM Lamp Brightness</span>
            <strong id="brightness-value">${state.lamp.brightness}%</strong>
          </div>
          <input type="range" min="0" max="100" value="${state.lamp.brightness}" data-lamp="brightness" aria-label="White LED brightness slider">
        </div>
      </div>
      <div style="margin-top:14px;display:flex;align-items:center;justify-content:space-between">
        <span class="subtle-label">${isHardware ? 'ESP8266 polls every 3s and acknowledges execution.' : 'Demo mode: controls update interface immediately.'}</span>
        ${cmdStatus !== 'idle' ? `<span class="cmd-status-badge ${cmdStatus}">${escapeHTML(cmdMsg)}</span>` : ''}
      </div>
    </section>

    <section class="card">
      ${cardHead('Hardware & sensor status', isHardware ? 'NodeMCU ESP8266 Diagnostic Status' : 'Simulation profile')}
      <div class="activity-list">
        <div class="activity-row">
          <span class="activity-icon ${isMotion ? '' : 'amber'}">${icon('motion')}</span>
          <div class="activity-copy">
            <strong>PIR Motion Sensor (D5 / GPIO14)</strong>
            <small>Passive Infrared trigger · ${isHardware ? (state.device.effectiveStatus === 'online' ? 'Active stream' : 'Device offline') : 'Simulated data'}</small>
          </div>
          <span class="status-badge ${isMotion ? '' : 'amber'}">${isMotion ? 'Active' : 'Idle'}</span>
        </div>
        <div class="activity-row">
          <span class="activity-icon blue">${icon('sun')}</span>
          <div class="activity-copy">
            <strong>Ambient light sensor (A0 / ADC0)</strong>
            <small>Photoresistor module · ${isHardware ? 'Analog 0-3.3V divider' : 'Simulated data'}</small>
          </div>
          <span class="status-badge ${isHardware && state.device.effectiveStatus === 'online' ? 'blue' : 'amber'}">${isHardware && state.device.effectiveStatus === 'online' ? 'Online' : 'Demo'}</span>
        </div>
        <div class="activity-row">
          <span class="activity-icon">${icon('bulb')}</span>
          <div class="activity-copy">
            <strong>White LED study lamp (D1 / GPIO5)</strong>
            <small>PWM brightness output · ${state.lamp.on ? 'Active' : 'Standby'}</small>
          </div>
          <span class="status-badge ${state.lamp.on ? '' : 'amber'}">${state.lamp.on ? 'Lamp ON' : 'Lamp OFF'}</span>
        </div>
        <div class="activity-row">
          <span class="activity-icon amber">${icon('buzzer')}</span>
          <div class="activity-copy">
            <strong>Piezo Buzzer (D2 / GPIO4)</strong>
            <small>Session completion chime · Web Audio fallback</small>
          </div>
          <span class="status-badge ${state.prefs.sound ? '' : 'amber'}">${state.prefs.sound ? 'Enabled' : 'Muted'}</span>
        </div>
      </div>
    </section>

    <section class="card sensor-chart-card">
      ${cardHead('Sensor telemetry timeline', 'PIR motion triggers and relative light index over time', `<span class="subtle-label">${isHardware ? 'Recorded readings' : 'Illustrative feed'}</span>`)}
      ${chartShell('sensor-chart', true)}
      <div class="subtle-label">PIR tracks digital movement triggers; relative light index tracks room illumination (0–100).</div>
    </section>
  </div>`;
}

function analyticsRows() {
  const rows = [];
  if (!state.hideSamples && state.systemMode === 'demo') {
    rows.push(...sampleHistory.map(x => ({ ...x, source: 'sample' })));
  }

  // Combine server sessions and local sessions with deduplication
  const allSessions = [...(state.serverSessions || []), ...state.sessions];
  const seenSessions = new Set();
  const grouped = {};

  for (const s of allSessions) {
    const sId = s.sessionId || s.id || `${s.start_time || s.completedAt}_${s.minutes}`;
    if (seenSessions.has(sId)) continue;
    seenSessions.add(sId);

    const rawDate = s.startTime || s.start_time || s.completedAt;
    const d = rawDate ? new Date(rawDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    grouped[d] ??= { date: d, focus: 0, sessions: 0, break: 0, interruptions: 0, motionEvents: 0, source: s.source || 'local' };

    const type = s.sessionType || s.session_type || s.mode;
    const duration = s.actualDurationMin || s.actual_duration_min || s.minutes || 25;

    if (type === 'focus') {
      grouped[d].focus += duration;
      grouped[d].sessions += 1;
      grouped[d].motionEvents += (s.motion_events_count || s.motionEventsCount || Math.round(duration * 0.6));
    } else {
      grouped[d].break += duration;
      grouped[d].motionEvents += Math.round(duration * 0.3);
    }
  }

  rows.push(...Object.values(grouped));
  return rows;
}

function analyticsPage() {
  const rows = analyticsRows();
  const filtered = rows.slice().sort((a, b) =>
    state.tableSort === 'date'
      ? (state.sortDirection === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date))
      : (state.sortDirection === 'asc' ? a.focus - b.focus : b.focus - a.focus)
  ).slice(0, state.analyticsPeriod === 'all' ? rows.length : Number(state.analyticsPeriod));

  const summary = state.analyticsSummary;
  const focusTotal = summary ? summary.totals.focusMinutes : rows.reduce((a, b) => a + b.focus, 0);
  const sessionsTotal = summary ? summary.totals.completedSessions : rows.reduce((a, b) => a + b.sessions, 0);
  const breakTotal = summary ? summary.totals.breakMinutes : rows.reduce((a, b) => a + b.break, 0);
  const motionTotal = summary ? summary.totals.motionEvents : rows.reduce((a, b) => a + (b.motionEvents || 0), 0);

  return `${pageIntro('Study Analytics', 'Transparent progress derived from verified study blocks.', `<select class="table-select" data-analytics-period aria-label="Choose history period"><option value="7" ${state.analyticsPeriod === 7 ? 'selected' : ''}>Last 7 entries</option><option value="30" ${state.analyticsPeriod === 30 ? 'selected' : ''}>Last 30 entries</option><option value="all" ${state.analyticsPeriod === 'all' ? 'selected' : ''}>All history</option></select>`)}
  ${demoBanner()}
  <section class="analytics-summary">
    ${metric('Total focus time', `${Math.floor(focusTotal / 60)}h ${focusTotal % 60}m`, state.systemMode === 'hardware' ? 'Database verified focus duration' : 'Sample + local session history', 'clock')}
    ${metric('Completed focus sessions', sessionsTotal, 'Recorded focus sessions', 'check', 'blue')}
    ${metric('Total break time', `${breakTotal} min`, 'Recorded break intervals', 'coffee', 'amber')}
    ${metric('PIR motion triggers', `${motionTotal} triggers`, 'Desk activity triggers recorded', 'motion')}
  </section>
  <div class="analytics-charts">
    <section class="card">
      ${cardHead('Weekly focus time', `${state.systemMode === 'hardware' ? 'Database verified' : 'Sample'} minutes per day`)}
      ${chartShell('analytics-weekly-chart', true)}
    </section>
    <section class="card">
      ${cardHead('Focus vs. break', 'Time distribution between study and recovery')}
      ${chartShell('focus-break-chart', true)}
      <div class="subtle-label">Ratio of focus blocks to break blocks.</div>
    </section>
  </div>
  <div class="analytics-bottom">
    <section class="card table-card">
      ${cardHead('Study & motion history', 'Individual completed session records', `<button class="text-link" data-action="sort-history">Sort ${state.tableSort === 'date' ? 'by focus time' : 'by date'} ${icon('arrow')}</button>`)}
      ${filtered.length ? `
        <div class="table-wrap">
          <table class="history-table">
            <thead>
              <tr><th>Date</th><th>Focus duration</th><th>Completed sessions</th><th>Break duration</th><th>Motion triggers</th><th>Source</th></tr>
            </thead>
            <tbody>
              ${filtered.map(r => `
                <tr>
                  <td>${niceDate(r.date)}</td>
                  <td>${Math.floor(r.focus / 60)}h ${r.focus % 60}m</td>
                  <td>${r.sessions}</td>
                  <td>${r.break} min</td>
                  <td>${r.motionEvents || 0}</td>
                  <td><span class="status-badge ${r.source === 'sample' ? 'amber' : 'blue'}">${r.source === 'sample' ? 'DEMO' : 'VERIFIED'}</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>` : `
        <div class="empty-state">
          <span class="empty-icon">${icon('book')}</span>
          <strong>No study history yet</strong>
          <p>Complete a focus session and it will appear here.</p>
        </div>`}
    </section>
  </div>`;
}

function deviceCard(d, index) {
  const isOnline = d.effectiveStatus === 'online';
  const isDemo = d.is_demo || d.effectiveStatus === 'demo' || state.systemMode === 'demo';
  const badgeClass = isOnline ? '' : isDemo ? 'amber' : 'red';
  const badgeLabel = isOnline ? 'Online' : isDemo ? 'Demo Mode' : 'Offline';

  return `<section class="card device-card">
    <div class="device-top">
      <div class="device-title">
        <span class="device-icon">${icon('device')}</span>
        <div>
          <h3>${escapeHTML(d.name || 'Smart Focus Lamp')}</h3>
          <p>${escapeHTML(d.device_id || d.id)} · ${escapeHTML(d.device_type || d.hardware || 'NodeMCU ESP8266')}</p>
        </div>
      </div>
      <span class="status-badge ${badgeClass}">${badgeLabel}</span>
    </div>
    <div class="device-meta">
      <div><small>Hardware</small><strong>${escapeHTML(d.device_type || d.hardware || 'NodeMCU ESP8266')}</strong></div>
      <div><small>Last communication</small><strong>${d.last_seen ? new Date(d.last_seen).toLocaleTimeString() : (isDemo ? 'Interactive demo' : 'Not connected')}</strong></div>
      <div><small>Motion sensor</small><strong>PIR Motion Sensor (D5)</strong></div>
      <div><small>Light sensor</small><strong>LDR Module (A0)</strong></div>
    </div>
    <div class="device-actions">
      <button class="btn btn-sm" data-action="device-details" data-index="${index}">View details</button>
      ${index > 0 ? `<button class="btn btn-sm btn-danger" data-action="remove-device" data-index="${index}">${icon('trash')} Remove</button>` : ''}
    </div>
  </section>`;
}

function devicesPage() {
  return `${pageIntro('My Devices', 'Manage registered NodeMCU ESP8266 study companion units.')}
  ${demoBanner()}
  <div class="device-grid">
    ${state.devices.length ? state.devices.map(deviceCard).join('') : `
      <section class="card"><div class="empty-state"><span class="empty-icon">${icon('device')}</span><strong>No devices registered</strong><p>Register your NodeMCU ESP8266 lamp device using the form below.</p></div></section>`}
    <section class="card register-card">
      ${cardHead('Register an ESP8266 device', 'Connect a physical NodeMCU ESP8266 or demo device.')}
      <form id="device-form">
        <div class="form-grid">
          <div class="form-field">
            <label for="device-name">Device name</label>
            <input id="device-name" name="name" required minlength="2" maxlength="40" placeholder="e.g. Desk lamp">
          </div>
          <div class="form-field">
            <label for="device-id">Device ID</label>
            <input id="device-id" name="id" required pattern="[A-Za-z0-9_-]{3,24}" maxlength="24" placeholder="e.g. LAMP_002" aria-describedby="device-id-help">
            <p class="form-help" id="device-id-help">3–24 alphanumeric characters, underscores, or hyphens.</p>
          </div>
        </div>
        <button class="btn btn-primary" style="margin-top:14px" type="submit">${icon('plus')} Register device</button>
      </form>
    </section>
    <div class="info-panel" style="grid-column:1/-1">
      ${icon('info')}
      <span>To connect physical hardware, configure the Wi-Fi credentials and backend IP in <code>backend/firmware/smart_focus_guardian.ino</code>, flash via Arduino IDE, and power the NodeMCU board.</span>
    </div>
  </div>`;
}

function settingsPage() {
  const isHw = state.systemMode === 'hardware';
  return `${pageIntro('Settings', 'Configure session timing, hardware modes, and backend integration.')}
  <div class="settings-layout">
    <div>
      <section class="card settings-card settings-section">
        ${cardHead('Study preferences', 'Set the timing, buzzer, and notifications that suit you.')}
        <div class="settings-fields">
          ${[['focus', 'Focus duration'], ['shortBreak', 'Short break'], ['longBreak', 'Long break'], ['sessionsBeforeLongBreak', 'Sessions before long break']].map(([key, label]) => `
            <div class="form-field">
              <label for="pref-${key}">${label} ${key === 'sessionsBeforeLongBreak' ? '(2–8)' : '(minutes)'}</label>
              <input type="number" id="pref-${key}" data-pref="${key}" min="${key === 'sessionsBeforeLongBreak' ? 2 : 1}" max="${key === 'sessionsBeforeLongBreak' ? 8 : 180}" value="${state.prefs[key]}" aria-label="${label}">
            </div>`).join('')}
        </div>
        <div class="setting-row" style="margin-top:14px">
          <div class="setting-label"><strong>Auto-start next focus session</strong><small>Begin a new focus block when a break ends</small></div>
          <label class="switch"><input type="checkbox" data-pref="autoStart" ${state.prefs.autoStart ? 'checked' : ''} aria-label="Auto-start next focus session"><span class="switch-track"></span></label>
        </div>
        <div class="setting-row">
          <div class="setting-label"><strong>Browser notifications</strong><small>Desktop alerts on timer completion</small></div>
          <label class="switch"><input type="checkbox" data-pref="notifications" ${state.prefs.notifications ? 'checked' : ''} aria-label="Enable browser notifications"><span class="switch-track"></span></label>
        </div>
        <div class="setting-row">
          <div class="setting-label"><strong>Buzzer & audio chime</strong><small>Audio alert tone on session completion</small></div>
          <div style="display:flex;align-items:center;gap:10px">
            <button class="btn btn-sm" data-action="test-buzzer" aria-label="Test buzzer alert tone">${icon('buzzer')} Test tone</button>
            <label class="switch"><input type="checkbox" data-pref="sound" ${state.prefs.sound ? 'checked' : ''} aria-label="Enable buzzer alert tone"><span class="switch-track"></span></label>
          </div>
        </div>
      </section>

      <section class="card settings-card settings-section">
        ${cardHead('Hardware & Backend Integration', 'Configure connection to the Express API and ESP8266.')}
        <div class="form-field" style="margin-bottom:12px">
          <label for="api-base-url">Backend API Base URL</label>
          <div style="display:flex;gap:8px">
            <input type="text" id="api-base-url" value="${escapeHTML(API_CONFIG.baseUrl)}" placeholder="http://localhost:5000">
            <button class="btn btn-sm" data-action="save-api-url">Save URL</button>
            <button class="btn btn-sm btn-primary" data-action="test-api-connection">Test</button>
          </div>
          <p class="form-help">Default: <code>http://localhost:5000</code>. On mobile/ESP8266, use your PC Wi-Fi IP.</p>
        </div>

        <div class="setting-row">
          <div class="setting-label">
            <strong>System Operating Mode</strong>
            <small>${isHw ? 'Hardware Mode: uses live ESP8266 telemetry and REST command dispatch.' : 'Demo Mode: generates test sensor values and simulated acknowledgments.'}</small>
          </div>
          <button class="btn btn-sm ${isHw ? 'btn-primary' : ''}" data-action="toggle-system-mode">
            ${isHw ? 'Switch to Demo Mode' : 'Switch to Hardware Mode'}
          </button>
        </div>

        <div class="setting-row">
          <div class="setting-label"><strong>Auto Lamp Ambient Threshold</strong><small>Room light level below which lamp auto-activates</small></div>
          <div class="field-inline">
            <input type="number" min="10" max="80" value="${state.prefs.ldrThreshold}" data-pref="ldrThreshold">
            <span>/ 100</span>
          </div>
        </div>
      </section>

      <section class="card settings-card settings-section">
        ${cardHead('Appearance', 'Choose an interface theme.')}
        <div class="theme-options">
          <button class="theme-option ${state.prefs.theme === 'light' ? 'selected' : ''}" data-action="theme" data-theme="light">${icon('sun')} Light</button>
          <button class="theme-option ${state.prefs.theme === 'dark' ? 'selected' : ''}" data-action="theme" data-theme="dark">${icon('moon')} Dark</button>
        </div>
      </section>
    </div>

    <div>
      <section class="card settings-card settings-section">
        ${cardHead('Data management', 'Reset or clear local information.')}
        <div class="info-panel" style="margin-bottom:14px">
          ${icon('info')}
          <span>Session history is synchronized with the backend database. Clearing local data only resets this browser.</span>
        </div>
        <div class="settings-actions">
          <button class="btn" data-action="restore-timer">${icon('reset')} Restore default timer settings</button>
          <button class="btn" data-action="clear-history">${icon('trash')} Clear sample activity history</button>
          <button class="btn btn-danger" data-action="reset-demo">${icon('trash')} Reset all local data</button>
        </div>
      </section>

      <section class="card settings-card">
        ${cardHead('ESP8266 Hardware Specifications', 'College Project Reference')}
        <p class="card-subtitle" style="line-height:1.7">
          <strong>Controller:</strong> NodeMCU ESP8266 (ESP-12E/F)<br>
          <strong>PIR Motion:</strong> D5 (GPIO14) · Binary motion events<br>
          <strong>LDR Sensor:</strong> A0 (ADC0) · 0–100 relative index<br>
          <strong>White LED Lamp:</strong> D1 (GPIO5) · PWM brightness control<br>
          <strong>Piezo Buzzer:</strong> D2 (GPIO4) · Audio alert chime<br>
          <strong>API Protocol:</strong> HTTP REST (POST /api/device-data, GET /api/devices/:id/commands/pending)<br>
          <em>Note: PIR sensors detect movement; they do not measure distance or verify continuous seated presence.</em>
        </p>
      </section>
    </div>
  </div>`;
}

function showFormAlert(elementId, message, type = 'error') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = `form-alert ${type}`;
  el.innerHTML = `${icon(type === 'error' ? 'info' : 'check')}<span>${escapeHTML(message)}</span>`;
  el.style.display = 'flex';
}

function loginPage() {
  return `<div class="auth-wrapper">
    <article class="auth-card">
      <div class="auth-head">
        <div class="auth-icon">${icon('lock')}</div>
        <h2>Welcome Back</h2>
        <p>Sign in to sync your study timer, room sensors, and verified analytics.</p>
      </div>

      <form id="login-form" class="auth-form" novalidate>
        <div id="login-alert" class="form-alert error" style="display:none" role="alert"></div>

        <div class="auth-field">
          <label for="login-email">Email Address</label>
          <div class="password-wrap">
            <input type="email" id="login-email" name="email" class="form-control" style="width:100%" placeholder="student@example.com" required autocomplete="email">
          </div>
        </div>

        <div class="auth-field">
          <label for="login-password">Password</label>
          <div class="password-wrap">
            <input type="password" id="login-password" name="password" class="form-control" style="width:100%" placeholder="Enter your password" required autocomplete="current-password">
            <button type="button" class="password-toggle" data-action="toggle-pwd" data-target="login-password" aria-label="Toggle password visibility">
              ${icon('eye')}
            </button>
          </div>
        </div>

        <button type="submit" id="login-submit-btn" class="btn btn-primary btn-wide" style="padding:12px">
          ${icon('user')} Sign In
        </button>

        <div class="demo-quick-box">
          <div>
            <strong>Demo Student Account</strong>
            <small>demo@smartfocusguardian.local / password123</small>
          </div>
          <button type="button" class="btn btn-sm" data-action="fill-demo-login">Auto-fill</button>
        </div>

        <div class="auth-footer">
          Don't have an account? <button type="button" class="link-btn" data-page="register">Create an account</button>
        </div>
      </form>
    </article>
  </div>`;
}

function registerPage() {
  return `<div class="auth-wrapper">
    <article class="auth-card">
      <div class="auth-head">
        <div class="auth-icon">${icon('user')}</div>
        <h2>Create Account</h2>
        <p>Join Smart Focus Guardian to save your study sessions, devices, and preferences.</p>
      </div>

      <form id="register-form" class="auth-form" novalidate>
        <div id="register-alert" class="form-alert error" style="display:none" role="alert"></div>

        <div class="auth-field">
          <label for="reg-name">Full Name</label>
          <div class="password-wrap">
            <input type="text" id="reg-name" name="fullName" class="form-control" style="width:100%" placeholder="e.g. Alex Johnson" required autocomplete="name">
          </div>
        </div>

        <div class="auth-field">
          <label for="reg-email">Email Address</label>
          <div class="password-wrap">
            <input type="email" id="reg-email" name="email" class="form-control" style="width:100%" placeholder="student@example.com" required autocomplete="email">
          </div>
        </div>

        <div class="auth-field">
          <label for="reg-password">Password</label>
          <div class="password-wrap">
            <input type="password" id="reg-password" name="password" class="form-control" style="width:100%" placeholder="At least 6 characters" required autocomplete="new-password">
            <button type="button" class="password-toggle" data-action="toggle-pwd" data-target="reg-password" aria-label="Toggle password visibility">
              ${icon('eye')}
            </button>
          </div>
        </div>

        <div class="auth-field">
          <label for="reg-confirm">Confirm Password</label>
          <div class="password-wrap">
            <input type="password" id="reg-confirm" name="confirmPassword" class="form-control" style="width:100%" placeholder="Re-type your password" required autocomplete="new-password">
            <button type="button" class="password-toggle" data-action="toggle-pwd" data-target="reg-confirm" aria-label="Toggle password visibility">
              ${icon('eye')}
            </button>
          </div>
        </div>

        <button type="submit" id="register-submit-btn" class="btn btn-primary btn-wide" style="padding:12px">
          ${icon('check')} Register Account
        </button>

        <div class="auth-footer">
          Already have an account? <button type="button" class="link-btn" data-page="login">Sign in here</button>
        </div>
      </form>
    </article>
  </div>`;
}

function renderCurrentPage() {
  for (const chart of Object.values(state.charts)) chart?.destroy?.();
  state.charts = {};

  const renderers = {
    dashboard: dashboardPage,
    focus: focusPage,
    environment: environmentPage,
    analytics: analyticsPage,
    devices: devicesPage,
    settings: settingsPage,
    login: loginPage,
    register: registerPage
  };

  const html = renderers[state.page]();
  content.innerHTML = state.page === 'analytics' ? withConsistencyChart(html) : html;
  renderNavIcons();
  initCharts();
  updateTimerUI();
}

function chartDefaults() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#203b2e',
        padding: 10,
        cornerRadius: 8,
        titleFont: { family: 'DM Sans', size: 10 },
        bodyFont: { family: 'DM Sans', size: 10 }
      }
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: '#89948c', font: { family: 'DM Sans', size: 9 } } },
      y: { beginAtZero: true, grid: { color: 'rgba(130,150,135,.14)', drawTicks: false }, border: { display: false }, ticks: { color: '#89948c', font: { family: 'DM Sans', size: 9 }, padding: 8 } }
    }
  };
}

function fallbackBars(id, values, labels) {
  const wrap = document.querySelector(`[data-chart-wrap="${id}"]`);
  if (!wrap) return;
  const canvas = wrap.querySelector('canvas');
  const fallback = wrap.querySelector('.chart-fallback');
  if (canvas) canvas.hidden = true;
  if (!fallback) return;
  fallback.hidden = false;
  const max = Math.max(...values, 1);
  fallback.innerHTML = values.map((v, i) =>
    `<div class="chart-fallback-col"><i style="height:${Math.max(4, (v / max) * 75)}%"></i><small>${labels[i] || ''}</small></div>`
  ).join('');
}

function makeBar(id, labels, values, color = '#75a98b', label = 'Minutes') {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  if (!window.Chart) { fallbackBars(id, values, labels); return; }

  const todayIndex = (new Date().getDay() + 6) % 7; // Mon=0, Sun=6
  const c = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        backgroundColor: labels.map((_, i) => i === todayIndex ? '#174c3c' : color),
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 34
      }]
    },
    options: {
      ...chartDefaults(),
      plugins: {
        ...chartDefaults().plugins,
        tooltip: {
          ...chartDefaults().plugins.tooltip,
          callbacks: { label: c => ` ${c.parsed.y} minutes` }
        }
      },
      scales: {
        ...chartDefaults().scales,
        y: {
          ...chartDefaults().scales.y,
          ticks: { ...chartDefaults().scales.y.ticks, callback: v => `${v}m` }
        }
      }
    }
  });
  state.charts[id] = c;
}

function makeDoughnut(id, vals) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  if (!window.Chart) { fallbackBars(id, vals, ['Focus', 'Break']); return; }

  state.charts[id] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Focus time', 'Break time'],
      datasets: [{
        data: vals,
        backgroundColor: ['#2f7d5b', '#91addb'],
        borderWidth: 0,
        hoverOffset: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { usePointStyle: true, pointStyle: 'circle', padding: 18, color: '#78827b', font: { family: 'DM Sans', size: 10 } }
        },
        tooltip: chartDefaults().plugins.tooltip
      }
    }
  });
}

function makeSensorChart(id) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  if (!window.Chart) {
    fallbackBars(id, sensorHistory.map(x => x.motionEvents), sensorHistory.map(x => x.label));
    return;
  }

  state.charts[id] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sensorHistory.map(x => x.label),
      datasets: [
        { label: 'PIR motion triggers (events)', data: sensorHistory.map(x => x.motionEvents), borderColor: '#2f7d5b', backgroundColor: '#2f7d5b22', tension: 0.35, pointRadius: 3, fill: true },
        { label: 'Relative light index (0–100)', data: sensorHistory.map(x => x.light), borderColor: '#4778c7', backgroundColor: '#4778c722', tension: 0.35, pointRadius: 3, fill: false }
      ]
    },
    options: {
      ...chartDefaults(),
      plugins: {
        ...chartDefaults().plugins,
        legend: { display: true, position: 'top', align: 'end', labels: { usePointStyle: true, pointStyle: 'circle', padding: 12, color: '#78827b', font: { family: 'DM Sans', size: 9 } } }
      },
      scales: {
        ...chartDefaults().scales,
        y: { ...chartDefaults().scales.y, title: { display: true, text: 'Triggers / Relative Index', color: '#89948c', font: { family: 'DM Sans', size: 9 } } }
      }
    }
  });
}

function makeConsistency(id) {
  const ctx = document.getElementById(id);
  const ordered = sampleHistory.slice().reverse();
  const labels = ordered.map(x => new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(`${x.date}T12:00:00`)));
  const values = ordered.map(x => x.sessions);
  if (!ctx) return;
  if (!window.Chart) { fallbackBars(id, values, labels); return; }

  state.charts[id] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Completed sessions',
        data: values,
        borderColor: '#2f7d5b',
        backgroundColor: '#2f7d5b20',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: '#2f7d5b'
      }]
    },
    options: {
      ...chartDefaults(),
      plugins: {
        ...chartDefaults().plugins,
        tooltip: { ...chartDefaults().plugins.tooltip, callbacks: { label: c => ` ${c.parsed.y} recorded sessions` } }
      },
      scales: {
        ...chartDefaults().scales,
        y: { ...chartDefaults().scales.y, ticks: { ...chartDefaults().scales.y.ticks, stepSize: 1, callback: v => `${v}` } }
      }
    }
  });
}

function withConsistencyChart(html) {
  return html.replace('</div><div class="analytics-bottom">', `<section class="card consistency-card">${cardHead('Study consistency', 'Daily completed session counts · verified database entries')}${chartShell('consistency-chart', true)}<div class="subtle-label">Consistency represents session routine; PIR motion does not measure cognitive concentration.</div></section></div><div class="analytics-bottom">`);
}

function initCharts() {
  const weekList = state.weeklyData || sampleWeek;
  if (state.page === 'dashboard') {
    makeBar('weekly-chart', weekList.map(x => x.day), weekList.map(x => x.minutes));
  }
  if (state.page === 'environment') {
    makeSensorChart('sensor-chart');
  }
  if (state.page === 'analytics') {
    makeBar('analytics-weekly-chart', weekList.map(x => x.day), weekList.map(x => x.minutes));
    const summary = state.analyticsSummary;
    const focusMins = summary ? summary.totals.focusMinutes : 135 * 7;
    const breakMins = summary ? summary.totals.breakMinutes : 25 * 7;
    makeDoughnut('focus-break-chart', [Math.max(1, focusMins), Math.max(1, breakMins)]);
    makeConsistency('consistency-chart');
  }
}

function updateTimerUI() {
  if (!['dashboard', 'focus'].includes(state.page)) return;
  const digits = document.querySelectorAll('.timer-digits');
  const states = document.querySelectorAll('.timer-state');
  const rings = document.querySelectorAll('.timer-ring');
  const buttons = document.querySelectorAll('[data-action="timer-toggle"]');
  const duration = timerModeDuration();
  const remaining = remainingNow();
  const pct = Math.max(0, Math.min(100, (remaining / duration) * 100));

  digits.forEach(e => e.textContent = fmt(remaining));
  states.forEach(e => e.textContent = state.timer.running ? 'IN PROGRESS' : state.timer.remainingMs === 0 ? 'COMPLETE' : 'READY');
  rings.forEach(e => {
    e.style.setProperty('--progress', `${pct}%`);
    e.classList.toggle('blue', state.timer.mode !== 'focus');
  });

  buttons.forEach(b => {
    const label = state.timer.running ? 'Pause' : state.timer.remainingMs === 0 ? 'Start again' : state.timer.remainingMs < duration ? 'Resume' : 'Start';
    b.innerHTML = `${icon(state.timer.running ? 'pause' : 'play')}${label}`;
    b.classList.toggle('btn-primary', !state.timer.running);
  });

  const mode = document.querySelector('.timer-mode-label');
  if (mode) {
    mode.classList.toggle('blue', state.timer.mode !== 'focus');
    mode.innerHTML = `<i class="mode-dot"></i>${modeName()}`;
  }
}

function startTimer() {
  if (state.timer.running) return;
  if (state.timer.remainingMs <= 0) state.timer.remainingMs = timerModeDuration();
  state.timer.endAt = Date.now() + state.timer.remainingMs;
  state.timer.running = true;
  if (!state.timer.currentSessionId) {
    state.timer.currentSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  saveTimer();
  ensureTimerInterval();
  updateTimerUI();
  toast(`${modeName()} started.`, 'info');
}

function pauseTimer() {
  if (!state.timer.running) return;
  state.timer.remainingMs = remainingNow();
  state.timer.running = false;
  state.timer.endAt = null;
  saveTimer();
  updateTimerUI();
  toast('Timer paused.');
}

function resetTimer() {
  state.timer.running = false;
  state.timer.endAt = null;
  state.timer.remainingMs = timerModeDuration();
  state.timer.currentSessionId = null;
  saveTimer();
  updateTimerUI();
  toast('Timer reset.');
}

function setTimerMode(mode) {
  if (!['focus', 'shortBreak'].includes(mode)) return;
  if (state.timer.running) {
    toast('Pause or finish the current session before switching modes.', 'error');
    return;
  }
  state.timer.mode = mode;
  state.timer.remainingMs = timerModeDuration();
  state.timer.endAt = null;
  state.timer.currentSessionId = null;
  saveTimer();
  renderCurrentPage();
}

function ensureTimerInterval() {
  if (state.timerInterval) return;
  state.timerInterval = setInterval(() => {
    if (!state.timer.running) return;
    state.timer.remainingMs = remainingNow();
    if (state.timer.remainingMs <= 0) finishTimer();
    else updateTimerUI();
  }, 250);
}

async function finishTimer() {
  state.timer.remainingMs = 0;
  state.timer.running = false;
  state.timer.endAt = null;

  const finishedMode = state.timer.mode;
  const mins = finishedMode === 'focus' ? state.prefs.focus : finishedMode === 'longBreak' ? state.prefs.longBreak : state.prefs.shortBreak;
  const sessionId = state.timer.currentSessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  state.timer.currentSessionId = null;

  const sessionObj = {
    sessionId,
    sessionType: finishedMode,
    mode: finishedMode,
    minutes: mins,
    plannedDurationMin: mins,
    actualDurationMin: mins,
    startTime: new Date(Date.now() - mins * 60000).toISOString(),
    endTime: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    completionStatus: 'COMPLETED',
    source: state.systemMode === 'hardware' ? 'HARDWARE' : 'LOCAL'
  };

  // 1. Local persistence fallback
  state.sessions.push(sessionObj);
  saveSessions();

  // 2. Sync to Backend Database (Idempotent)
  API.createSession(sessionObj).then(res => {
    if (res.ok) {
      console.log('[API] Session synced with database:', sessionId);
      refreshAnalyticsData();
    }
  }).catch(() => {});

  if (finishedMode === 'focus') {
    state.timer.completed += 1;
    state.timer.cycle = ((state.timer.completed - 1) % state.prefs.sessionsBeforeLongBreak) + 1;
    const long = state.timer.completed % state.prefs.sessionsBeforeLongBreak === 0;
    state.timer.mode = long ? 'longBreak' : 'shortBreak';
    state.timer.remainingMs = (long ? state.prefs.longBreak : state.prefs.shortBreak) * 60000;
    state.timer.endAt = Date.now() + state.timer.remainingMs;
    state.timer.running = true;
    toast(`Focus complete! Your ${long ? 'long' : 'short'} break starts now.`);
    notify('Focus session complete', `Your ${long ? 'long' : 'short'} break is ready.`);
  } else {
    state.timer.mode = 'focus';
    state.timer.remainingMs = state.prefs.focus * 60000;
    state.timer.endAt = null;
    if (state.prefs.autoStart) {
      state.timer.running = true;
      state.timer.endAt = Date.now() + state.timer.remainingMs;
      toast('Break complete. Your next focus session has started.');
    } else {
      toast('Break complete. Start your next focus session when ready.');
    }
    notify('Break complete', 'Take a breath, then begin your next focus block.');
  }

  saveTimer();
  playSound();
  if (['dashboard', 'focus'].includes(state.page)) renderCurrentPage();
}

function notify(title, body) {
  if (state.prefs.notifications && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

function playSound() {
  if (!state.prefs.sound) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    // Two-tone chime simulating piezo buzzer
    osc.type = 'sine';
    osc.frequency.setValueAtTime(780, ctx.currentTime);
    osc.frequency.setValueAtTime(1040, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);
    osc.start();
    osc.stop(ctx.currentTime + 0.38);
    osc.onended = () => ctx.close();
  } catch {}
}

function setPref(key, value) {
  if (key === 'autoStart' || key === 'sound' || key === 'autoLamp') {
    state.prefs[key] = Boolean(value);
    persistPrefs();
    API.updateSettings({ [key]: state.prefs[key] }).catch(() => {});
    return;
  }
  if (key === 'notifications') {
    if (value && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(p => {
        state.prefs.notifications = p === 'granted';
        persistPrefs();
        toast(p === 'granted' ? 'Notifications enabled.' : 'Browser notification permission was not granted.', 'info');
        renderCurrentPage();
      });
      return;
    }
    state.prefs.notifications = Boolean(value) && (!('Notification' in window) || Notification.permission === 'granted');
    persistPrefs();
    return;
  }

  const max = key === 'sessionsBeforeLongBreak' ? 8 : key === 'ldrThreshold' ? 80 : 180;
  const min = key === 'sessionsBeforeLongBreak' ? 2 : key === 'ldrThreshold' ? 10 : 1;
  state.prefs[key] = clamp(value, min, max);
  persistPrefs();
  API.updateSettings({ [key]: state.prefs[key] }).catch(() => {});

  if (!state.timer.running && state.timer.mode === (key === 'focus' ? 'focus' : key === 'shortBreak' ? 'shortBreak' : key === 'longBreak' ? 'longBreak' : '')) {
    state.timer.remainingMs = timerModeDuration();
    saveTimer();
  }
}

function handlePrefInput(el) {
  const k = el.dataset.pref;
  if (el.type === 'checkbox') {
    setPref(k, el.checked);
    toast(`${k === 'autoStart' ? 'Auto-start' : k === 'sound' ? 'Buzzer sound' : k === 'autoLamp' ? 'Auto lamp' : 'Notifications'} preference updated.`);
    return;
  }
  if (el.value === '') return;
  const val = Number(el.value);
  setPref(k, val);
  renderCurrentPage();
}

function saveTimerSettings() {
  document.querySelectorAll('.focus-bottom-row [data-pref]').forEach(el => {
    if (el.type === 'checkbox') setPref(el.dataset.pref, el.checked);
    else if (el.value) setPref(el.dataset.pref, el.value);
  });
  toast('Timer preferences saved.');
  renderCurrentPage();
}

/**
 * Dispatches lamp command to backend / ESP8266
 */
async function dispatchLampCommand({ requestedState, brightness, autoMode }) {
  state.commandFeedback = {
    status: 'pending',
    message: 'Command Pending...'
  };
  renderCurrentPage();

  if (state.systemMode === 'demo') {
    // Demo Mode immediate feedback
    setTimeout(() => {
      state.commandFeedback = {
        status: 'acknowledged',
        message: 'Demo Acknowledged'
      };
      state.lamp.on = requestedState;
      if (brightness !== undefined) state.lamp.brightness = brightness;
      if (autoMode !== undefined) state.lamp.auto = autoMode;
      saveLamp();
      renderCurrentPage();
      toast(requestedState ? 'White LED lamp turned ON (Demo).' : 'White LED lamp turned OFF (Demo).', 'info');
    }, 300);
    return;
  }

  // Live Hardware Mode
  const deviceId = state.device.id || 'LAMP_001';
  const res = await API.sendLampCommand(deviceId, {
    requestedState,
    brightness: brightness !== undefined ? brightness : state.lamp.brightness,
    autoMode: autoMode !== undefined ? autoMode : state.lamp.auto
  });

  if (res.ok) {
    state.commandFeedback = {
      status: 'pending',
      message: 'Command Sent (Pending ESP8266 Execution)'
    };
    toast('Command queued for NodeMCU ESP8266.', 'info');

    // Poll for confirmation
    let checks = 0;
    const interval = setInterval(async () => {
      checks++;
      const statusRes = await API.getDeviceStatus(deviceId);
      if (statusRes.ok && statusRes.data) {
        const latest = statusRes.data.latestReading;
        if (latest && latest.lampOn === requestedState) {
          clearInterval(interval);
          state.commandFeedback = {
            status: 'acknowledged',
            message: 'Acknowledged by Device'
          };
          state.lamp.on = requestedState;
          saveLamp();
          renderCurrentPage();
          toast(`ESP8266 confirmed White LED is ${requestedState ? 'ON' : 'OFF'}.`);
          return;
        }
      }

      if (checks >= 6) {
        clearInterval(interval);
        if (state.commandFeedback.status === 'pending') {
          state.commandFeedback = {
            status: 'pending',
            message: 'Queued on server (Awaiting ESP8266 poll)'
          };
          renderCurrentPage();
        }
      }
    }, 1500);
  } else {
    state.commandFeedback = {
      status: 'failed',
      message: `Failed: ${res.error}`
    };
    toast(`Command failed: ${res.error}`, 'error');
  }
  renderCurrentPage();
}

function openModal(html) {
  const modal = document.getElementById('modal');
  document.getElementById('modal-content').innerHTML = html;
  modal.hidden = false;
  modal.querySelector('.modal-close')?.focus();
}

function closeModal() {
  document.getElementById('modal').hidden = true;
}

function renderProfileModal() {
  if (state.user) {
    const userName = state.user.name || state.user.fullName || 'Student';
    openModal(`
      <h2 id="modal-title">${escapeHTML(userName)}</h2>
      <p>Logged in to Smart Focus Guardian.</p>
      <div class="modal-detail">
        <div><small>Email</small><strong>${escapeHTML(state.user.email || 'N/A')}</strong></div>
        <div><small>Account ID</small><strong>${escapeHTML(state.user.userId || state.user.id || 'Active')}</strong></div>
        <div><small>Current Mode</small><strong>${state.systemMode === 'hardware' ? 'Hardware Mode' : 'Demo Mode'}</strong></div>
        <div><small>Database Status</small><strong>${state.backend.connected ? 'Connected (' + state.backend.mode + ')' : 'Offline'}</strong></div>
        <div><small>Registered Lamp</small><strong>${escapeHTML(state.device.id)}</strong></div>
      </div>
      <div style="display:flex;gap:9px;margin-top:16px">
        <button class="btn btn-danger" data-action="logout" style="flex:1">${icon('logOut')} Sign Out</button>
        <button class="btn btn-primary" data-action="close-modal">Done</button>
      </div>
    `);
  } else {
    openModal(`
      <h2 id="modal-title">Student Profile</h2>
      <p>You are currently browsing as a guest / demo student.</p>
      <div class="modal-detail">
        <div><small>Account Status</small><strong>Guest / Demo</strong></div>
        <div><small>Current Mode</small><strong>${state.systemMode === 'hardware' ? 'Hardware Mode' : 'Demo Mode'}</strong></div>
        <div><small>Backend Status</small><strong>${state.backend.connected ? 'Connected (' + state.backend.mode + ')' : 'Offline'}</strong></div>
        <div><small>Registered Lamp</small><strong>${escapeHTML(state.device.id)}</strong></div>
      </div>
      <div style="display:flex;gap:9px;margin-top:16px">
        <button class="btn btn-primary" data-page="login" style="flex:1">${icon('user')} Sign In</button>
        <button class="btn" data-page="register" style="flex:1">Register</button>
      </div>
    `);
  }
}

function clickAction(action, el) {
  switch (action) {
    case 'toggle-pwd': {
      const targetId = el.dataset.target;
      const input = document.getElementById(targetId);
      if (input) {
        const isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';
        el.innerHTML = icon(isPwd ? 'eyeOff' : 'eye');
      }
      break;
    }
    case 'fill-demo-login': {
      const emailInput = document.getElementById('login-email');
      const pwdInput = document.getElementById('login-password');
      if (emailInput && pwdInput) {
        emailInput.value = 'demo@smartfocusguardian.local';
        pwdInput.value = 'password123';
        toast('Demo credentials auto-filled.');
      }
      break;
    }
    case 'logout': {
      closeModal();
      API.logout().catch(() => {});
      clearUserToken();
      state.user = null;
      localStorage.removeItem(KEYS.user);
      updateHeader();
      toast('Signed out successfully.', 'info');
      navigate('login');
      break;
    }
    case 'timer-toggle':
      state.timer.running ? pauseTimer() : startTimer();
      break;
    case 'timer-reset':
      resetTimer();
      break;
    case 'set-mode':
      setTimerMode(el.dataset.mode);
      break;
    case 'save-timer-settings':
      saveTimerSettings();
      break;
    case 'test-buzzer':
      playSound();
      toast('Playing buzzer alert chime.');
      break;
    case 'toggle-motion':
      state.sensor.pirMotion = !state.sensor.pirMotion;
      state.sensor.motionStatus = state.sensor.pirMotion ? 'Motion Detected' : 'No Motion';
      state.sensor.lastMotionTime = state.sensor.pirMotion ? 'Just now' : 'Idle';
      if (state.backend.connected) {
        API.sendDeviceData({
          deviceId: state.device.id,
          pir: state.sensor.pirMotion ? 1 : 0,
          ldr: state.sensor.relativeLight,
          lamp: state.lamp.on ? 1 : 0,
          source: 'DEMO'
        }).catch(() => {});
      }
      renderCurrentPage();
      toast(`Simulated PIR status: ${state.sensor.motionStatus}`);
      break;
    case 'toggle-mode':
    case 'toggle-system-mode': {
      const nextMode = state.systemMode === 'demo' ? 'hardware' : 'demo';
      state.systemMode = nextMode;
      state.prefs.systemMode = nextMode;
      localStorage.setItem(KEYS.systemMode, nextMode);
      persistPrefs();
      updateHeader();
      renderCurrentPage();
      toast(`Switched to ${nextMode === 'hardware' ? 'Live Hardware Mode' : 'Demo Mode'}.`, 'info');
      if (nextMode === 'hardware') {
        pollBackendStatus();
      }
      break;
    }
    case 'save-api-url': {
      const input = document.getElementById('api-base-url');
      if (input && input.value) {
        setApiBaseUrl(input.value);
        toast(`Backend API URL updated to: ${API_CONFIG.baseUrl}`);
        pollBackendStatus();
      }
      break;
    }
    case 'test-api-connection': {
      toast('Testing API connection...', 'info');
      API.checkHealth().then(res => {
        if (res.ok) {
          toast(`Backend reachable! Database: ${res.data.database.mode}`);
          state.backend.connected = true;
          state.backend.mode = res.data.database.mode;
        } else {
          toast(`Connection failed: ${res.error}`, 'error');
          state.backend.connected = false;
        }
        updateHeader();
      });
      break;
    }
    case 'theme':
      state.prefs.theme = el.dataset.theme;
      persistPrefs();
      applyTheme();
      renderCurrentPage();
      toast(`${state.prefs.theme === 'dark' ? 'Dark' : 'Light'} theme enabled.`);
      break;
    case 'notifications':
      openModal(`
        <h2 id="modal-title">Notifications</h2>
        <p>Session reminders and hardware status notices.</p>
        <div class="info-panel">${icon('bell')}<span>${state.prefs.notifications ? 'Browser notifications are enabled.' : 'Enable browser notifications in Settings to receive alerts when your focus block finishes.'}</span></div>
        <button class="btn btn-primary" style="margin-top:16px" data-page="settings">Open settings</button>
      `);
      break;
    case 'profile-menu':
      renderProfileModal();
      break;
    case 'close-modal':
      closeModal();
      break;
    case 'sort-history':
      state.tableSort = state.tableSort === 'date' ? 'focus' : 'date';
      state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
      renderCurrentPage();
      break;
    case 'device-details': {
      const d = state.devices[Number(el.dataset.index)];
      if (d) {
        const isOnline = d.effectiveStatus === 'online';
        openModal(`
          <h2 id="modal-title">${escapeHTML(d.name || d.device_id)}</h2>
          <p>Device diagnostics & configuration</p>
          <div class="modal-detail">
            <div><small>Device ID</small><strong>${escapeHTML(d.device_id || d.id)}</strong></div>
            <div><small>Hardware Type</small><strong>${escapeHTML(d.device_type || d.hardware || 'NodeMCU ESP8266')}</strong></div>
            <div><small>Status</small><strong>${isOnline ? 'Online (Active Stream)' : state.systemMode === 'demo' ? 'Demo Mode' : 'Offline'}</strong></div>
            <div><small>Firmware Version</small><strong>${escapeHTML(d.firmware_version || '1.0.0')}</strong></div>
            <div><small>PIR Motion Input</small><strong>Pin D5 (GPIO14)</strong></div>
            <div><small>LDR Light Input</small><strong>Pin A0 (ADC0)</strong></div>
            <div><small>White LED Output</small><strong>Pin D1 (PWM)</strong></div>
            <div><small>Piezo Buzzer</small><strong>Pin D2 (Tone)</strong></div>
          </div>
          <button class="btn btn-primary" data-action="close-modal">Close</button>
        `);
      }
      break;
    }
    case 'remove-device': {
      const idx = Number(el.dataset.index);
      if (idx > 0 && confirm(`Remove device “${state.devices[idx]?.name}”?`)) {
        state.devices.splice(idx, 1);
        store(KEYS.devices, state.devices);
        renderCurrentPage();
        toast('Device record removed.');
      }
      break;
    }
    case 'restore-timer':
      if (confirm('Restore default timer preferences?')) {
        state.prefs = { ...state.prefs, ...DEFAULTS };
        persistPrefs();
        if (!state.timer.running) {
          state.timer.mode = 'focus';
          state.timer.remainingMs = state.prefs.focus * 60000;
          saveTimer();
        }
        renderCurrentPage();
        toast('Default timer settings restored.');
      }
      break;
    case 'clear-history':
      if (confirm('Clear the sample activity history from this browser view?')) {
        state.hideSamples = true;
        store(KEYS.hideSamples, true);
        renderCurrentPage();
        toast('Sample activity history cleared.');
      }
      break;
    case 'reset-demo':
      if (confirm('Reset all local data, timer history, devices, and preferences?')) {
        Object.values(KEYS).forEach(k => localStorage.removeItem(k));
        location.reload();
      }
      break;
  }
}

// Global Event Listeners
document.addEventListener('click', e => {
  const pageButton = e.target.closest('[data-page]');
  if (pageButton) {
    e.preventDefault();
    closeModal();
    if (pageButton.dataset.page === 'login' && state.user) {
      renderProfileModal();
      return;
    }
    navigate(pageButton.dataset.page);
    return;
  }
  const actionButton = e.target.closest('[data-action]');
  if (actionButton) {
    clickAction(actionButton.dataset.action, actionButton);
    return;
  }
});

document.addEventListener('change', e => {
  const el = e.target;
  if (el.matches('[data-pref]')) {
    handlePrefInput(el);
    return;
  }
  if (el.matches('[data-lamp]')) {
    if (el.dataset.lamp === 'brightness') {
      const val = Number(el.value);
      state.lamp.brightness = val;
      const out = document.getElementById('brightness-value');
      if (out) out.textContent = `${val}%`;
      saveLamp();
      dispatchLampCommand({ requestedState: state.lamp.on, brightness: val, autoMode: state.lamp.auto });
      return;
    }
    if (el.dataset.lamp === 'on') {
      dispatchLampCommand({ requestedState: el.checked, brightness: state.lamp.brightness, autoMode: state.lamp.auto });
      return;
    }
    if (el.dataset.lamp === 'auto') {
      state.lamp.auto = el.checked;
      saveLamp();
      dispatchLampCommand({ requestedState: state.lamp.on, brightness: state.lamp.brightness, autoMode: el.checked });
      return;
    }
  }
  if (el.matches('[data-analytics-period]')) {
    state.analyticsPeriod = el.value === 'all' ? 'all' : Number(el.value);
    renderCurrentPage();
  }
});

document.addEventListener('input', e => {
  const el = e.target;
  if (el.matches('[data-lamp="brightness"]')) {
    const val = Number(el.value);
    state.lamp.brightness = val;
    const out = document.getElementById('brightness-value');
    if (out) out.textContent = `${val}%`;
    saveLamp();
  }
});

document.addEventListener('submit', async e => {
  if (e.target.id === 'login-form') {
    e.preventDefault();
    const alertBox = document.getElementById('login-alert');
    if (alertBox) alertBox.style.display = 'none';

    const form = new FormData(e.target);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');

    if (!email) {
      showFormAlert('login-alert', 'Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFormAlert('login-alert', 'Please enter a valid email address.');
      return;
    }
    if (!password) {
      showFormAlert('login-alert', 'Please enter your password.');
      return;
    }

    const submitBtn = document.getElementById('login-submit-btn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Signing in...'; }

    try {
      const res = await API.login({ email, password });
      if (!res.ok) {
        showFormAlert('login-alert', res.error || 'Invalid email or password.');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = `${icon('user')} Sign In`; }
        return;
      }

      state.user = res.data.user;
      store(KEYS.user, state.user);
      if (res.data.token) {
        setUserToken(res.data.token);
      }

      toast(`Welcome back, ${state.user.name || 'Student'}!`);
      updateHeader();
      refreshAllServerData();
      navigate('dashboard');
    } catch (err) {
      showFormAlert('login-alert', 'Connection error. Please verify backend server.');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = `${icon('user')} Sign In`; }
    }
    return;
  }

  if (e.target.id === 'register-form') {
    e.preventDefault();
    const alertBox = document.getElementById('register-alert');
    if (alertBox) alertBox.style.display = 'none';

    const form = new FormData(e.target);
    const fullName = String(form.get('fullName') || '').trim();
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    const confirmPassword = String(form.get('confirmPassword') || '');

    if (!fullName || fullName.length < 2) {
      showFormAlert('register-alert', 'Full name must be at least 2 characters.');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFormAlert('register-alert', 'Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      showFormAlert('register-alert', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      showFormAlert('register-alert', 'Passwords do not match. Please re-enter.');
      return;
    }

    const submitBtn = document.getElementById('register-submit-btn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Creating account...'; }

    try {
      const res = await API.register({ name: fullName, fullName, email, password });
      if (!res.ok) {
        showFormAlert('register-alert', res.error || 'Registration failed. Please try again.');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = `${icon('check')} Register Account`; }
        return;
      }

      state.user = res.data.user;
      store(KEYS.user, state.user);
      if (res.data.token) {
        setUserToken(res.data.token);
      }

      toast('Account created successfully! Welcome to Smart Focus Guardian.');
      updateHeader();
      refreshAllServerData();
      navigate('dashboard');
    } catch (err) {
      showFormAlert('register-alert', 'Connection error. Please try again.');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = `${icon('check')} Register Account`; }
    }
    return;
  }

  if (e.target.id !== 'device-form') return;
  e.preventDefault();
  const form = new FormData(e.target);
  const name = String(form.get('name') || '').trim();
  const id = String(form.get('id') || '').trim();

  if (!/^[A-Za-z0-9_-]{3,24}$/.test(id)) {
    toast('Device ID must be 3–24 letters, numbers, underscores, or hyphens.', 'error');
    return;
  }

  // Register on server if backend is connected
  if (state.backend.connected) {
    const res = await API.registerDevice({
      deviceId: id,
      name,
      deviceType: 'NodeMCU ESP8266',
      isDemo: state.systemMode === 'demo'
    });
    if (!res.ok && res.status !== 409) {
      toast(`Registration error: ${res.error}`, 'error');
      return;
    }
  }

  const existingIdx = state.devices.findIndex(d => (d.device_id || d.id).toLowerCase() === id.toLowerCase());
  if (existingIdx !== -1) {
    toast('That device ID is already registered.', 'error');
    return;
  }

  state.devices.push({
    name,
    id,
    device_id: id,
    mode: state.systemMode === 'hardware' ? 'Hardware' : 'Demo',
    hardware: 'NodeMCU ESP8266',
    effectiveStatus: state.systemMode === 'hardware' ? 'offline' : 'demo'
  });
  store(KEYS.devices, state.devices);
  renderCurrentPage();
  toast(`${name} registered successfully!`);
});

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
document.getElementById('modal')?.addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

document.addEventListener('visibilitychange', () => {
  if (state.timer.running) {
    state.timer.remainingMs = remainingNow();
    if (state.timer.remainingMs <= 0) finishTimer();
    else { saveTimer(); updateTimerUI(); }
  }
});
window.addEventListener('beforeunload', saveTimer);

function recoverTimer() {
  if (state.timer.running && state.timer.endAt) {
    state.timer.remainingMs = Math.max(0, state.timer.endAt - Date.now());
    if (state.timer.remainingMs === 0) finishTimer();
    else ensureTimerInterval();
  } else if (!Number.isFinite(state.timer.remainingMs) || state.timer.remainingMs <= 0) {
    state.timer.remainingMs = timerModeDuration();
  }
}

/**
 * Periodically polls API health and device status
 */
async function pollBackendStatus() {
  try {
    const health = await API.checkHealth();
    const wasConnected = state.backend.connected;
    state.backend.connected = health.ok;
    state.backend.checkedAt = new Date().toISOString();

    if (health.ok) {
      state.backend.mode = health.data.database.mode;
      state.backend.notice = health.data.database.notice;
      if (!wasConnected) {
        console.log('[API] Backend connection established.');
        refreshAllServerData();
      }

      // If in hardware mode, fetch live device status
      if (state.systemMode === 'hardware') {
        const statusRes = await API.getDeviceStatus(state.device.id);
        if (statusRes.ok && statusRes.data) {
          const dev = statusRes.data.device;
          const reading = statusRes.data.latestReading;
          state.device.effectiveStatus = dev.effectiveStatus;
          state.device.lastSeen = dev.last_seen;

          if (reading) {
            state.sensor = {
              pirMotion: Boolean(reading.pirMotion),
              motionStatus: reading.pirMotion ? 'Motion Detected' : 'No Motion',
              lastMotionTime: reading.recordedAt ? new Date(reading.recordedAt).toLocaleTimeString() : 'Just now',
              relativeLight: reading.relativeLight,
              lightingCategory: reading.lightingCategory,
              lampOn: Boolean(reading.lampOn),
              source: reading.source,
              recordedAt: reading.recordedAt
            };
            state.lamp.on = Boolean(reading.lampOn);
          }
        }
      }
    } else {
      state.backend.mode = 'offline';
    }
  } catch (e) {
    state.backend.connected = false;
  }
  updateHeader();
  if (['dashboard', 'environment'].includes(state.page)) {
    // Light live DOM update without resetting whole view
    const dateLabel = document.getElementById('sensor-updated');
    if (dateLabel) dateLabel.textContent = `Updated ${state.sensor.lastMotionTime || 'just now'}`;
  }
}

async function refreshAllServerData() {
  try {
    // 1. Devices
    const devRes = await API.getDevices();
    if (devRes.ok && devRes.data && devRes.data.length > 0) {
      state.devices = devRes.data;
      store(KEYS.devices, state.devices);
    }

    // 2. Sessions
    const sessRes = await API.getSessions(50);
    if (sessRes.ok && sessRes.data) {
      state.serverSessions = sessRes.data;
    }

    // 3. Analytics
    refreshAnalyticsData();

    // 4. Settings
    const setRes = await API.getSettings();
    if (setRes.ok && setRes.data) {
      state.prefs = { ...state.prefs, ...setRes.data };
      persistPrefs();
    }
  } catch (e) {
    console.warn('[Sync Warning]:', e.message);
  }
}

async function refreshAnalyticsData() {
  try {
    const summaryRes = await API.getAnalyticsSummary();
    if (summaryRes.ok && summaryRes.data) {
      state.analyticsSummary = summaryRes.data;
    }
    const weeklyRes = await API.getAnalyticsWeekly();
    if (weeklyRes.ok && weeklyRes.data) {
      state.weeklyData = weeklyRes.data;
    }
  } catch (e) {}
}

async function checkAuthSession() {
  try {
    const res = await API.getMe();
    if (res.ok && res.data) {
      state.user = res.data;
      store(KEYS.user, state.user);
      updateHeader();
    } else if (res.status === 401 && state.user) {
      state.user = null;
      store(KEYS.user, null);
      clearUserToken();
      updateHeader();
    }
  } catch (e) {}
}

function init() {
  state.timer.completed = Number(state.timer.completed) || 0;
  state.timer.cycle = Number(state.timer.cycle) || 1;
  if (!Number.isFinite(state.timer.remainingMs)) state.timer.remainingMs = timerModeDuration();

  // Read initial page from URL hash if provided
  const initialHash = (location.hash || '').replace('#', '').trim();
  if (initialHash && PAGE_META[initialHash]) {
    state.page = initialHash;
  }

  window.addEventListener('hashchange', () => {
    const h = (location.hash || '').replace('#', '').trim();
    if (h && PAGE_META[h] && h !== state.page) {
      navigate(h);
    }
  });

  renderNavIcons();
  applyTheme();
  renderMobileNav();
  updateHeader();
  renderCurrentPage();
  recoverTimer();
  ensureTimerInterval();

  // Verify authentication session with backend
  checkAuthSession();

  // Initial backend check and background polling
  pollBackendStatus();
  setInterval(pollBackendStatus, 4000);

  setInterval(() => {
    if (state.page === 'dashboard') {
      const date = document.querySelector('.page-intro .date-label');
      if (date) date.textContent = dateLong();
    }
  }, 60000);
}

init();

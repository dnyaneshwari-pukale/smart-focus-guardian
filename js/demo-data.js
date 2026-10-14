// Illustrative values only — replace this module with a real API or WebSocket adapter when hardware is ready.
export const demoSensorSnapshot = {
  deviceId: 'LAMP_001',
  mode: 'FOCUS',
  sensorType: 'PIR Motion Sensor',
  motionDetected: true,
  motionStatus: 'Motion Detected', // 'Motion Detected' | 'No Motion'
  lastMotionTime: 'Just now',
  motionEventsCount: 26,
  lighting: 'ADEQUATE',
  relativeLight: 62,
  lampOn: true,
  brightnessPercent: 70,
  buzzerEnabled: true,
  source: 'DEMO',
  lastUpdated: new Date().toISOString()
};

export const sampleWeek = [
  { day: 'Mon', minutes: 105 },
  { day: 'Tue', minutes: 150 },
  { day: 'Wed', minutes: 120 },
  { day: 'Thu', minutes: 165 },
  { day: 'Fri', minutes: 135 },
  { day: 'Sat', minutes: 90 },
  { day: 'Sun', minutes: 120 }
];

export const sampleHistory = [
  { date: '2026-10-12', focus: 135, sessions: 4, break: 25, interruptions: 1, motionEvents: 84 },
  { date: '2026-10-11', focus: 120, sessions: 4, break: 20, interruptions: 0, motionEvents: 72 },
  { date: '2026-10-10', focus: 90,  sessions: 3, break: 25, interruptions: 1, motionEvents: 54 },
  { date: '2026-10-09', focus: 165, sessions: 5, break: 35, interruptions: 0, motionEvents: 106 },
  { date: '2026-10-08', focus: 120, sessions: 4, break: 25, interruptions: 2, motionEvents: 78 },
  { date: '2026-10-07', focus: 150, sessions: 5, break: 30, interruptions: 1, motionEvents: 95 },
  { date: '2026-10-06', focus: 105, sessions: 4, break: 20, interruptions: 0, motionEvents: 66 }
];

export const sampleActivities = [
  { type: 'focus', title: 'Focus session completed', detail: '25 min · Biology review', time: 'Today, 10:42 AM' },
  { type: 'break', title: 'Break completed', detail: '5 min · Short break', time: 'Today, 10:47 AM' },
  { type: 'motion', title: 'PIR motion detected', detail: 'Study session movement · desk activity logged', time: 'Today, 10:35 AM' },
  { type: 'lamp', title: 'Lamp switched on', detail: 'Demo control · 70% brightness', time: 'Today, 9:58 AM' },
  { type: 'pause', title: 'Study session interrupted', detail: 'Session paused · resumed after 3 min', time: 'Yesterday, 4:16 PM' }
];

export const sensorHistory = [
  { label: '9:00', motionEvents: 14, motionStatus: 'Motion Detected', light: 54 },
  { label: '9:30', motionEvents: 22, motionStatus: 'Motion Detected', light: 62 },
  { label: '10:00', motionEvents: 18, motionStatus: 'Motion Detected', light: 58 },
  { label: '10:30', motionEvents: 26, motionStatus: 'Motion Detected', light: 66 },
  { label: '11:00', motionEvents: 8,  motionStatus: 'No Motion',       light: 61 },
  { label: '11:30', motionEvents: 19, motionStatus: 'Motion Detected', light: 63 }
];

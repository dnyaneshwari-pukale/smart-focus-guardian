# Smart Focus Guardian

A responsive, frontend-only demo dashboard for an IoT-based smart study lamp. It uses semantic HTML, modern CSS, and vanilla JavaScript modules—no framework, login, backend, API key, or database is required.

> **Demo notice:** sensor readings and the sample device are illustrative. No physical lamp or ESP8266 is connected. Lamp controls only update this browser's demo interface.

## Run locally

Because the app uses JavaScript modules, serve this folder over localhost rather than opening `index.html` directly.

1. Install Python 3 if it is not already installed.
2. Open a terminal in this folder.
3. Run:

   ```bash
   python -m http.server 8000
   ```

   On some Windows installations, use `py -m http.server 8000`.
4. Visit <http://localhost:8000>.

The dashboard works without a build step. Google Fonts and Chart.js are loaded from CDNs when internet access is available; system-font and chart-summary fallbacks are included.

## Project structure

```text
smart-focus-guardian/
├── index.html          App shell, shared navigation, modal and toast regions
├── styles.css          Design tokens, responsive layout, themes and components
├── README.md           Setup and customization notes
└── js/
    ├── app.js          Navigation, views, timer, charts, controls and local storage
    └── demo-data.js    Replaceable sample sensor readings and activity dataset
```

## Where to customize

- **Colors and typography:** edit the CSS variables near the top of `styles.css` (`:root`). The primary forest green is `--green-900`.
- **Timer defaults:** edit `DEFAULTS` in `js/app.js`, or change them in the Settings page. Preferences persist in localStorage.
- **Demo sensor values:** edit `demoSensorSnapshot` in `js/demo-data.js`.
- **Sample study charts and table:** edit `sampleWeek`, `sampleHistory`, and `sampleActivities` in `js/demo-data.js`.
- **Future API connection:** replace the demo data adapter in `js/app.js` with calls to your backend (`GET /api/devices`, `GET /api/devices/:deviceId/status`, `POST /api/devices/:deviceId/commands`, and `GET /api/analytics`). Those endpoints are planning notes only; this demo does not call or simulate a backend.

## Demo behavior

- Pomodoro countdown is based on elapsed wall-clock time, avoids duplicate intervals, and continues accurately after tab visibility changes or a reload.
- Focus completion starts a short break, or a long break after the configured number of completed focus sessions. Auto-start of the next focus session is a preference.
- Device registration, timer preferences, theme, demo lamp controls, and locally completed session history are stored in this browser's localStorage.
- Browser notifications are optional and only requested after the user activates the notification setting. A sound notification can be enabled separately.
- Chart.js charts are interactive when the CDN is reachable. A compact visual fallback is shown when it is not.

## Privacy

All state stays in this browser. The app does not send personal or sensor data to a server.

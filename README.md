# Smart Focus Guardian

A responsive, frontend-only demo dashboard for an IoT-based smart study lamp powered by a **NodeMCU ESP8266**, a **PIR motion sensor**, an **LDR ambient light sensor**, a **White LED study lamp**, and a **piezo buzzer**. It uses semantic HTML, modern CSS, and vanilla JavaScript modules—no framework, login, backend, API key, or database is required.

> **Demo notice:** Sensor readings, PIR motion status, and the sample lamp device are illustrative. No physical ESP8266 or lamp is connected. Lamp controls and buzzer test tones update this browser interface and local audio only.

> **PIR Motion Sensor Note:** PIR sensors detect changes in infrared radiation caused by movement. They do not measure physical distance, cannot identify persons, and do not reliably detect a person sitting completely still.

## Run locally

Because the app uses JavaScript modules (`import` / `export`), serve this folder over localhost rather than opening `index.html` directly.

### Option 1: Python HTTP Server

1. Open a terminal in this folder.
2. Run:

   ```bash
   python -m http.server 8000
   ```

   (On some Windows systems, use `py -m http.server 8000`).
3. Visit <http://localhost:8000>.

### Option 2: PowerShell HTTP Server (Built-in on Windows)

If Python is not installed, you can start a local server instantly using PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -Command "$listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:8000/'); $listener.Start(); Write-Host 'Serving on http://localhost:8000'; while($true){ $ctx = $listener.GetContext(); $req = $ctx.Request; $res = $ctx.Response; $path = '.' + $req.Url.LocalPath.Replace('/', '\'); if($path -eq '.\'){$path = '.\index.html'}; if(Test-Path $path){ $bytes = [IO.File]::ReadAllBytes($path); $res.ContentType = switch([IO.Path]::GetExtension($path)){ '.html'{'text/html'} '.css'{'text/css'} '.js'{'application/javascript'} '.json'{'application/json'} default{'application/octet-stream'} }; $res.ContentLength64 = $bytes.Length; $res.OutputStream.Write($bytes, 0, $bytes.Length) } else { $res.StatusCode = 404 }; $res.Close() }"
```

## Project structure

```text
smart-focus-guardian/
├── index.html          App shell, shared navigation, modal and toast regions
├── styles.css          Design tokens, responsive layout, themes, amber badges and components
├── README.md           Setup, PIR sensor notes, and customization guide
└── js/
    ├── app.js          Navigation, views, timer, PIR motion indicators, HardwareBridge, charts, and controls
    └── demo-data.js    Replaceable sample PIR motion readings, light levels, and activity dataset
```

## Hardware integration (NodeMCU ESP8266)

The codebase organizes hardware communication inside `HardwareBridge` in `js/app.js`:

- **PIR Motion Sensor:** Tracks digital motion pulses (`Motion Detected` vs `No Motion`) and counts movement events over time.
- **LDR Ambient Light Sensor:** Measures relative study room light (0–100 index) to classify light as Dim, Adequate, or Bright.
- **White LED Lamp:** Supports manual power toggle, PWM brightness adjustment (0–100%), and automatic brightness compensation.
- **Buzzer Alerts:** Audio alert chime for focus session and break transitions.
- **WebSocket / REST API Hooks:** Connect live hardware by setting `HardwareBridge.connectWebSocket('ws://<esp8266-ip>:81')` or polling `/api/devices/:deviceId/status`.

## Demo & Testing features

- **PIR Motion Toggle:** On the Environment page, click **"Simulate Motion Detected / No Motion"** to immediately test both states and see badges update across the dashboard and environment cards.
- **Pomodoro Timer:** Accurate wall-clock countdown with start, pause, reset, mode toggling, and automatic break transitions.
- **Buzzer Tone Test:** In Settings, click **"Test tone"** to verify the Web Audio two-tone chime.
- **Local persistence:** Timer configuration, theme selection, registered devices, and completed study blocks are saved to `localStorage`.
- **Chart fallbacks:** Accessible HTML bar fallbacks display seamlessly if Chart.js CDN is unreachable.

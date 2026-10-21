# Smart Focus Guardian

> **An IoT-Based Smart Study Lamp & Focus Assistant**  
> Powered by NodeMCU ESP8266, PIR Motion Sensor, LDR Ambient Light Sensor, PWM White LED Study Lamp, Piezo Buzzer, Express.js REST API, and MySQL.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Hardware Components & Pin Wiring](#2-hardware-components--pin-wiring)
3. [Electrical Safety & Sensor Guidelines](#3-electrical-safety--sensor-guidelines)
4. [Project Directory Structure](#4-project-directory-structure)
5. [Database Architecture & Schema](#5-database-architecture--schema)
6. [Step-by-Step Installation & Setup (Windows)](#6-step-by-step-installation--setup-windows)
7. [Running in Demo Mode vs. Live Hardware Mode](#7-running-in-demo-mode-vs-live-hardware-mode)
8. [Hardware Simulator Mode (No Cable / Hardware Required)](#8-hardware-simulator-mode)
9. [NodeMCU ESP8266 Firmware Setup & Upload](#9-nodemcu-esp8266-firmware-setup--upload)
10. [REST API Documentation](#10-rest-api-documentation)
11. [Testing & Verification](#11-testing--verification)
12. [Troubleshooting Guide](#12-troubleshooting-guide)

---

## 1. Project Overview

**Smart Focus Guardian** is a complete full-stack IoT college project designed to help students optimize their study habits. It acts as both a smart desk lamp and a Pomodoro study companion:

- **Smart Focus Companion:** Tracks study blocks (25 min focus, 5 min short break, 15 min long break) using wall-clock timestamps so timing remains accurate even if the browser tab sleeps.
- **PIR Motion Monitoring:** Passively monitors physical desk activity via infrared movement detection, recording motion transitions and event counts during study sessions.
- **Ambient Light Monitoring:** Continuously tracks study desk lighting via an LDR (Photoresistor) sensor scaled to a 0–100 relative index (classified as DIM, ADEQUATE, or BRIGHT).
- **PWM White LED Study Lamp:** Supports remote ON/OFF toggling, continuous 0–100% PWM brightness control, and automatic light compensation with hysteresis when room lighting drops.
- **Decoupled Asynchronous REST Commands:** Lamp commands dispatched from the browser interface are queued as `PENDING` on the backend, polled by the ESP8266, executed on hardware, and reported back as `ACKNOWLEDGED`.
- **Session & Motion Analytics:** Aggregates study totals, completion rates, daily break times, and movement triggers directly from verified database records.
- **Dual Operating Modes:** Features a fully interactive **Demo Mode** for software demonstrations without hardware, and a **Live Hardware Mode** communicating with a real NodeMCU ESP8266.

---

## 2. Hardware Components & Pin Wiring

### Components List
| Component | Description | Default NodeMCU Pin | GPIO Number | Function |
|---|---|---|---|---|
| **NodeMCU ESP8266** | ESP-12E/F Wi-Fi Development Board | — | — | Main Microcontroller |
| **PIR Sensor** | HC-SR501 or AM312 Motion Sensor | **D5** | GPIO14 | Digital Movement Input |
| **LDR Module** | Photoresistor Analog Sensor Module | **A0** | ADC0 | Analog Light Input (0–100) |
| **White LED Module** | Single LED with 220Ω or MOSFET Driver | **D1** | GPIO5 | PWM Lamp Brightness (0–1023) |
| **Piezo Buzzer** | Active or Passive 5V/3.3V Buzzer | **D2** | GPIO4 | Audio Alert Chimes |
| **Breadboard & Wires** | Half-size breadboard & jumper wires | — | — | Circuit Connections |

### Circuit Connection Table

```
NodeMCU ESP8266 Pin Connections:
-----------------------------------------------------------------------------
ESP8266 Pin   Connected To                  Notes
-----------------------------------------------------------------------------
VIN / VU (5V) PIR Sensor VCC (HC-SR501)     Or 3.3V if using AM312 mini PIR
3V3 (3.3V)    LDR Sensor Module VCC         Power for analog light sensor
GND           PIR GND, LDR GND, LED GND,    Common Ground bus on breadboard
              Buzzer (-)
D5 (GPIO14)   PIR Sensor OUT (Digital)      HIGH (1) = Motion, LOW (0) = Idle
A0 (ADC0)     LDR Sensor AO (Analog)        Analog voltage (0 to 3.3V max)
D1 (GPIO5)    White LED Driver / Resistor   Anode (+) through 220Ω resistor
D2 (GPIO4)    Piezo Buzzer (+)              Positive pin of buzzer
-----------------------------------------------------------------------------
```

---

## 3. Electrical Safety & Sensor Guidelines

> [!IMPORTANT]
> **READ BEFORE APPLYING POWER TO YOUR NODEMCU ESP8266:**

1. **3.3V Logic Level:** The ESP8266 GPIO pins operate strictly at 3.3V logic. Connecting 5V directly to a GPIO pin can permanently damage the microcontroller.
2. **PIR Sensor Voltage Check:**
   - Standard **HC-SR501** modules are powered from 5V (VIN / VU), but their digital output pin (OUT) is typically regulated to 3.3V logic. Verify with a digital multimeter before connecting OUT to D5.
   - If your module outputs 5V logic, use a simple 2-resistor voltage divider (1kΩ and 2kΩ) to drop the 5V signal to 3.3V before feeding it into D5.
3. **PIR Sensor Behavioral Reality:**
   - **PIR sensors detect infrared changes caused by movement.** They **do not measure physical distance**, cannot determine the number of persons, and **do not continuously trigger if a person is sitting completely still**.
   - No-motion status indicates lack of physical movement, not necessarily that the student has left the desk.
4. **LDR Sensor Calibration & Labeling:**
   - The photoresistor analog reading is an uncalibrated relative illumination index (0–100), not an exact lux measurement.
5. **White LED Current Limitation:**
   - Maximum output current from an ESP8266 GPIO pin is approximately **12mA**.
   - For a single 5mm White LED: **Always use a 220Ω current-limiting resistor** in series.
   - For high-power LED strips or 12V desk lamps: **Use a logic-level N-channel MOSFET** (e.g. IRLZ44N, IRLML2502) or a transistor driver. **NEVER connect high-current loads or mains AC power directly to the ESP8266 GPIO.**

---

## 4. Project Directory Structure

```text
smart-focus-guardian/
├── index.html                      # Semantic single-page application shell
├── styles.css                      # Design tokens, themes, cards, animations
├── package.json                    # Node.js project manifest & script commands
├── .env.example                    # Environment variable template
├── .env                            # Local configuration (created from .env.example)
├── .gitignore                      # Git exclusion rules
├── README.md                       # Comprehensive project documentation
├── js/
│   ├── app.js                      # Core frontend SPA controller & state management
│   ├── api.js                      # Centralized Fetch API REST communication layer
│   └── demo-data.js                # Sample illustrative sensor & session records
├── backend/
│   ├── server.js                   # HTTP server entrypoint & graceful shutdown
│   ├── app.js                      # Express configuration, static serving, routing
│   ├── config/
│   │   └── database.js             # MySQL connection pool with in-memory fallback
│   ├── routes/
│   │   ├── healthRoutes.js         # GET /api/health
│   │   ├── deviceRoutes.js         # GET/POST /api/devices, /status
│   │   ├── sensorRoutes.js         # POST /api/device-data, readings, motion events
│   │   ├── lampRoutes.js           # POST /api/devices/:id/commands/lamp, pending, ack
│   │   ├── sessionRoutes.js        # GET/POST/PATCH /api/sessions, complete
│   │   ├── analyticsRoutes.js      # GET /api/analytics/summary, daily, weekly
│   │   └── settingsRoutes.js       # GET/PUT /api/settings
│   ├── controllers/
│   │   ├── healthController.js
│   │   ├── authController.js       # User registration, login, logout, profile
│   │   ├── deviceController.js
│   │   ├── sensorController.js
│   │   ├── lampController.js
│   │   ├── sessionController.js
│   │   ├── analyticsController.js
│   │   └── settingsController.js
│   ├── services/
│   │   ├── userService.js          # User registration, bcrypt verification, profiles
│   │   ├── deviceService.js
│   │   ├── sensorService.js
│   │   ├── lampService.js
│   │   ├── sessionService.js
│   │   ├── analyticsService.js
│   │   └── settingsService.js
│   ├── routes/
│   │   ├── authRoutes.js           # Authentication API routes
│   │   ├── healthRoutes.js
│   │   ├── deviceRoutes.js
│   │   ├── sensorRoutes.js
│   │   ├── lampRoutes.js
│   │   ├── sessionRoutes.js
│   │   ├── analyticsRoutes.js
│   │   └── settingsRoutes.js
│   ├── middleware/
│   │   ├── auth.js                 # User JWT & device secret authentication
│   │   ├── errorHandler.js         # Centralized API error handling
│   │   └── rateLimiter.js          # Rate limiters for general & device traffic
│   ├── sql/
│   │   ├── schema.sql              # Complete MySQL DDL tables, indexes, constraints
│   │   └── init-db.js              # Automated database creation & migration script
│   ├── firmware/
│   │   └── smart_focus_guardian.ino# Arduino IDE firmware for NodeMCU ESP8266
│   ├── utils/
│   │   ├── authUtils.js            # Bcrypt hashing, session token crypto, email check
│   │   └── deviceSimulator.js      # Software ESP8266 hardware simulator script
│   └── tests/
│       └── api.test.js             # Automated API test suite (32 tests)
```

---

## 5. Database Architecture & Schema

The application uses 8 normalized tables defined in [`backend/sql/schema.sql`](backend/sql/schema.sql):

1. **`users`**: Secure user accounts with `user_id`, `name`, `email` (unique index), bcrypt password hash (`password_hash`), avatar initial, and timestamps.
2. **`profiles`**: User-specific study preferences (focus duration, break lengths, auto-start, sound chime, notifications, auto-lamp, and UI theme).
3. **`devices`**: Tracks physical and demo NodeMCU ESP8266 units, optional `user_id` ownership, registration dates, firmware versions, authentication secrets, and `last_seen` heartbeats.
4. **`sensor_readings`**: Stores periodic PIR digital state (0/1), LDR relative index (0–100), lighting category (DIM, ADEQUATE, BRIGHT), and lamp state. *Does not contain distance columns.*
5. **`motion_events`**: Stores motion state-transitions (`MOTION_DETECTED`) with a 10-second deduplication threshold to prevent flooding the database with redundant entries.
6. **`lamp_commands`**: Implements asynchronous decoupled command dispatch. Tracks requested state, brightness, auto-mode, created timestamp, acknowledgment timestamp, and failure reasons (`PENDING` -> `ACKNOWLEDGED` / `FAILED`).
7. **`study_sessions`**: Records Pomodoro blocks (planned duration, actual duration, start time, end time, completion status, motion trigger count, user ownership, and source). Uses unique `session_id` to prevent duplicate insertions on page reloads.
8. **`settings`**: System-wide fallback key-value preference store for timer, hardware thresholds, and default modes.

> **Zero-Setup In-Memory Mode:** If MySQL is not running, the application automatically falls back to an in-memory database store. The app and demo mode will work immediately without throwing fatal errors.

---

## 6. Step-by-Step Installation & Setup (Windows)

Follow these exact steps in your Windows terminal:

### Step 1: Install Node.js
If not already installed, download and install Node.js (v18 or higher recommended) from [nodejs.org](https://nodejs.org/).  
Verify the installation in PowerShell:
```powershell
node -v
npm -v
```

### Step 2: Install and Start MySQL
You can use **MySQL Community Server** or **XAMPP / WampServer**:
- **Option A (XAMPP):** Open XAMPP Control Panel and click **Start** next to MySQL.
- **Option B (MySQL Windows Service):** Open PowerShell as Administrator and run:
  ```powershell
  Start-Service MySQL80
  ```

### Step 3: Configure Environment Variables
Copy `.env.example` to create your local `.env` file:
```powershell
Copy-Item .env.example .env
```
Open `.env` in your editor and configure your MySQL credentials:
```ini
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_focus_guardian

CORS_ORIGIN=*
DEVICE_SECRET_TOKEN=sfg_device_secret_2026
DEVICE_OFFLINE_TIMEOUT_SEC=30
LDR_AUTO_THRESHOLD=35
```
*(If you are using XAMPP with root user and no password, leave `DB_PASSWORD=` empty).*

### Step 4: Install Backend Dependencies
In the root directory, install the required packages:
```powershell
npm install
```
*(Note: If PowerShell displays a script execution policy notice regarding `npm.ps1`, you can run `cmd /c npm install` or `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`).*

### Step 5: Initialize the MySQL Database
Run the automated schema setup script to create the database and all 6 tables:
```powershell
cmd /c npm run db:init
```
You will see:
```text
--- Smart Focus Guardian Database Initialization ---
Connecting to MySQL at localhost:3306 as root...
Connected to MySQL server.
Executing schema definitions from schema.sql...
Database "smart_focus_guardian" and all tables initialized successfully!
```

### Step 6: Start the Backend Server
Start the Express server:
```powershell
cmd /c npm start
```
The server will start on port `5000`:
```text
====================================================
   SMART FOCUS GUARDIAN - IOT FOCUS COMPANION       
====================================================
[Server] Application running at:  http://localhost:5000
[Server] API Health check:         http://localhost:5000/api/health
[Server] Database status:          MySQL Connected
====================================================
```

### Step 7: Open the Frontend Application
Open your web browser and navigate to:
```
http://localhost:5000
```
The Smart Focus Guardian dashboard will open, automatically connected to the backend API (`Backend: Connected` badge in topbar).

---

## 7. Running in Demo Mode vs. Live Hardware Mode

The application supports seamless toggling between modes via the topbar pill or the Settings page:

### Demo Mode (Default)
- **Click the topbar pill** to display `DEMO MODE` (amber dot).
- Generates realistic ambient light levels and study metrics.
- Lets you test the Pomodoro timer, start/pause/reset cycles, and buzzer audio alerts.
- Provides interactive simulation controls:
  - On the **Environment** page, click **"Simulate Motion Detected / No Motion"** to test PIR transitions.
  - On the **White LED lamp controls**, toggle power or slide the brightness slider to see immediate simulated acknowledgments.
- Clearly marks all test records with a `DEMO` badge.

### Live Hardware Mode
- **Click the topbar pill** to switch to `HARDWARE MODE` (green dot).
- The dashboard listens for real telemetry sent by the NodeMCU ESP8266.
- If the physical device is turned off or has not sent telemetry in 30 seconds, badges display `Sensor Offline` and `ESP8266 Offline`.
- When you toggle the White LED lamp, the backend queues a command as `PENDING`. When the ESP8266 receives and executes the command, it reports an acknowledgment to the backend, and the UI displays `Acknowledged by Device`.

---

## 8. Hardware Simulator Mode

If you do not have an ESP8266 board or USB data cable ready, you can run the built-in software hardware simulator. It acts as an autonomous NodeMCU ESP8266 connecting over HTTP:

1. Keep your backend running (`npm start`) in one terminal.
2. Open a second terminal window and run:
   ```powershell
   cmd /c npm run simulate:device
   ```
3. The simulator will:
   - Post simulated PIR and fluctuating LDR readings to `POST /api/device-data` every 5 seconds.
   - Poll `GET /api/devices/LAMP_001/commands/pending` every 3 seconds.
   - Receive and execute White LED commands dispatched from the browser, then acknowledge them via `POST /api/devices/LAMP_001/commands/:id/ack`.
4. Switch the browser interface to **Hardware Mode** to watch live telemetry streaming from the simulator!

---

## 9. NodeMCU ESP8266 Firmware Setup & Upload

When your physical hardware is ready:

### Step 1: Install Arduino IDE
Download and install **Arduino IDE 2.x** from [arduino.cc](https://www.arduino.cc/en/software).

### Step 2: Install ESP8266 Board Support
1. Open Arduino IDE.
2. Go to **File -> Preferences**.
3. In **Additional boards manager URLs**, enter:
   ```text
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
4. Click **OK**.
5. Go to **Tools -> Board -> Boards Manager...**.
6. Search for `esp8266` and click **Install** on **esp8266 by ESP8266 Community**.

### Step 3: Open and Configure Firmware
1. In Arduino IDE, open [`backend/firmware/smart_focus_guardian.ino`](backend/firmware/smart_focus_guardian.ino).
2. Find lines 45–54:
   ```cpp
   const char* WIFI_SSID     = "YOUR_WIFI_SSID";     // Enter your 2.4 GHz Wi-Fi SSID
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // Enter your Wi-Fi password
   
   // Enter your computer's local Wi-Fi IP address (e.g. 192.168.1.50)
   const char* BACKEND_URL   = "http://192.168.1.100:5000";
   
   const char* DEVICE_ID     = "LAMP_001";
   const char* DEVICE_TOKEN  = "sfg_device_secret_2026";
   ```
3. **Find your computer's local IP:** Open PowerShell and run:
   ```powershell
   ipconfig
   ```
   Look for `IPv4 Address` under your active Wi-Fi adapter (e.g. `192.168.1.15`). Replace `192.168.1.100` in the firmware with your actual IP address.

### Step 4: Connect Board & Upload
1. Connect your NodeMCU ESP8266 to your PC using a **micro-USB data cable** (ensure the cable supports data transfer, not power only).
2. In Arduino IDE:
   - Select **Tools -> Board -> ESP8266 Boards -> NodeMCU 1.0 (ESP-12E Module)**.
   - Select **Tools -> Port** (choose the COM port assigned to the board, e.g. `COM3` or `COM4`).
   - Set **Tools -> Upload Speed -> 115200**.
3. Click the **Upload** button (arrow icon).
4. After upload completes, open the **Serial Monitor** (**Tools -> Serial Monitor**) and set the baud rate to **115200**.
5. You will see:
   ```text
   [WiFi] Connecting to: Your_WiFi_SSID.....
   [WiFi] Connected successfully!
   [WiFi] IP Address: 192.168.1.42
   [Buzzer] Playing session notification tone...
   [Telemetry] Sent successfully -> PIR: MOTION | LDR Relative: 58 | Lamp: OFF
   ```
6. Open your browser dashboard at `http://localhost:5000`, switch to **Hardware Mode**, and observe live telemetry streaming directly from your NodeMCU ESP8266!

---

## 10. REST API Documentation

All endpoints return structured JSON with consistent `success`, `data`, and `error` properties.

### Health Check
- `GET /api/health`
  - Returns server uptime, version, and MySQL connection status.

### Authentication & User Profiles
- `POST /api/auth/register` — Register a student account (`{ "name": "Jane Doe", "email": "jane@example.com", "password": "password123" }`). Hashes password with bcrypt before storing in MySQL. Sets secure `sfg_token` HttpOnly cookie.
- `POST /api/auth/login` — Authenticate with email & password (`{ "email": "...", "password": "..." }`). Returns user object, token, and sets `sfg_token` cookie.
- `POST /api/auth/logout` — Invalidate user session and clear `sfg_token` cookie.
- `GET /api/auth/me` — Retrieve authenticated user profile (via HttpOnly cookie or `Authorization: Bearer <token>`).
- `PUT /api/auth/profile` — Update user profile and study settings (`focusDuration`, `shortBreak`, `theme`).

**Default Demo Student Account:**
- Email: `demo@smartfocusguardian.local`
- Password: `password123`

### Device Management
- `GET /api/devices` — List all registered devices.
- `GET /api/devices/:deviceId` — Retrieve details for a specific device.
- `POST /api/devices` — Register a new device (`{ deviceId, name, deviceType, isDemo }`).
- `GET /api/devices/:deviceId/status` — Get live connectivity status, latest reading, and pending command count.

### Sensor Telemetry & Motion Events
- `POST /api/device-data` — Ingest sensor readings sent by ESP8266 or simulator.
  - Headers: `x-device-token: sfg_device_secret_2026`
  - Body: `{ "deviceId": "LAMP_001", "pir": 1, "ldr": 55, "lamp": 0, "source": "HARDWARE" }`
- `GET /api/devices/:deviceId/readings/latest` — Fetch latest sensor snapshot.
- `GET /api/devices/:deviceId/readings?limit=50` — Query historical readings with pagination.
- `GET /api/devices/:deviceId/motion-events?limit=50` — Query motion event transitions.

### Lamp Command Dispatch
- `POST /api/devices/:deviceId/commands/lamp` — Queue a White LED command.
  - Body: `{ "requestedState": true, "brightness": 80, "autoMode": false }`
- `GET /api/devices/:deviceId/commands/pending` — Polled by ESP8266 to retrieve pending commands.
  - Headers: `x-device-token: sfg_device_secret_2026`
- `POST /api/devices/:deviceId/commands/:commandId/ack` — Acknowledge execution from ESP8266.
  - Headers: `x-device-token: sfg_device_secret_2026`
  - Body: `{ "success": true, "failureReason": null }`

### Study Sessions
- `GET /api/sessions?limit=100` — Retrieve completed study session records.
- `GET /api/sessions/:sessionId` — Retrieve an individual study session by ID.
- `POST /api/sessions` — Record a completed study session with deduplication.
  - Body: `{ "sessionId": "sess_123", "sessionType": "focus", "actualDurationMin": 25, "completionStatus": "COMPLETED" }`
- `PATCH /api/sessions/:sessionId` — Update session status (e.g. `INTERRUPTED`) or actual duration.
- `POST /api/sessions/:sessionId/complete` — Safely complete or record a session.

### Analytics & Settings
- `GET /api/analytics/summary` — Total focus minutes, completed sessions, break minutes, motion events.
- `GET /api/analytics/daily?days=7` — Daily study aggregates.
- `GET /api/analytics/weekly` — Day-by-day weekly breakdown for charts.
- `GET /api/settings` — Get user preferences and thresholds.
- `PUT /api/settings` — Update preferences (focus length, breaks, auto-lamp, sound, theme).

---

## 11. Testing & Verification

The project includes an automated test suite with **32 comprehensive integration tests** using Node.js's native test runner (`node:test`) and `supertest`.

### Running the Test Suite
```powershell
cmd /c npm test
```

### Verified Test Cases
```text
▶ Smart Focus Guardian - API Test Suite
  ✔ GET /api/health - returns 200 and system health status
  ✔ POST /api/devices - registers a new device
  ✔ POST /api/devices - rejects invalid deviceId
  ✔ GET /api/devices - lists registered devices
  ✔ POST /api/device-data - rejects unauthenticated request when token is missing
  ✔ POST /api/device-data - rejects payload missing deviceId even with valid token
  ✔ POST /api/device-data - rejects payload missing PIR motion field
  ✔ POST /api/device-data - rejects payload with invalid non-numeric LDR
  ✔ POST /api/device-data - accepts valid sensor payload and classifies lighting
  ✔ GET /api/devices/:deviceId/readings/latest - retrieves latest reading
  ✔ POST /api/devices/:deviceId/commands/lamp - dispatches lamp command
  ✔ GET /api/devices/:deviceId/commands/pending - device retrieves pending command
  ✔ POST /api/devices/:deviceId/commands/:commandId/ack - acknowledges command
  ✔ POST /api/sessions - records study session with deduplication
  ✔ GET /api/analytics/summary - derives metrics from sessions
  ✔ GET /api/settings and PUT /api/settings - validates and stores settings
  ✔ GET /api/devices/:deviceId - retrieves details of a specific device
  ✔ GET /api/devices/:deviceId/status - retrieves live status with telemetry
  ✔ GET /api/devices/:deviceId/readings - retrieves sensor reading history
  ✔ GET /api/devices/:deviceId/motion-events - retrieves motion event log
  ✔ GET /api/sessions and GET /api/sessions/:sessionId - queries sessions
  ✔ PATCH /api/sessions/:sessionId - updates session status and actual duration
  ✔ POST /api/sessions/:sessionId/complete - completes or creates session
  ✔ GET /api/analytics/daily and /api/analytics/weekly - derives aggregated study statistics
  ✔ POST /api/auth/register - registers new user, hashes password, and issues auth cookie
  ✔ POST /api/auth/register - rejects duplicate email with 409 Conflict
  ✔ POST /api/auth/login - authenticates registered user and issues session token
  ✔ POST /api/auth/login - authenticates seeded demo user (demo@smartfocusguardian.local)
  ✔ POST /api/auth/login - rejects invalid password with 401 Unauthorized
  ✔ GET /api/auth/me - rejects unauthenticated request with 401
  ✔ GET /api/auth/me - returns user profile with Bearer authorization header
  ✔ POST /api/auth/logout - clears authentication cookie
✔ Smart Focus Guardian - API Test Suite (32 tests, 32 pass, 0 fail)
```

---

## 12. Troubleshooting Guide

| Issue | Cause | Solution |
|---|---|---|
| `Cannot connect to MySQL server at localhost:3306` | MySQL service is not running or incorrect password. | Start MySQL in XAMPP or Windows Services (`Start-Service MySQL80`). If MySQL is unavailable, the server automatically operates in-memory. |
| `npm.ps1 cannot be loaded because running scripts is disabled` | Windows PowerShell Execution Policy restriction. | Run `cmd /c npm <command>` or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` in PowerShell. |
| COM Port not showing in Arduino IDE | Missing USB-to-UART driver for NodeMCU board. | Most NodeMCU boards use either the **CH340G** or **CP2102** chip. Download and install the corresponding driver (e.g. CH341SER Windows driver). |
| ESP8266 reports `[WiFi] Warning: Connection timed out` | Incorrect Wi-Fi SSID/password or 5 GHz network. | Ensure the ESP8266 is connecting to a **2.4 GHz Wi-Fi network** (ESP8266 does not support 5 GHz Wi-Fi). Mobile hotspots configured for 2.4 GHz also work well. |
| ESP8266 reports HTTP code `401` | Device authentication token mismatch. | Verify that `DEVICE_TOKEN` in `.ino` matches `DEVICE_SECRET_TOKEN` in your `.env` file (`sfg_device_secret_2026`). |
| ESP8266 reports HTTP code `-1` or timeout | Incorrect backend IP address or firewall block. | In `.ino`, ensure `BACKEND_URL` is set to your computer's local LAN IP (e.g. `http://192.168.1.15:5000`), not `localhost`. Ensure Windows Firewall allows incoming connections on port 5000. |
| Lamp doesn't turn on via ESP8266 | Output pin misconfiguration or reversed polarity. | Check that the White LED anode (+) is connected to D1 (GPIO5) via a resistor and cathode (-) to GND. Check serial monitor logs for PWM values. |
| PIR constantly reports `Motion Detected` | PIR potentiometer sensitivity set too high or warmup phase. | PIR sensors require 30–60 seconds after power-on to stabilize. Adjust the two orange potentiometers on the HC-SR501: turn sensitivity counter-clockwise to reduce false triggers. |

---

## License

This project is licensed under the MIT License — designed for educational and college project demonstrations.

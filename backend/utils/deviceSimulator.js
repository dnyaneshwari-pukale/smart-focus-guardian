/**
 * Smart Focus Guardian - NodeMCU ESP8266 Software Simulator
 * Simulates real hardware communication:
 * 1. Posts periodic PIR and LDR sensor readings to POST /api/device-data
 * 2. Polls GET /api/devices/:deviceId/commands/pending
 * 3. Executes and acknowledges commands via POST /api/devices/:deviceId/commands/:commandId/ack
 *
 * Run with: npm run simulate:device
 */
require('dotenv').config();

const BASE_URL = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
const DEVICE_ID = process.env.SIM_DEVICE_ID || 'LAMP_001';
const DEVICE_TOKEN = process.env.DEVICE_SECRET_TOKEN || 'sfg_device_secret_2026';
const TELEMETRY_INTERVAL_MS = 5000;
const COMMAND_POLL_INTERVAL_MS = 3000;

let simulatedLampState = false;
let simulatedBrightness = 70;
let simulatedMotion = false;
let motionTicksRemaining = 0;

console.log('====================================================');
console.log('   NODEMCU ESP8266 HARDWARE SIMULATOR               ');
console.log('====================================================');
console.log(`[Simulator] Target Backend:    ${BASE_URL}`);
console.log(`[Simulator] Device ID:         ${DEVICE_ID}`);
console.log(`[Simulator] Telemetry Rate:    Every ${TELEMETRY_INTERVAL_MS / 1000}s`);
console.log(`[Simulator] Command Poll Rate:  Every ${COMMAND_POLL_INTERVAL_MS / 1000}s`);
console.log('====================================================');
console.log('[Simulator] Press Ctrl+C to terminate simulator.');

async function postTelemetry() {
  try {
    // Generate realistic fluctuating LDR reading (between 30 and 80)
    const baseLight = 58;
    const ldrReading = Math.max(10, Math.min(95, Math.round(baseLight + (Math.random() * 20 - 10))));

    // Occasionally toggle motion state (simulate student moving at desk)
    if (motionTicksRemaining <= 0) {
      simulatedMotion = Math.random() > 0.4; // 60% chance of motion
      motionTicksRemaining = Math.floor(Math.random() * 4) + 1;
    } else {
      motionTicksRemaining--;
    }

    const payload = {
      deviceId: DEVICE_ID,
      pir: simulatedMotion ? 1 : 0,
      ldr: ldrReading,
      lamp: simulatedLampState ? 1 : 0,
      source: 'SIMULATED_HARDWARE',
      diagnostics: `Simulated ESP8266 · RSSI: -62dBm · Heap: 38240B`
    };

    const res = await fetch(`${BASE_URL}/api/device-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-token': DEVICE_TOKEN
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      const time = new Date().toLocaleTimeString();
      console.log(`[${time}] Telemetry sent -> PIR: ${simulatedMotion ? 'MOTION' : 'IDLE'} | LDR: ${ldrReading} | Lamp: ${simulatedLampState ? 'ON (' + simulatedBrightness + '%)' : 'OFF'}`);
    } else {
      console.warn(`[Simulator Warning] Telemetry rejected (${res.status}):`, await res.text());
    }
  } catch (err) {
    console.error('[Simulator Error] Could not connect to backend:', err.message);
  }
}

async function pollPendingCommands() {
  try {
    const res = await fetch(`${BASE_URL}/api/devices/${DEVICE_ID}/commands/pending`, {
      headers: {
        'x-device-token': DEVICE_TOKEN
      }
    });

    if (!res.ok) return;

    const body = await res.json();
    if (body.data && body.data.length > 0) {
      for (const cmd of body.data) {
        console.log(`[Simulator] Received command ${cmd.commandId}: Requested Lamp -> ${cmd.requestedState ? 'ON' : 'OFF'} (Brightness: ${cmd.brightness}%)`);
        
        // Execute command
        simulatedLampState = Boolean(cmd.requestedState);
        simulatedBrightness = cmd.brightness || 70;

        // Acknowledge command execution
        const ackRes = await fetch(`${BASE_URL}/api/devices/${DEVICE_ID}/commands/${cmd.commandId}/ack`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-device-token': DEVICE_TOKEN
          },
          body: JSON.stringify({ success: true })
        });

        if (ackRes.ok) {
          console.log(`[Simulator] Acknowledged command ${cmd.commandId} successfully.`);
        }
      }
    }
  } catch (err) {
    // Backend may be momentarily starting
  }
}

// Initial telemetry
postTelemetry();

// Start recurring intervals
setInterval(postTelemetry, TELEMETRY_INTERVAL_MS);
setInterval(pollPendingCommands, COMMAND_POLL_INTERVAL_MS);

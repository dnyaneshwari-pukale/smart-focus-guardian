/**
 * ==============================================================================
 * Smart Focus Guardian - NodeMCU ESP8266 Firmware
 * College IoT Project: Smart Study Lamp & Focus Assistant
 *
 * Hardware Components:
 * - NodeMCU ESP8266 Dev Board (ESP-12E / ESP-12F)
 * - PIR Motion Sensor (HC-SR501 or AM312)
 * - LDR Light Dependent Resistor (Photoresistor module or divider)
 * - White LED Study Lamp (PWM controlled via MOSFET or resistor)
 * - Piezo Buzzer (Audio chime for Pomodoro focus/break intervals)
 *
 * SAFETY & WIRING NOTES (READ BEFORE CONNECTING POWER):
 * 1. ESP8266 operates at 3.3V LOGIC.
 * 2. PIR SENSOR: Power HC-SR501 with 5V (VIN / VU) or 3.3V depending on module.
 *    The OUT signal is typically 3.3V logic. Verify with multimeter. If OUT is 5V,
 *    use a resistive voltage divider (1k ohm / 2k ohm) before connecting to GPIO!
 * 3. LDR SENSOR: Connect LDR module analog output (AO) to NodeMCU A0 pin.
 *    NodeMCU has an onboard voltage divider scaling 0-3.3V to 0-1V internal ADC.
 * 4. WHITE LED: NEVER connect high-power LED strips or AC mains lamp directly
 *    to ESP8266 pins! Maximum GPIO sink/source current is ~12mA.
 *    - For a single small 5mm white LED: Use a 220 ohm resistor in series.
 *    - For a 12V / high-current desk lamp: Use a logic-level N-channel MOSFET
 *      (e.g., IRLZ44N, IRLML2502) or a transistor driver circuit.
 * 5. BUZZER: Active or passive piezo buzzer connected to D2 and GND.
 * ==============================================================================
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

// ==============================================================================
// 1. PIN CONFIGURATION (Customizable)
// ==============================================================================
const int PIN_PIR     = D5;  // GPIO14 - Digital input from PIR motion sensor
const int PIN_LDR     = A0;  // ADC0   - Analog input from LDR light sensor
const int PIN_LAMP    = D1;  // GPIO5  - PWM output to White LED lamp driver
const int PIN_BUZZER  = D2;  // GPIO4  - Output to piezo buzzer

// ==============================================================================
// 2. NETWORK & BACKEND CONFIGURATION
// Replace placeholders with your actual Wi-Fi and server information
// ==============================================================================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";         // e.g. "Home_WiFi" or mobile hotspot
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";     // e.g. "password123"

// Backend server base URL (Use your computer's local IP address on Wi-Fi, e.g. http://192.168.1.50:5000)
// On Windows, find your IP by running 'ipconfig' in PowerShell.
const char* BACKEND_URL   = "http://192.168.1.100:5000";

// Device Identification & Security Token
const char* DEVICE_ID     = "LAMP_001";
const char* DEVICE_TOKEN  = "sfg_device_secret_2026"; // Must match DEVICE_SECRET_TOKEN in .env

// Telemetry & Polling Intervals (milliseconds)
const unsigned long TELEMETRY_INTERVAL_MS = 5000;  // Send PIR & LDR every 5 seconds
const unsigned long COMMAND_POLL_INTERVAL_MS = 3000; // Check for lamp commands every 3 seconds

// ==============================================================================
// 3. HARDWARE RUNTIME STATE
// ==============================================================================
bool currentLampOn        = false;
int  currentBrightness    = 70;      // 0 - 100%
bool autoLightingEnabled  = false;
int  autoLightThreshold   = 35;      // LDR threshold for auto lamp activation
int  lastReportedPir      = -1;
unsigned long lastTelemetryTime = 0;
unsigned long lastCommandPollTime = 0;

WiFiClient wifiClient;

// ==============================================================================
// 4. BUZZER CHIME HELPER
// ==============================================================================
void playBuzzerAlert() {
  Serial.println("[Buzzer] Playing session notification tone...");
  tone(PIN_BUZZER, 780, 120);
  delay(140);
  tone(PIN_BUZZER, 1040, 200);
  delay(220);
  noTone(PIN_BUZZER);
}

// ==============================================================================
// 5. LAMP CONTROL HELPER (PWM 0-1023 on ESP8266)
// ==============================================================================
void applyLampState(bool turnOn, int brightnessPercent) {
  currentLampOn = turnOn;
  currentBrightness = constrain(brightnessPercent, 0, 100);

  if (!currentLampOn || currentBrightness <= 0) {
    analogWrite(PIN_LAMP, 0); // Completely OFF
    Serial.println("[Lamp] White LED state: OFF");
  } else {
    // ESP8266 analogWrite range is 0 - 1023
    int pwmValue = map(currentBrightness, 0, 100, 0, 1023);
    analogWrite(PIN_LAMP, pwmValue);
    Serial.print("[Lamp] White LED state: ON (Brightness: ");
    Serial.print(currentBrightness);
    Serial.print("%, PWM: ");
    Serial.print(pwmValue);
    Serial.println(")");
  }
}

// ==============================================================================
// 6. WI-FI INITIALIZATION & RECONNECTION
// ==============================================================================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println();
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("[WiFi] Connected successfully!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
    playBuzzerAlert(); // Chime on startup connection
  } else {
    Serial.println();
    Serial.println("[WiFi] Warning: Connection timed out. Will retry automatically.");
  }
}

// ==============================================================================
// 7. SEND SENSOR TELEMETRY (POST /api/device-data)
// ==============================================================================
void sendSensorTelemetry() {
  if (WiFi.status() != WL_CONNECTED) return;

  // Read sensors
  int pirReading = digitalRead(PIN_PIR); // 1 = Motion Detected, 0 = No Motion
  int ldrRaw = analogRead(PIN_LDR);      // 0 - 1023 from ESP8266 ADC
  
  // Scale 10-bit analog reading (0-1023) to relative 0-100 scale
  // Note: Depending on whether LDR is tied to VCC or GND, reading may be direct or inverted.
  // Higher value indicates brighter ambient light.
  int relativeLight = map(ldrRaw, 0, 1023, 0, 100);
  relativeLight = constrain(relativeLight, 0, 100);

  // Automatic lamp compensation if enabled
  if (autoLightingEnabled) {
    // If room is darker than threshold and lamp is off, turn it on
    if (relativeLight < autoLightThreshold && !currentLampOn) {
      Serial.println("[Auto-Light] Room is dark. Automatically activating lamp.");
      applyLampState(true, 75);
    } else if (relativeLight > (autoLightThreshold + 20) && currentLampOn) {
      // Hysteresis of +20 prevents rapid toggling
      Serial.println("[Auto-Light] Room is sufficiently bright. Deactivating lamp.");
      applyLampState(false, 0);
    }
  }

  HTTPClient http;
  String endpoint = String(BACKEND_URL) + "/api/device-data";

  http.begin(wifiClient, endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-token", DEVICE_TOKEN);
  http.setTimeout(4000);

  // Build JSON payload
  String json = "{";
  json += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  json += "\"pir\":" + String(pirReading) + ",";
  json += "\"ldr\":" + String(relativeLight) + ",";
  json += "\"lamp\":" + String(currentLampOn ? 1 : 0) + ",";
  json += "\"source\":\"HARDWARE\",";
  json += "\"diagnostics\":\"ESP8266 RSSI: " + String(WiFi.RSSI()) + "dBm, Heap: " + String(ESP.getFreeHeap()) + "B\"";
  json += "}";

  int httpCode = http.POST(json);
  if (httpCode == 200 || httpCode == 201) {
    Serial.print("[Telemetry] Sent successfully -> PIR: ");
    Serial.print(pirReading ? "MOTION" : "IDLE");
    Serial.print(" | LDR Relative: ");
    Serial.print(relativeLight);
    Serial.print(" | Lamp: ");
    Serial.println(currentLampOn ? "ON" : "OFF");
  } else {
    Serial.print("[Telemetry] Warning: Server response code: ");
    Serial.println(httpCode);
  }

  http.end();
}

// ==============================================================================
// 8. POLL PENDING COMMANDS & ACKNOWLEDGE (GET /api/devices/:deviceId/commands/pending)
// ==============================================================================
void pollPendingCommands() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String endpoint = String(BACKEND_URL) + "/api/devices/" + String(DEVICE_ID) + "/commands/pending";

  http.begin(wifiClient, endpoint);
  http.addHeader("x-device-token", DEVICE_TOKEN);
  http.setTimeout(3000);

  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();
    
    // Simple beginner-friendly substring extraction (avoids requiring third-party JSON parser)
    int cmdIdx = payload.indexOf("\"commandId\":\"");
    while (cmdIdx != -1) {
      int endCmdIdx = payload.indexOf("\"", cmdIdx + 13);
      if (endCmdIdx == -1) break;

      String commandId = payload.substring(cmdIdx + 13, endCmdIdx);

      // Extract requestedState
      bool reqState = false;
      int stateIdx = payload.indexOf("\"requestedState\":", cmdIdx);
      if (stateIdx != -1) {
        String stateVal = payload.substring(stateIdx + 17, stateIdx + 21);
        reqState = (stateVal.startsWith("true") || stateVal.startsWith("1"));
      }

      // Extract brightness
      int bri = 70;
      int briIdx = payload.indexOf("\"brightness\":", cmdIdx);
      if (briIdx != -1) {
        bri = payload.substring(briIdx + 13, briIdx + 16).toInt();
        if (bri <= 0) bri = 70;
      }

      // Extract autoMode
      int autoIdx = payload.indexOf("\"autoMode\":", cmdIdx);
      if (autoIdx != -1) {
        String autoVal = payload.substring(autoIdx + 11, autoIdx + 15);
        autoLightingEnabled = (autoVal.startsWith("true") || autoVal.startsWith("1"));
      }

      Serial.print("[Command] Executing ");
      Serial.print(commandId);
      Serial.print(" -> Requested Lamp: ");
      Serial.println(reqState ? "ON" : "OFF");

      // Physically execute command
      applyLampState(reqState, bri);

      // Acknowledge execution
      acknowledgeCommand(commandId, true);

      // Check next command in payload
      cmdIdx = payload.indexOf("\"commandId\":\"", endCmdIdx);
    }
  }

  http.end();
}

void acknowledgeCommand(String commandId, bool success) {
  HTTPClient http;
  String endpoint = String(BACKEND_URL) + "/api/devices/" + String(DEVICE_ID) + "/commands/" + commandId + "/ack";

  http.begin(wifiClient, endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-token", DEVICE_TOKEN);
  http.setTimeout(3000);

  String ackPayload = "{\"success\":" + String(success ? "true" : "false") + "}";
  int httpCode = http.POST(ackPayload);

  if (httpCode == 200) {
    Serial.print("[Command] Acknowledged: ");
    Serial.println(commandId);
  } else {
    Serial.print("[Command] Ack failed with code: ");
    Serial.println(httpCode);
  }

  http.end();
}

// ==============================================================================
// 9. SETUP & MAIN LOOP
// ==============================================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println("==================================================");
  Serial.println("   SMART FOCUS GUARDIAN - NODEMCU ESP8266 BOOT    ");
  Serial.println("==================================================");

  // Configure Pin Modes
  pinMode(PIN_PIR, INPUT);
  pinMode(PIN_LAMP, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  // Initial outputs: Lamp OFF, Buzzer OFF
  analogWrite(PIN_LAMP, 0);
  noTone(PIN_BUZZER);

  // Connect to Wi-Fi
  connectWiFi();
}

void loop() {
  // Ensure Wi-Fi stays connected
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  unsigned long currentMillis = millis();

  // Periodic Telemetry Send
  if (currentMillis - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = currentMillis;
    sendSensorTelemetry();
  }

  // Periodic Command Polling
  if (currentMillis - lastCommandPollTime >= COMMAND_POLL_INTERVAL_MS) {
    lastCommandPollTime = currentMillis;
    pollPendingCommands();
  }

  delay(50); // Yield to background ESP8266 Wi-Fi stack
}

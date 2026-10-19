/**
 * Automated Test Suite for Smart Focus Guardian Backend
 * Uses Node.js native test runner (node:test) and supertest.
 * Run with: npm test
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../app');

describe('Smart Focus Guardian - API Test Suite', () => {
  const testDeviceId = 'LAMP_TEST_01';
  const validToken = process.env.DEVICE_SECRET_TOKEN || 'sfg_device_secret_2026';
  let createdCommandId = null;

  test('GET /api/health - returns 200 and system health status', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert.strictEqual(res.body.project, 'Smart Focus Guardian');
    assert.ok(res.body.database);
    assert.ok(typeof res.body.uptimeSeconds === 'number');
  });

  test('POST /api/devices - registers a new device', async () => {
    const res = await request(app)
      .post('/api/devices')
      .send({
        deviceId: testDeviceId,
        name: 'Desk Lamp Test',
        deviceType: 'NodeMCU ESP8266',
        isDemo: true
      });
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.device_id, testDeviceId);
  });

  test('POST /api/devices - rejects invalid deviceId', async () => {
    const res = await request(app)
      .post('/api/devices')
      .send({ deviceId: '!' }); // Invalid characters & length
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
  });

  test('GET /api/devices - lists registered devices', async () => {
    const res = await request(app).get('/api/devices');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    const found = res.body.data.find(d => d.device_id === testDeviceId);
    assert.ok(found, 'Created test device should exist in list');
  });

  test('POST /api/device-data - rejects unauthenticated request when token is missing', async () => {
    const res = await request(app)
      .post('/api/device-data')
      .send({ deviceId: testDeviceId, pir: 1, ldr: 45 });
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.error, /Unauthorized/);
  });

  test('POST /api/device-data - rejects payload missing deviceId even with valid token', async () => {
    const res = await request(app)
      .post('/api/device-data')
      .set('x-device-token', validToken)
      .send({ pir: 1, ldr: 45 });
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.error, /deviceId/);
  });

  test('POST /api/device-data - rejects payload missing PIR motion field', async () => {
    const res = await request(app)
      .post('/api/device-data')
      .set('x-device-token', validToken)
      .send({ deviceId: testDeviceId, ldr: 45 });
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.error, /PIR/);
  });

  test('POST /api/device-data - rejects payload with invalid non-numeric LDR', async () => {
    const res = await request(app)
      .post('/api/device-data')
      .set('x-device-token', validToken)
      .send({ deviceId: testDeviceId, pir: 1, ldr: 'invalid_lux' });
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.error, /LDR/);
  });

  test('POST /api/device-data - accepts valid sensor payload and classifies lighting', async () => {
    const res = await request(app)
      .post('/api/device-data')
      .set('x-device-token', validToken)
      .send({
        deviceId: testDeviceId,
        pir: 1,
        ldr: 25, // Dim lighting
        lamp: 0,
        source: 'DEMO'
      });
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.pirMotion, true);
    assert.strictEqual(res.body.data.lightingCategory, 'DIM');
    assert.strictEqual(res.body.data.relativeLight, 25);
  });

  test('GET /api/devices/:deviceId/readings/latest - retrieves latest reading', async () => {
    const res = await request(app).get(`/api/devices/${testDeviceId}/readings/latest`);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.deviceId, testDeviceId);
    assert.strictEqual(res.body.data.pirMotion, true);
  });

  test('POST /api/devices/:deviceId/commands/lamp - dispatches lamp command', async () => {
    const res = await request(app)
      .post(`/api/devices/${testDeviceId}/commands/lamp`)
      .send({
        requestedState: true,
        brightness: 80,
        autoMode: false
      });
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'PENDING');
    assert.strictEqual(res.body.data.requestedState, true);
    assert.strictEqual(res.body.data.brightness, 80);
    createdCommandId = res.body.data.commandId;
  });

  test('GET /api/devices/:deviceId/commands/pending - device retrieves pending command', async () => {
    const res = await request(app)
      .get(`/api/devices/${testDeviceId}/commands/pending`)
      .set('x-device-token', validToken);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    const found = res.body.data.find(c => c.commandId === createdCommandId);
    assert.ok(found, 'Pending command should be returned in device poll list');
    assert.strictEqual(found.status, 'PENDING');
  });

  test('POST /api/devices/:deviceId/commands/:commandId/ack - acknowledges command', async () => {
    const res = await request(app)
      .post(`/api/devices/${testDeviceId}/commands/${createdCommandId}/ack`)
      .set('x-device-token', validToken)
      .send({ success: true });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'ACKNOWLEDGED');
  });

  test('POST /api/sessions - records study session with deduplication', async () => {
    const uniqueSessionId = `test_sess_${Date.now()}`;
    const sessionPayload = {
      sessionId: uniqueSessionId,
      sessionType: 'focus',
      plannedDurationMin: 25,
      actualDurationMin: 25,
      startTime: new Date(Date.now() - 25 * 60000).toISOString(),
      endTime: new Date().toISOString(),
      completionStatus: 'COMPLETED',
      motionEventsCount: 14,
      source: 'LOCAL'
    };

    // First insertion -> 201 Created
    const res1 = await request(app).post('/api/sessions').send(sessionPayload);
    assert.strictEqual(res1.statusCode, 201);
    assert.strictEqual(res1.body.data.alreadyRecorded, false);

    // Duplicate call with same sessionId -> 200 OK (idempotent, no double counting)
    const res2 = await request(app).post('/api/sessions').send(sessionPayload);
    assert.strictEqual(res2.statusCode, 200);
    assert.strictEqual(res2.body.data.alreadyRecorded, true);
  });

  test('GET /api/analytics/summary - derives metrics from sessions', async () => {
    const res = await request(app).get('/api/analytics/summary');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.today);
    assert.ok(res.body.data.totals);
    assert.ok(typeof res.body.data.totals.focusMinutes === 'number');
  });

  test('GET /api/settings and PUT /api/settings - validates and stores settings', async () => {
    const getRes = await request(app).get('/api/settings');
    assert.strictEqual(getRes.statusCode, 200);
    assert.strictEqual(getRes.body.success, true);

    const updateRes = await request(app)
      .put('/api/settings')
      .send({
        focus: 30,
        shortBreak: 6,
        autoLamp: true
      });
    assert.strictEqual(updateRes.statusCode, 200);
    assert.strictEqual(updateRes.body.data.focus, 30);
    assert.strictEqual(updateRes.body.data.shortBreak, 6);
    assert.strictEqual(updateRes.body.data.autoLamp, true);
  });

  test('GET /api/devices/:deviceId - retrieves details of a specific device', async () => {
    const res = await request(app).get(`/api/devices/${testDeviceId}`);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.device_id, testDeviceId);
  });

  test('GET /api/devices/:deviceId/status - retrieves live status with telemetry', async () => {
    const res = await request(app).get(`/api/devices/${testDeviceId}/status`);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.device);
    assert.ok(res.body.data.latestReading);
    assert.strictEqual(res.body.data.latestReading.deviceId, testDeviceId);
  });

  test('GET /api/devices/:deviceId/readings - retrieves sensor reading history', async () => {
    const res = await request(app).get(`/api/devices/${testDeviceId}/readings?limit=10`);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  test('GET /api/devices/:deviceId/motion-events - retrieves motion event log', async () => {
    const res = await request(app).get(`/api/devices/${testDeviceId}/motion-events?limit=10`);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  test('GET /api/sessions and GET /api/sessions/:sessionId - queries sessions', async () => {
    const listRes = await request(app).get('/api/sessions?limit=10');
    assert.strictEqual(listRes.statusCode, 200);
    assert.strictEqual(listRes.body.success, true);
    assert.ok(Array.isArray(listRes.body.data));
    assert.ok(listRes.body.data.length > 0);

    const firstId = listRes.body.data[0].sessionId;
    const singleRes = await request(app).get(`/api/sessions/${firstId}`);
    assert.strictEqual(singleRes.statusCode, 200);
    assert.strictEqual(singleRes.body.success, true);
    assert.strictEqual(singleRes.body.data.sessionId, firstId);
  });

  test('PATCH /api/sessions/:sessionId - updates session status and actual duration', async () => {
    const patchId = `patch_test_${Date.now()}`;
    await request(app).post('/api/sessions').send({
      sessionId: patchId,
      sessionType: 'focus',
      plannedDurationMin: 25,
      actualDurationMin: 15,
      completionStatus: 'COMPLETED'
    });

    const patchRes = await request(app)
      .patch(`/api/sessions/${patchId}`)
      .send({
        completionStatus: 'INTERRUPTED',
        actualDurationMin: 12
      });

    assert.strictEqual(patchRes.statusCode, 200);
    assert.strictEqual(patchRes.body.success, true);
    assert.strictEqual(patchRes.body.data.completionStatus, 'INTERRUPTED');
    assert.strictEqual(patchRes.body.data.actualDurationMin, 12);
  });

  test('POST /api/sessions/:sessionId/complete - completes or creates session', async () => {
    const completeId = `complete_test_${Date.now()}`;
    const res = await request(app)
      .post(`/api/sessions/${completeId}/complete`)
      .send({
        sessionType: 'focus',
        actualDurationMin: 25,
        motionEventsCount: 8
      });

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.sessionId, completeId);
  });

  test('GET /api/analytics/daily and /api/analytics/weekly - derives aggregated study statistics', async () => {
    const dailyRes = await request(app).get('/api/analytics/daily?days=7');
    assert.strictEqual(dailyRes.statusCode, 200);
    assert.strictEqual(dailyRes.body.success, true);
    assert.ok(Array.isArray(dailyRes.body.data));

    const weeklyRes = await request(app).get('/api/analytics/weekly');
    assert.strictEqual(weeklyRes.statusCode, 200);
    assert.strictEqual(weeklyRes.body.success, true);
    assert.ok(Array.isArray(weeklyRes.body.data));
  });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

let server;
let baseUrl;

test.before(async () => {
  await connectDB();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
});

test('Login with new admin "TamalikaKeya" succeeds and returns JWT', async () => {
  const res = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'TamalikaKeya',
      password: 'Tamalika12345'
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.token);
  assert.equal(data.admin.username, 'tamalikakeya');
});

test('Login with case-insensitive username "tamalikakeya" succeeds', async () => {
  const res = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'tamalikakeya',
      password: 'Tamalika12345'
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.token);
});

test('Login with "TamalikaKeya" and incorrect password fails with 401', async () => {
  const res = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'TamalikaKeya',
      password: 'WrongPassword'
    })
  });

  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('Original admin "adityamollick9_db_user" can still log in successfully', async () => {
  const res = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.token);
});

test('New admin "TamalikaKeya" has full access to all dashboard features', async () => {
  // Step 1: Login
  const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'TamalikaKeya',
      password: 'Tamalika12345'
    })
  });
  const { token } = await loginRes.json();
  const authHeaders = { Authorization: `Bearer ${token}` };

  // Step 2: Access profile
  const meRes = await fetch(`${baseUrl}/api/admin/me`, { headers: authHeaders });
  assert.equal(meRes.status, 200);
  const meData = await meRes.json();
  assert.equal(meData.admin.username, 'tamalikakeya');

  // Step 3: View dashboard statistics
  const statsRes = await fetch(`${baseUrl}/api/admin/statistics`, { headers: authHeaders });
  assert.equal(statsRes.status, 200);
  const statsData = await statsRes.json();
  assert.equal(statsData.success, true);
  assert.ok(statsData.data.summary);

  // Step 4: View RSVP submissions
  const rsvpsRes = await fetch(`${baseUrl}/api/admin/rsvps`, { headers: authHeaders });
  assert.equal(rsvpsRes.status, 200);
  const rsvpsData = await rsvpsRes.json();
  assert.equal(rsvpsData.success, true);

  // Step 5: View private blessings
  const blessingsRes = await fetch(`${baseUrl}/api/admin/blessings`, { headers: authHeaders });
  assert.equal(blessingsRes.status, 200);
  const blessingsData = await blessingsRes.json();
  assert.equal(blessingsData.success, true);

  // Step 6: Export RSVPs CSV
  const exportRsvpsRes = await fetch(`${baseUrl}/api/admin/export/rsvps`, { headers: authHeaders });
  assert.equal(exportRsvpsRes.status, 200);
  assert.equal(exportRsvpsRes.headers.get('content-type'), 'text/csv; charset=utf-8');

  // Step 7: Export Blessings CSV
  const exportBlessingsRes = await fetch(`${baseUrl}/api/admin/export/blessings`, { headers: authHeaders });
  assert.equal(exportBlessingsRes.status, 200);
  assert.equal(exportBlessingsRes.headers.get('content-type'), 'text/csv; charset=utf-8');
});


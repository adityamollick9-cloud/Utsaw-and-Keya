import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { seedInitialAdmin } from '../src/services/seedAdmin.js';
import { Rsvp } from '../src/models/Rsvp.js';
import { Blessing } from '../src/models/Blessing.js';

let server;
let baseUrl;
let adminToken = '';

test.before(async () => {
  await connectDB();
  await seedInitialAdmin();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  // Clean up test documents created during testing
  await Rsvp.deleteMany({ email: 'test_automated@example.com' });
  await Blessing.deleteMany({ guestName: 'Test Automated Guest' });

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
});

test('GET /api/health should return ok and database status', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.database, 'connected');
});

test('POST /api/rsvp validation: fails when firstName is missing', async () => {
  const res = await fetch(`${baseUrl}/api/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attending: 'yes' })
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.ok, false);
  assert.equal(data.success, false);
  assert.ok(data.fields && data.fields.firstName);
});

test('POST /api/rsvp validation: fails when attending is missing', async () => {
  const res = await fetch(`${baseUrl}/api/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName: 'Test' })
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.ok, false);
  assert.ok(data.fields && data.fields.attending);
});

test('POST /api/rsvp validation: fails with invalid email format', async () => {
  const res = await fetch(`${baseUrl}/api/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Test',
      attending: 'yes',
      email: 'not-an-email'
    })
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.ok, false);
  assert.ok(data.fields && data.fields.email);
});

test('POST /api/rsvp success: creates RSVP and blessing in MongoDB Atlas', async () => {
  const testSubId = 'test-sub-' + Date.now();
  const res = await fetch(`${baseUrl}/api/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      submissionId: testSubId,
      firstName: 'Test',
      lastName: 'Automated Guest',
      email: 'test_automated@example.com',
      phone: '+8801711111111',
      attending: 'yes',
      events: ['haldi-ceremony', 'holy-matrimony'],
      blessing: 'May your marriage be blessed with endless happiness!'
    })
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.success, true);
  assert.ok(data.data.id);

  // Verify in MongoDB Atlas
  const savedRsvp = await Rsvp.findById(data.data.id);
  assert.ok(savedRsvp);
  assert.equal(savedRsvp.firstName, 'Test');
  assert.equal(savedRsvp.lastName, 'Automated Guest');
  assert.equal(savedRsvp.attending, 'yes');

  const savedBlessing = await Blessing.findOne({ rsvpId: savedRsvp._id });
  assert.ok(savedBlessing);
  assert.equal(savedBlessing.guestName, 'Test Automated Guest');
  assert.equal(savedBlessing.message, 'May your marriage be blessed with endless happiness!');

  // Test idempotency: re-submitting same submissionId
  const res2 = await fetch(`${baseUrl}/api/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      submissionId: testSubId,
      firstName: 'Test',
      lastName: 'Automated Guest',
      attending: 'yes'
    })
  });
  assert.equal(res2.status, 200);
  const data2 = await res2.json();
  assert.equal(data2.ok, true);
  assert.equal(data2.data.id, String(savedRsvp._id));
});

test('POST /api/blessings: allows standalone blessing submission', async () => {
  const res = await fetch(`${baseUrl}/api/blessings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      guestName: 'Test Automated Guest',
      message: 'Standalone blessing for testing!'
    })
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.ok(data.data.id);
});

test('POST /api/admin/login: rejects invalid credentials', async () => {
  const res = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'wrong_user',
      password: 'wrong_password'
    })
  });

  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('POST /api/admin/login: authenticates valid admin and returns JWT', async () => {
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
  adminToken = data.token;
});

test('GET /api/admin/statistics: rejects unauthenticated requests', async () => {
  const res = await fetch(`${baseUrl}/api/admin/statistics`);
  assert.equal(res.status, 401);
});

test('GET /api/admin/statistics: returns statistics when authenticated', async () => {
  const res = await fetch(`${baseUrl}/api/admin/statistics`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.data.summary);
  assert.ok(data.data.eventCounts);
  assert.ok(Array.isArray(data.data.timeline));
});

test('GET /api/admin/rsvps: returns paginated list when authenticated', async () => {
  const res = await fetch(`${baseUrl}/api/admin/rsvps?page=1&limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
  assert.ok(data.pagination);
});

test('GET /api/admin/blessings: returns private blessings when authenticated', async () => {
  const res = await fetch(`${baseUrl}/api/admin/blessings`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
});


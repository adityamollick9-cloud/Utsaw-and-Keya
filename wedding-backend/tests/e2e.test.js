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

const TEST_SUBMISSION_IDS = [
  'e2e-rsvp-yes-' + Date.now(),
  'e2e-rsvp-no-' + Date.now()
];

test.before(async () => {
  await connectDB();
  await seedInitialAdmin();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[E2E Server] Running at ${baseUrl}`);
      resolve();
    });
  });
});

test.after(async () => {
  // Clean up e2e test records from Atlas
  await Rsvp.deleteMany({ submissionId: { $in: TEST_SUBMISSION_IDS } });
  await Blessing.deleteMany({ submissionId: { $in: TEST_SUBMISSION_IDS } });
  await Blessing.deleteMany({ guestName: 'E2E Standalone Blessing' });

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
});

test('E2E Flow: Step 1 - Guest submits RSVP (Attending) with blessing', async () => {
  const payload = {
    submissionId: TEST_SUBMISSION_IDS[0],
    firstName: 'Emily',
    lastName: 'Rose',
    email: 'emily.rose@example.com',
    phone: '+1 555-0199',
    attending: 'yes',
    events: ['haldi-ceremony', 'holy-matrimony', 'wedding-dinner'],
    blessing: 'May Christ bless your sacred union with enduring peace and joy!'
  };

  const res = await fetch(`${baseUrl}/api/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.ok, true, 'Frontend index.html requires body.ok === true');
  assert.equal(data.success, true, 'README requires success: true');
  assert.ok(data.data.id);

  // Verify in MongoDB Atlas
  const savedRsvp = await Rsvp.findById(data.data.id);
  assert.ok(savedRsvp);
  assert.equal(savedRsvp.firstName, 'Emily');
  assert.equal(savedRsvp.lastName, 'Rose');
  assert.equal(savedRsvp.attending, 'yes');
  assert.equal(savedRsvp.events.length, 3);

  // Verify blessing automatically saved to blessings collection
  const savedBlessing = await Blessing.findOne({ rsvpId: savedRsvp._id });
  assert.ok(savedBlessing);
  assert.equal(savedBlessing.guestName, 'Emily Rose');
  assert.equal(savedBlessing.message, payload.blessing);
});

test('E2E Flow: Step 2 - Guest submits RSVP (Declining)', async () => {
  const payload = {
    submissionId: TEST_SUBMISSION_IDS[1],
    firstName: 'David',
    lastName: 'Miller',
    email: 'david.miller@example.com',
    phone: '+1 555-0188',
    attending: 'no',
    events: ['haldi-ceremony'], // Should be wiped because attending is 'no'
    blessing: 'Sending our warmest love and prayers from afar!'
  };

  const res = await fetch(`${baseUrl}/api/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.ok, true);

  const savedRsvp = await Rsvp.findById(data.data.id);
  assert.ok(savedRsvp);
  assert.equal(savedRsvp.attending, 'no');
  assert.equal(savedRsvp.events.length, 0, 'Declined RSVP should have empty events array');
});

test('E2E Flow: Step 3 - Standalone blessing submission', async () => {
  const payload = {
    guestName: 'E2E Standalone Blessing',
    message: 'Wishing you both a wonderful wedding and future!'
  };

  const res = await fetch(`${baseUrl}/api/blessings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.ok, true);
});

test('E2E Flow: Step 4 - Duplicate submission check (idempotent)', async () => {
  const duplicatePayload = {
    submissionId: TEST_SUBMISSION_IDS[0],
    firstName: 'Emily',
    lastName: 'Rose',
    attending: 'yes'
  };

  const res = await fetch(`${baseUrl}/api/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(duplicatePayload)
  });

  assert.equal(res.status, 200, 'Duplicate submissionId returns 200 OK');
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.message, 'Your response has already been recorded.');
});

test('E2E Flow: Step 5 - Privacy check: unauthenticated requests cannot access blessings', async () => {
  const res = await fetch(`${baseUrl}/api/admin/blessings`);
  assert.equal(res.status, 401, 'Public request to blessings must be rejected');
});

test('E2E Flow: Step 6 - Admin logs into dashboard', async () => {
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

test('E2E Flow: Step 7 - Dashboard retrieves live statistics', async () => {
  const res = await fetch(`${baseUrl}/api/admin/statistics`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.data.summary.totalRsvps >= 2);
  assert.ok(data.data.summary.attendingCount >= 1);
  assert.ok(data.data.summary.notAttendingCount >= 1);
  assert.ok(data.data.summary.totalBlessings >= 2);
});

test('E2E Flow: Step 8 - Dashboard retrieves RSVP records and searches by name', async () => {
  const res = await fetch(`${baseUrl}/api/admin/rsvps?search=Emily`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.data.some(r => r.firstName === 'Emily'));
});

test('E2E Flow: Step 9 - Dashboard retrieves blessings and exports CSV', async () => {
  const res = await fetch(`${baseUrl}/api/admin/blessings?limit=10`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.data.some(b => b.guestName === 'Emily Rose'));

  // CSV export test
  const csvRes = await fetch(`${baseUrl}/api/admin/export/rsvps`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(csvRes.status, 200);
  assert.equal(csvRes.headers.get('content-type'), 'text/csv; charset=utf-8');
  const csvText = await csvRes.text();
  assert.ok(csvText.includes('Emily'));
});


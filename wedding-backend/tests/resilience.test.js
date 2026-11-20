import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

let server;
let baseUrl;
let adminToken;

test.before(async () => {
  await connectDB();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  const res = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD
    })
  });
  const data = await res.json();
  adminToken = data.token;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
});

test('Search with special regex characters like "+880" does not crash backend', async () => {
  const res = await fetch(`${baseUrl}/api/admin/rsvps?search=+880`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
});

test('Search with regex brackets "(555)" and "?" does not throw SyntaxError', async () => {
  const res = await fetch(`${baseUrl}/api/admin/blessings?search=(555)+?*`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
});

test('Invalid MongoDB ObjectId parameter returns 400 instead of 500', async () => {
  const res = await fetch(`${baseUrl}/api/admin/rsvps/invalid-id-xyz`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.message.includes('Invalid identifier format'));
});

test('Invalid MongoDB ObjectId on delete returns 400 instead of 500', async () => {
  const res = await fetch(`${baseUrl}/api/admin/blessings/invalid-id-xyz`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});


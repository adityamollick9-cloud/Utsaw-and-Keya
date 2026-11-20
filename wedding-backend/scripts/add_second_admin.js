import dotenv from 'dotenv';
dotenv.config({ path: 'wedding-backend/.env' });

import { connectDB } from '../src/config/db.js';
import { Admin } from '../src/models/Admin.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

async function main() {
  console.log('Connecting to MongoDB Atlas...');
  await connectDB();

  console.log('\n--- 1. Current Admins in Database ---');
  const initialAdmins = await Admin.find().lean();
  console.log(`Found ${initialAdmins.length} admin accounts:`, initialAdmins.map(a => a.username));

  const targetUsername = process.env.SECOND_ADMIN_USERNAME || 'TamalikaKeya';
  const targetPassword = process.env.SECOND_ADMIN_PASSWORD || 'Tamalika12345';
  const normalizedUsername = targetUsername.trim().toLowerCase();

  console.log(`\n--- 2. Checking / Adding Admin: "${targetUsername}" (${normalizedUsername}) ---`);
  let admin = await Admin.findOne({ username: normalizedUsername });

  if (admin) {
    console.log(`Admin account "${targetUsername}" already exists in MongoDB.`);
    const matches = await admin.comparePassword(targetPassword);
    if (!matches) {
      console.log('Updating password hash for existing account...');
      const salt = await bcrypt.genSalt(10);
      admin.passwordHash = await bcrypt.hash(targetPassword, salt);
      await admin.save();
      console.log('Password hash updated securely.');
    } else {
      console.log('Existing password hash verified successfully.');
    }
  } else {
    console.log(`Creating new admin account for "${targetUsername}"...`);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(targetPassword, salt);
    admin = await Admin.create({
      username: normalizedUsername,
      passwordHash
    });
    console.log(`Admin "${targetUsername}" successfully created with ID: ${admin._id}`);
  }

  console.log('\n--- 3. Verifying Password Comparison ---');
  const validPasswordCheck = await admin.comparePassword(targetPassword);
  console.log(`Password verification for "${targetUsername}":`, validPasswordCheck ? 'PASSED (MATCH)' : 'FAILED');

  const invalidPasswordCheck = await admin.comparePassword('WrongPassword123');
  console.log(`Invalid password rejection for "${targetUsername}":`, !invalidPasswordCheck ? 'PASSED (REJECTED)' : 'FAILED');

  console.log('\n--- 4. Verifying Existing Primary Admin Unchanged ---');
  const primaryUsername = (process.env.ADMIN_USERNAME || 'adityamollick9_db_user').trim().toLowerCase();
  const primaryAdmin = await Admin.findOne({ username: primaryUsername });
  if (primaryAdmin) {
    const primaryCheck = await primaryAdmin.comparePassword(process.env.ADMIN_PASSWORD);
    console.log(`Primary admin "${primaryUsername}" intact:`, primaryCheck ? 'YES (UNMODIFIED)' : 'NO (FAILED)');
  } else {
    console.log(`Warning: Primary admin "${primaryUsername}" not found.`);
  }

  console.log('\n--- 5. Testing JWT Generation & Admin Payload ---');
  const payload = { id: admin._id, username: admin.username };
  const secret = process.env.JWT_SECRET || 'wedding_jwt_secret_fallback';
  const token = jwt.sign(payload, secret, { expiresIn: '24h' });
  const decoded = jwt.verify(token, secret);
  console.log('JWT verified successfully for:', decoded.username);

  console.log('\n--- 6. All Current Admins in Database ---');
  const allAdmins = await Admin.find().lean();
  console.log('Total Admins:', allAdmins.length);
  for (const a of allAdmins) {
    console.log(` - ID: ${a._id}, Username: ${a.username}, CreatedAt: ${a.createdAt}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Error adding admin:', err);
  process.exit(1);
});


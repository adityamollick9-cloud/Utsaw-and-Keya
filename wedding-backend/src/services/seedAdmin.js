import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin.js';

export async function seedInitialAdmin() {
  const adminsToSeed = [];

  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    adminsToSeed.push({
      username: process.env.ADMIN_USERNAME.trim(),
      password: process.env.ADMIN_PASSWORD
    });
  }

  if (process.env.SECOND_ADMIN_USERNAME && process.env.SECOND_ADMIN_PASSWORD) {
    adminsToSeed.push({
      username: process.env.SECOND_ADMIN_USERNAME.trim(),
      password: process.env.SECOND_ADMIN_PASSWORD
    });
  }

  if (adminsToSeed.length === 0) {
    console.warn('[Admin Seed] No administrator accounts configured in environment variables.');
    return;
  }

  for (const adminData of adminsToSeed) {
    const existing = await Admin.findOne({ username: adminData.username.toLowerCase() });
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminData.password, salt);
      await Admin.create({
        username: adminData.username.toLowerCase(),
        passwordHash
      });
      console.log(`[Admin Seed] Administrator account created for username: "${adminData.username}"`);
    } else {
      console.log(`[Admin Seed] Administrator account already exists: "${adminData.username}"`);
    }
  }
}

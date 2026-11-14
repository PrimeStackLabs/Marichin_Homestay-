/**
 * Idempotent Sample Reviews Seed / Migration Script
 *
 * Safe to run multiple times against local MongoDB or MongoDB Atlas:
 * - Inserts the 5 sample guest reviews ONLY if matching records do not already exist.
 * - Never deletes or overwrites real guest-submitted reviews or admin status changes.
 *
 * Run from server folder:
 *   node seed/seed-reviews.js
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Review } from '../models/Review.js';
import { SAMPLE_REVIEWS } from './sampleReviews.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function seedReviews() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in server/.env. Aborting without changes.');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected.');

  let inserted = 0;
  let skipped = 0;

  for (const sample of SAMPLE_REVIEWS) {
    const exists = await Review.findOne({
      guestName: sample.guestName,
      stayDate: sample.stayDate
    }).lean();

    if (exists) {
      skipped += 1;
    } else {
      await Review.create(sample);
      inserted += 1;
    }
  }

  const totalCount = await Review.countDocuments();
  const approvedCount = await Review.countDocuments({ status: 'approved' });
  const pendingCount = await Review.countDocuments({ status: 'pending' });
  const hiddenCount = await Review.countDocuments({ status: 'hidden' });

  console.log(`✅ Sample reviews processed: ${inserted} inserted, ${skipped} already present.`);
  console.log(`📊 Current Review counts in DB -> Total: ${totalCount} | Approved: ${approvedCount} | Pending: ${pendingCount} | Hidden: ${hiddenCount}`);

  await mongoose.connection.close();
  console.log('🔒 Connection closed.');
  process.exit(0);
}

seedReviews().catch(async (err) => {
  console.error('❌ Review seeding failed:', err);
  try {
    await mongoose.connection.close();
  } catch {}
  process.exit(1);
});


/**
 * Migration Script: migrate-booking-pass.mjs
 * 
 * Performs:
 * 1. Sets autoConfirmAfterPayment: true on SiteSettings
 * 2. Clears legacy hardcoded registrationNumber ('KA-KOD-2024-8841') from SiteSettings if present
 * 3. Backfills unique, cryptographically secure 48-character passTokens on existing bookings missing one
 * 4. Ensures unique sparse index on bookings.passToken
 * 
 * Idempotent: safe to run repeatedly.
 * DO NOT RUN AUTOMATICALLY: user will execute with:
 *   node server/scripts/migrate-booking-pass.mjs
 */

import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server environment
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in server/.env');
  process.exit(1);
}

async function runMigration() {
  console.log('=====================================================');
  console.log('🚀 Starting Marichin Homestay Pass & Auto-Confirm Migration');
  console.log('=====================================================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const siteSettingsCol = db.collection('sitesettings');
    const bookingsCol = db.collection('bookings');

    // -----------------------------------------------------------------
    // STEP 1: Update SiteSettings
    // -----------------------------------------------------------------
    console.log('\n--- Step 1: Updating Site Settings ---');
    const currentSettings = await siteSettingsCol.findOne({});

    if (currentSettings) {
      const updateFields = {
        autoConfirmAfterPayment: true
      };

      // Check if registrationNumber has the legacy hardcoded placeholder
      const reg = (currentSettings.registrationNumber || '').trim();
      if (reg === 'KA-KOD-2024-8841' || reg.toUpperCase().includes('KA-KOD')) {
        updateFields.registrationNumber = '';
        console.log(`ℹ️ Clearing legacy hardcoded registrationNumber "${reg}"`);
      }

      await siteSettingsCol.updateOne(
        { _id: currentSettings._id },
        { $set: updateFields }
      );
      console.log('✅ SiteSettings updated: autoConfirmAfterPayment = true');
    } else {
      console.log('ℹ️ No existing SiteSettings document found. Skipping settings update.');
    }

    // -----------------------------------------------------------------
    // STEP 2: Backfill passToken on existing bookings
    // -----------------------------------------------------------------
    console.log('\n--- Step 2: Backfilling passToken on existing bookings ---');
    const missingTokenFilter = {
      $or: [
        { passToken: { $exists: false } },
        { passToken: null },
        { passToken: '' }
      ]
    };

    const bookingsToUpdate = await bookingsCol.find(missingTokenFilter).toArray();
    console.log(`🔍 Found ${bookingsToUpdate.length} booking(s) without a passToken.`);

    let updatedCount = 0;
    for (const b of bookingsToUpdate) {
      const token = crypto.randomBytes(24).toString('hex'); // 48 chars, unguessable
      await bookingsCol.updateOne(
        { _id: b._id },
        { $set: { passToken: token } }
      );
      updatedCount++;
    }

    console.log(`✅ Successfully generated passToken for ${updatedCount} booking(s).`);

    // -----------------------------------------------------------------
    // STEP 3: Create / Verify unique sparse index on passToken
    // -----------------------------------------------------------------
    console.log('\n--- Step 3: Verifying database indexes ---');
    await bookingsCol.createIndex(
      { passToken: 1 },
      { unique: true, sparse: true, background: true }
    );
    console.log('✅ Unique sparse index on bookings.passToken verified.');

    console.log('\n=====================================================');
    console.log('🎉 Migration completed successfully!');
    console.log(`   - autoConfirmAfterPayment: Enabled by default`);
    console.log(`   - passToken backfilled: ${updatedCount} bookings`);
    console.log('=====================================================\n');
  } catch (err) {
    console.error('❌ Migration failed with error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

runMigration();


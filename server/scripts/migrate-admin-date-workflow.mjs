/**
 * Migration Script: migrate-admin-date-workflow.mjs
 * 
 * Performs:
 * 1. Ensures refundTimelineText: 'usually 5 to 7 working days' on SiteSettings (if missing)
 * 2. Backfills default fields on existing bookings:
 *    - dateChangeRequested: false
 *    - dateChangeReason: ''
 *    - dateChangeRequestedAt: null
 *    - refundDue: 0
 * 3. Ensures index on bookings.dateChangeRequested
 * 
 * Idempotent: safe to run repeatedly.
 * Command to run:
 *   node server/scripts/migrate-admin-date-workflow.mjs
 */

import path from 'path';
import { fileURLToPath } from 'url';
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
  console.log('🚀 Starting Marichin Homestay Admin Date-Workflow Migration');
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
    const settingsUpdate = await siteSettingsCol.updateOne(
      {},
      {
        $setOnInsert: {
          refundTimelineText: 'usually 5 to 7 working days'
        }
      },
      { upsert: false }
    );
    // Also set if field doesn't exist
    await siteSettingsCol.updateMany(
      { refundTimelineText: { $exists: false } },
      { $set: { refundTimelineText: 'usually 5 to 7 working days' } }
    );
    console.log(`✅ Site settings updated with refund timeline text`);

    // -----------------------------------------------------------------
    // STEP 2: Update Existing Bookings
    // -----------------------------------------------------------------
    console.log('\n--- Step 2: Updating Existing Bookings ---');
    const bookingsUpdate = await bookingsCol.updateMany(
      { dateChangeRequested: { $exists: false } },
      {
        $set: {
          dateChangeRequested: false,
          dateChangeReason: '',
          dateChangeRequestedAt: null,
          refundDue: 0
        }
      }
    );
    console.log(`✅ Backfilled date change defaults on ${bookingsUpdate.modifiedCount} booking(s)`);

    // -----------------------------------------------------------------
    // STEP 3: Ensure Index on dateChangeRequested
    // -----------------------------------------------------------------
    console.log('\n--- Step 3: Ensuring Index on dateChangeRequested ---');
    await bookingsCol.createIndex({ dateChangeRequested: 1 }, { background: true });
    console.log('✅ Index on bookings.dateChangeRequested confirmed');

    console.log('\n=====================================================');
    console.log('🎉 Migration completed successfully!');
    console.log('=====================================================');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

runMigration();


/**
 * Database Migration Script: Razorpay Payments & Refund Policy Integration
 * 
 * Target: MongoDB Atlas (via MONGODB_URI)
 * 
 * INSTRUCTIONS FOR USER:
 * 1. Back up your MongoDB Atlas cluster before running this migration.
 * 2. To execute this script against your Atlas database, run:
 *    cd homestayswebsite/server
 *    node scripts/migrate-razorpay-payments.mjs
 * 
 * What this migration performs:
 * - Confirms MongoDB connection and Atlas replica set multi-document transaction support.
 * - Creates sparse indices on Booking collection for rapid lookup and reconciliation:
 *   • razorpayOrderId (sparse, indexed)
 *   • razorpayPaymentId (sparse, indexed)
 *   • paymentStatus (indexed)
 * - Backfills default payment fields on existing Booking records:
 *   • Initializes refunds array as [] if missing.
 *   • Sets default paymentStatus if null or undefined.
 * - Seeds default refund policy rules into SiteSettings if unpopulated:
 *   • rejectionRefundPolicy: 'full_refund'
 *   • cancellationRefundPolicy: 'contact_host'
 *   • cancellationRefundDaysThreshold: 7
 *   • cancellationRefundPercentage: 100
 * - Safe to run multiple times (idempotent).
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ FATAL: MONGODB_URI environment variable not found in server/.env');
  process.exit(1);
}

async function runMigration() {
  console.log('====================================================');
  console.log('🚀 MARICHIN HOMESTAY: RAZORPAY MIGRATION SCRIPT');
  console.log('====================================================\n');

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected successfully to:', mongoose.connection.name);

    const db = mongoose.connection.db;

    // 1. CONFIRM TRANSACTION SUPPORT
    console.log('\n[Step 1/4] Verifying Replica Set and Transaction Support...');
    try {
      const session = await mongoose.startSession();
      await session.withTransaction(async () => {
        // No-op verification transaction
      });
      await session.endSession();
      console.log('✅ Multi-document ACID transactions verified and active on this MongoDB cluster.');
    } catch (txnErr) {
      console.warn('⚠️ WARNING: Transactions check raised notice:', txnErr.message);
    }

    // 2. CREATE SPARSES INDICES ON BOOKINGS
    console.log('\n[Step 2/4] Ensuring indexes for Razorpay payments and reconciliations...');
    const bookingsColl = db.collection('bookings');

    await bookingsColl.createIndex(
      { razorpayOrderId: 1 },
      { name: 'razorpayOrderId_sparse_1', sparse: true, background: true }
    );
    console.log('  • Created sparse index on bookings.razorpayOrderId');

    await bookingsColl.createIndex(
      { razorpayPaymentId: 1 },
      { name: 'razorpayPaymentId_sparse_1', sparse: true, background: true }
    );
    console.log('  • Created sparse index on bookings.razorpayPaymentId');

    await bookingsColl.createIndex(
      { paymentStatus: 1 },
      { name: 'paymentStatus_1', background: true }
    );
    console.log('  • Created index on bookings.paymentStatus');

    // 3. BACKFILL BOOKINGS
    console.log('\n[Step 3/4] Backfilling existing Booking records with payment defaults...');
    const updateRefunds = await bookingsColl.updateMany(
      { refunds: { $exists: false } },
      { $set: { refunds: [] } }
    );
    const updatePaymentStatus = await bookingsColl.updateMany(
      { paymentStatus: { $exists: false } },
      { $set: { paymentStatus: 'pending' } }
    );
    console.log(`  • Ensured payment defaults: ${updateRefunds.modifiedCount} refunds initialized, ${updatePaymentStatus.modifiedCount} paymentStatus initialized.`);

    // 4. SITE SETTINGS SEEDING
    console.log('\n[Step 4/4] Configuring default Razorpay refund policies in SiteSettings...');
    const settingsColl = db.collection('sitesettings');
    const existingSettings = await settingsColl.findOne({});

    if (!existingSettings) {
      await settingsColl.insertOne({
        propertyName: 'Marichin Homestay',
        rejectionRefundPolicy: 'full_refund',
        cancellationRefundPolicy: 'contact_host',
        cancellationRefundDaysThreshold: 7,
        cancellationRefundPercentage: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('  • Created new SiteSettings record with default Razorpay policies.');
    } else {
      const fieldsToSet = {};
      if (existingSettings.rejectionRefundPolicy === undefined) {
        fieldsToSet.rejectionRefundPolicy = 'full_refund';
      }
      if (existingSettings.cancellationRefundPolicy === undefined) {
        fieldsToSet.cancellationRefundPolicy = 'contact_host';
      }
      if (existingSettings.cancellationRefundDaysThreshold === undefined) {
        fieldsToSet.cancellationRefundDaysThreshold = 7;
      }
      if (existingSettings.cancellationRefundPercentage === undefined) {
        fieldsToSet.cancellationRefundPercentage = 100;
      }

      if (Object.keys(fieldsToSet).length > 0) {
        await settingsColl.updateOne(
          { _id: existingSettings._id },
          { $set: fieldsToSet }
        );
        console.log(`  • Patched missing refund policy fields (${Object.keys(fieldsToSet).join(', ')}) in SiteSettings.`);
      } else {
        console.log('  • All refund policy fields already present in SiteSettings. No changes needed.');
      }
    }

    console.log('\n====================================================');
    console.log('🎉 MIGRATION COMPLETE: All indexes and defaults are ready.');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
}

runMigration();


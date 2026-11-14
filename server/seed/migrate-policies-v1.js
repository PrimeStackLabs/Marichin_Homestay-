/**
 * Idempotent Policy & Refund Migration Script (v1)
 *
 * Safe to run multiple times against local or MongoDB Atlas:
 * 1. Adds new single-source refund/cancellation/safety/policy fields to SiteSettings ONLY when missing.
 * 2. Preserves any owner-edited text, pricing, contact details, or existing settings.
 * 3. Cleans up legacy duplicate refund fields from SiteSettings.
 * 4. Inserts default bilingual PolicySection drafts ($setOnInsert keyed by { page, key })
 *    so owner-edited or hidden sections are NEVER overwritten.
 * 5. Leaves SafetyContact empty until owner adds verified local contacts in Admin.
 *
 * Run from server folder:
 *   node seed/migrate-policies-v1.js
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { SiteSettings } from '../models/SiteSettings.js';
import { PolicySection } from '../models/PolicySection.js';
import { SafetyContact } from '../models/SafetyContact.js';
import { DEFAULT_POLICY_SECTIONS } from './policyDefaults.js';
import {
  DEFAULT_CANCELLATION_TIERS,
  DEFAULT_SAFETY_FEATURES,
  DEFAULT_DATE_CHANGE_RULE,
  DEFAULT_EARLY_DEPARTURE_RULE,
  DEFAULT_GATEWAY_FEE_NOTE
} from '../utils/refundPolicy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runMigration() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in server/.env. Aborting without changes.');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected.');

  const db = mongoose.connection.db;
  const settingsCollection = db.collection('sitesettings');

  // 1. Migrate SiteSettings without overwriting owner-configured values
  let rawSettings = await settingsCollection.findOne({});

  if (!rawSettings) {
    console.log('ℹ️ No existing SiteSettings document found. Creating initial defaults...');
    await SiteSettings.create({
      cancellationTiers: DEFAULT_CANCELLATION_TIERS,
      noShowRefundPercent: 0,
      refundTimelineText: '5 to 7 working days',
      hostCancelsRefundPercent: 100,
      dateChangeRule: DEFAULT_DATE_CHANGE_RULE,
      earlyDepartureRule: DEFAULT_EARLY_DEPARTURE_RULE,
      gatewayFeeNote: DEFAULT_GATEWAY_FEE_NOTE,
      safetyFeatures: DEFAULT_SAFETY_FEATURES,
      policiesLastUpdated: new Date(),
      sampleDefaultsVerified: {
        cancellationTiers: 'Sample value, please verify',
        noShowRefundPercent: 'Sample value, please verify',
        refundTimelineText: 'Sample value, please verify',
        hostCancelsRefundPercent: 'Sample value, please verify',
        dateChangeRule: 'Sample value, please verify',
        earlyDepartureRule: 'Sample value, please verify',
        gatewayFeeNote: 'Sample value, please verify'
      }
    });
    console.log('✅ Created SiteSettings with policy & refund defaults.');
  } else {
    const setFields = {};
    const verifiedFlags = { ...(rawSettings.sampleDefaultsVerified || {}) };

    if (!Array.isArray(rawSettings.cancellationTiers) || rawSettings.cancellationTiers.length === 0) {
      setFields.cancellationTiers = DEFAULT_CANCELLATION_TIERS;
      if (verifiedFlags.cancellationTiers === undefined) {
        verifiedFlags.cancellationTiers = 'Sample value, please verify';
      }
    }

    if (rawSettings.noShowRefundPercent === undefined || rawSettings.noShowRefundPercent === null) {
      setFields.noShowRefundPercent = 0;
      if (verifiedFlags.noShowRefundPercent === undefined) {
        verifiedFlags.noShowRefundPercent = 'Sample value, please verify';
      }
    }

    if (!rawSettings.refundTimelineText || rawSettings.refundTimelineText === 'usually 5 to 7 working days') {
      setFields.refundTimelineText = '5 to 7 working days';
      if (verifiedFlags.refundTimelineText === undefined) {
        verifiedFlags.refundTimelineText = 'Sample value, please verify';
      }
    }

    if (rawSettings.hostCancelsRefundPercent === undefined || rawSettings.hostCancelsRefundPercent === null) {
      setFields.hostCancelsRefundPercent = 100;
      if (verifiedFlags.hostCancelsRefundPercent === undefined) {
        verifiedFlags.hostCancelsRefundPercent = 'Sample value, please verify';
      }
    }

    if (!rawSettings.dateChangeRule || !rawSettings.dateChangeRule.en) {
      setFields.dateChangeRule = DEFAULT_DATE_CHANGE_RULE;
      if (verifiedFlags.dateChangeRule === undefined) {
        verifiedFlags.dateChangeRule = 'Sample value, please verify';
      }
    }

    if (!rawSettings.earlyDepartureRule || !rawSettings.earlyDepartureRule.en) {
      setFields.earlyDepartureRule = DEFAULT_EARLY_DEPARTURE_RULE;
      if (verifiedFlags.earlyDepartureRule === undefined) {
        verifiedFlags.earlyDepartureRule = 'Sample value, please verify';
      }
    }

    if (!rawSettings.gatewayFeeNote) {
      setFields.gatewayFeeNote = DEFAULT_GATEWAY_FEE_NOTE;
      if (verifiedFlags.gatewayFeeNote === undefined) {
        verifiedFlags.gatewayFeeNote = 'Sample value, please verify';
      }
    }

    if (!rawSettings.safetyFeatures || typeof rawSettings.safetyFeatures !== 'object') {
      setFields.safetyFeatures = { ...DEFAULT_SAFETY_FEATURES };
    }

    if (!rawSettings.policiesLastUpdated) {
      setFields.policiesLastUpdated = new Date();
    }

    // Clear invented default email if still present verbatim
    if (String(rawSettings.email || '').trim().toLowerCase() === 'info@marichinhomestay.com') {
      setFields.email = '';
    }

    for (const legacyKey of [
      'rejectionRefundPolicy',
      'cancellationRefundPolicy',
      'cancellationRefundDaysThreshold',
      'cancellationRefundPercentage',
      'cancellationNote',
      'policies'
    ]) {
      delete verifiedFlags[legacyKey];
    }

    setFields.sampleDefaultsVerified = verifiedFlags;

    const unsetFields = {
      rejectionRefundPolicy: 1,
      cancellationRefundPolicy: 1,
      cancellationRefundDaysThreshold: 1,
      cancellationRefundPercentage: 1,
      cancellationNote: 1,
      policies: 1
    };

    await settingsCollection.updateOne(
      { _id: rawSettings._id },
      {
        $set: setFields,
        $unset: unsetFields
      }
    );
    console.log('✅ Updated SiteSettings with missing policy/refund fields & removed duplicate refund fields.');
  }

  // 2. Idempotently insert default PolicySection documents (never overwrite owner text)
  let insertedSections = 0;
  let preservedSections = 0;

  for (const sec of DEFAULT_POLICY_SECTIONS) {
    const result = await PolicySection.updateOne(
      { page: sec.page, key: sec.key },
      { $setOnInsert: sec },
      { upsert: true }
    );
    if (result.upsertedCount && result.upsertedCount > 0) {
      insertedSections += 1;
    } else {
      preservedSections += 1;
    }
  }
  console.log(`✅ PolicySections: ${insertedSections} inserted, ${preservedSections} already existed (preserved untouched).`);

  // 3. Report SafetyContacts (kept empty unless owner added them in Admin)
  const existingSafetyCount = await SafetyContact.countDocuments();
  console.log(`ℹ️ SafetyContacts count: ${existingSafetyCount} (remains empty on public /safety until owner adds verified contacts in Admin).`);

  await mongoose.connection.close();
  console.log('🎉 Migration v1 finished cleanly.');
  process.exit(0);
}

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  mongoose.connection.close().catch(() => {});
  process.exit(1);
});


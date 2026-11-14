/**
 * Database Migration Script: Atomic Booking Engine & RoomNight Inventory Rebuild
 * (Includes Full Home & Room Booking Types)
 * 
 * Target: MongoDB Atlas (via MONGODB_URI)
 * 
 * INSTRUCTIONS FOR USER:
 * 1. Back up your MongoDB Atlas cluster before running this migration.
 * 2. To execute this script against your Atlas database, run:
 *    cd homestayswebsite/server
 *    node scripts/migrate-booking-engine.mjs
 * 
 * What this migration performs:
 * - Creates the RoomNight collection with a compound unique index on (room, date).
 * - Confirms MongoDB connection and Atlas replica set multi-document transaction support.
 * - Migrates existing bookings:
 *   • Sets bookingType: "room" on existing bookings (or preserves "full_home").
 *   • Populates lines, nights array, guest counts, and status history.
 * - Rebuilds RoomNight inventory counts from all active holding bookings (both single room & full home).
 * - Seeds default booking engine rules and Full Home defaults into SiteSettings:
 *   • minNights: 1, maxAdvanceDays: 365, sameDayCutoffTime: "18:00", holdMinutes: 15, autoConfirmAfterPayment: false
 *   • fullHomePricePerNight: 35000, fullHomeEnabled: true, fullHomeMinNights: 1, fullHomeMealsNote: "Morning breakfast included"
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

function toDateStr(input) {
  if (!input) return '';
  if (typeof input === 'string') {
    const match = input.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const d = new Date(input);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  }
  if (input instanceof Date && !isNaN(input.getTime())) {
    return input.toISOString().split('T')[0];
  }
  return '';
}

function generateNightsArray(checkIn, checkOut) {
  const inStr = toDateStr(checkIn);
  const outStr = toDateStr(checkOut);
  if (!inStr || !outStr || inStr >= outStr) return [];

  const nights = [];
  const [y, m, d] = inStr.split('-').map(Number);
  let cur = new Date(Date.UTC(y, m - 1, d));

  const [ey, em, ed] = outStr.split('-').map(Number);
  const end = new Date(Date.UTC(ey, em - 1, ed));

  while (cur < end) {
    const yStr = cur.getUTCFullYear();
    const mStr = String(cur.getUTCMonth() + 1).padStart(2, '0');
    const dStr = String(cur.getUTCDate()).padStart(2, '0');
    nights.push(`${yStr}-${mStr}-${dStr}`);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  return nights;
}

async function runMigration() {
  console.log('===============================================================');
  console.log('🚀 MARICHIN HOMESTAY - ATOMIC BOOKING ENGINE MIGRATION');
  console.log('===============================================================');
  console.log(`📡 Connecting to MongoDB Atlas: ${MONGODB_URI.replace(/:([^@]+)@/, ':****@')}`);

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  console.log(`✅ Connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);

  // Confirm MongoDB Replica Set / Transaction support
  const topologyType = mongoose.connection?.client?.topology?.description?.type;
  const isReplicaSet = topologyType && topologyType !== 'Single';
  console.log(`ℹ️  Cluster Topology: ${topologyType || 'Unknown'} (Replica Set / Transactions: ${isReplicaSet ? 'YES - FULL ACID SUPPORT' : 'Single Node'})`);

  // 1. ENSURE ROOMS EXIST WITH REAL DATA
  console.log('\n📦 Step 1: Verifying Room inventory definitions...');
  const roomsColl = db.collection('rooms');
  const allRooms = await roomsColl.find({}).toArray();
  console.log(`   Found ${allRooms.length} room type(s) in database.`);
  for (const r of allRooms) {
    console.log(`   • ${r.name} (${r.slug}): ${r.totalUnits} unit(s), ₹${r.pricePerNight}/night`);
  }

  // 2. CREATE ROOMNIGHTS COLLECTION AND UNIQUE COMPOUND INDEX
  console.log('\n📦 Step 2: Creating RoomNight collection and unique index on (room, date)...');
  const roomNightsColl = db.collection('roomnights');

  try {
    await roomNightsColl.createIndex({ room: 1, date: 1 }, { unique: true });
    await roomNightsColl.createIndex({ date: 1 });
    console.log('   ✅ Unique compound index { room: 1, date: 1 } confirmed on roomnights collection.');
  } catch (idxErr) {
    console.warn('   ⚠️ Index creation note:', idxErr.message);
  }

  // Clear existing roomnight records to perform fresh clean rebuild
  const deletedPrevious = await roomNightsColl.deleteMany({});
  console.log(`   Cleared ${deletedPrevious.deletedCount} prior RoomNight records for clean rebuild.`);

  // 3. MIGRATE BOOKINGS
  console.log('\n📦 Step 3: Migrating existing bookings...');
  const bookingsColl = db.collection('bookings');
  const allBookings = await bookingsColl.find({}).toArray();
  console.log(`   Found ${allBookings.length} total booking(s) to process.`);

  let migratedBookingsCount = 0;
  let activeHoldingBookingsCount = 0;
  let roomNightsRecordedCount = 0;

  for (const booking of allBookings) {
    const inDateStr = toDateStr(booking.checkIn);
    const outDateStr = toDateStr(booking.checkOut);
    const nights = generateNightsArray(inDateStr, outDateStr);

    // Normalize Status
    let status = (booking.status || 'confirmed').toLowerCase();
    if (status === 'pending') {
      status = 'paid_awaiting_confirmation';
    } else if (status === 'confirmed') {
      status = 'confirmed';
    } else if (status === 'cancelled') {
      status = 'cancelled';
    }

    const isFullHome = booking.bookingType === 'full_home';
    const guestCount = {
      adults: Number(booking.adults || booking.guestCount?.adults || 2),
      children: Number(booking.children || booking.guestCount?.children || 0)
    };

    const statusHistory = Array.isArray(booking.statusHistory) && booking.statusHistory.length > 0
      ? booking.statusHistory
      : [
          {
            who: 'system_migration',
            when: booking.createdAt || new Date(),
            reason: 'Migrated to booking engine model',
            status
          }
        ];

    const isHolding = ['payment_pending', 'paid_awaiting_confirmation', 'confirmed', 'checked_in', 'checked_out'].includes(status);

    if (isFullHome) {
      // Full Home booking migration: ensure lines has all active rooms with their totalUnits
      const fullHomeLines = allRooms.map((r) => ({
        room: r._id,
        roomName: r.name,
        roomSlug: r.slug,
        quantity: Number(r.totalUnits) || 1,
        pricePerNight: Number(r.pricePerNight) || 0
      }));
      const totalUnitsAll = fullHomeLines.reduce((sum, l) => sum + l.quantity, 0);

      await bookingsColl.updateOne(
        { _id: booking._id },
        {
          $set: {
            bookingType: 'full_home',
            room: null,
            roomName: 'Full Home (All 5 Rooms)',
            roomSlug: 'full-home',
            quantity: totalUnitsAll,
            lines: fullHomeLines,
            nights,
            guestCount,
            adults: guestCount.adults,
            children: guestCount.children,
            status,
            statusHistory,
            holdExpiresAt: status === 'payment_pending' ? new Date(Date.now() + 15 * 60 * 1000) : null
          }
        }
      );
      migratedBookingsCount++;

      if (isHolding) {
        activeHoldingBookingsCount++;
        for (const line of fullHomeLines) {
          for (const night of nights) {
            await roomNightsColl.updateOne(
              { room: line.room, date: night },
              { $inc: { booked: line.quantity } },
              { upsert: true }
            );
            roomNightsRecordedCount++;
          }
        }
      }
    } else {
      // Room booking migration: single room with quantity 1
      let matchedRoom = null;
      const targetId = booking.room || (booking.lines && booking.lines[0]?.room) || (booking.rooms && booking.rooms[0]?.room);
      const targetSlug = booking.roomSlug || (booking.lines && booking.lines[0]?.roomSlug) || (booking.rooms && booking.rooms[0]?.roomSlug);

      if (targetId) {
        matchedRoom = allRooms.find((rm) => String(rm._id) === String(targetId) || rm.slug === String(targetId));
      }
      if (!matchedRoom && targetSlug) {
        matchedRoom = allRooms.find((rm) => rm.slug === targetSlug);
      }
      if (!matchedRoom) {
        matchedRoom = allRooms[0];
      }

      const pricePerNight = Number(matchedRoom.pricePerNight || 8000);
      const lines = [
        {
          room: matchedRoom._id,
          roomName: matchedRoom.name,
          roomSlug: matchedRoom.slug,
          quantity: 1,
          pricePerNight
        }
      ];

      await bookingsColl.updateOne(
        { _id: booking._id },
        {
          $set: {
            bookingType: 'room',
            room: matchedRoom._id,
            roomName: matchedRoom.name,
            roomSlug: matchedRoom.slug,
            pricePerNight,
            quantity: 1,
            lines,
            nights,
            guestCount,
            adults: guestCount.adults,
            children: guestCount.children,
            status,
            statusHistory,
            holdExpiresAt: status === 'payment_pending' ? new Date(Date.now() + 15 * 60 * 1000) : null
          },
          $unset: {
            rooms: ''
          }
        }
      );
      migratedBookingsCount++;

      if (isHolding) {
        activeHoldingBookingsCount++;
        for (const night of nights) {
          await roomNightsColl.updateOne(
            { room: matchedRoom._id, date: night },
            { $inc: { booked: 1 } },
            { upsert: true }
          );
          roomNightsRecordedCount++;
        }
      }
    }
  }

  console.log(`   ✅ Migrated ${migratedBookingsCount} booking document(s).`);
  console.log(`   ✅ Identified ${activeHoldingBookingsCount} active holding booking(s).`);
  console.log(`   ✅ Successfully created/updated ${roomNightsRecordedCount} RoomNight inventory allocations.`);

  // 4. SEED SITE SETTINGS RULES
  console.log('\n📦 Step 4: Ensuring booking rules in SiteSettings...');
  const settingsColl = db.collection('sitesettings');
  let settings = await settingsColl.findOne({});

  const ruleDefaults = {
    minNights: 1,
    maxAdvanceDays: 365,
    sameDayCutoffTime: '18:00',
    checkInTime: '12:00 PM',
    checkOutTime: '11:00 AM',
    holdMinutes: 15,
    autoConfirmAfterPayment: false,
    fullHomePricePerNight: 35000,
    fullHomeEnabled: true,
    fullHomeMinNights: 1,
    fullHomeMealsNote: 'Morning breakfast included'
  };

  if (!settings) {
    await settingsColl.insertOne({
      ...ruleDefaults,
      propertyName: 'Marichin Homestay',
      sampleDefaultsVerified: {}
    });
    console.log('   ✅ Created SiteSettings with booking engine rules.');
  } else {
    const updateObj = {};
    for (const [key, val] of Object.entries(ruleDefaults)) {
      if (settings[key] === undefined) {
        updateObj[key] = val;
      }
    }
    if (Object.keys(updateObj).length > 0) {
      await settingsColl.updateOne({ _id: settings._id }, { $set: updateObj });
      console.log(`   ✅ Updated SiteSettings with ${Object.keys(updateObj).join(', ')}.`);
    } else {
      console.log('   ✅ SiteSettings already contains all booking rules.');
    }
  }

  // 5. PRINT INVENTORY AUDIT
  console.log('\n📊 Step 5: Active RoomNight inventory summary:');
  const inventorySummary = await roomNightsColl.find({ booked: { $gt: 0 } }).sort({ date: 1 }).toArray();
  if (inventorySummary.length === 0) {
    console.log('   (No nights currently occupied by active bookings)');
  } else {
    for (const inv of inventorySummary) {
      const room = allRooms.find((r) => String(r._id) === String(inv.room));
      const roomName = room ? room.name : String(inv.room);
      console.log(`   • ${inv.date} | ${roomName.padEnd(16)} | Booked: ${inv.booked}/${room?.totalUnits || 1}`);
    }
  }

  console.log('\n===============================================================');
  console.log('🎉 ATOMIC BOOKING ENGINE MIGRATION COMPLETE!');
  console.log('===============================================================');
  await mongoose.disconnect();
}

runMigration().catch((err) => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});


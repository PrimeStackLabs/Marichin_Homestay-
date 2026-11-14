/**
 * Migration Script: migrate-driving-routes.mjs
 * 
 * Performs:
 * 1. Inspects `SiteSettings.drivingDistances` in MongoDB Atlas.
 * 2. Backfills any missing place/city names, travel durations, and highway routes
 *    for Marichin Homestay's approximate driving routes (Kushalnagar, Madikeri, Mysuru, Bengaluru).
 * 3. Preserves custom driving distance entries if already configured.
 * 
 * Idempotent: safe to run multiple times.
 * Command to run (run from project root or server dir):
 *   node server/scripts/migrate-driving-routes.mjs
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

const PRESET_ROUTES = [
  {
    place: 'Kushalnagar Town',
    city: 'Kushalnagar Town',
    cityKn: 'ಕುಶಾಲನಗರ ಪಟ್ಟಣ',
    distance: '6 km',
    time: '~12 mins',
    timeKn: '~12 ನಿಮಿಷ',
    route: 'Via BM Road / SH88 & Gudde Hosur',
    routeKn: 'ಬಿ.ಎಂ ರಸ್ತೆ ಮತ್ತು ಗುಡ್ಡೆ ಹೊಸೂರು ಮಾರ್ಗ'
  },
  {
    place: 'Madikeri (Coorg HQ)',
    city: 'Madikeri (Coorg HQ)',
    cityKn: 'ಮಡಿಕೇರಿ (ಕೊಡಗು ಜಿಲ್ಲಾ ಕೇಂದ್ರ)',
    distance: '28 km',
    time: '~40 mins',
    timeKn: '~40 ನಿಮಿಷ',
    route: 'Via Mangalore - Mysore Hwy / NH 275',
    routeKn: 'ರಾಷ್ಟ್ರೀಯ ಹೆದ್ದಾರಿ 275 ಮುಖಾಂತರ'
  },
  {
    place: 'Mysuru (Railway Station)',
    city: 'Mysuru (Railway Station)',
    cityKn: 'ಮೈಸೂರು (ರೈಲ್ವೆ ನಿಲ್ದಾಣ)',
    distance: '95 km',
    time: '~2 hrs 15 mins',
    timeKn: '~2 ಗಂಟೆ 15 ನಿಮಿಷ',
    route: 'Via Mysore - Madikeri Rd / NH 275',
    routeKn: 'ಮೈಸೂರು - ಮಡಿಕೇರಿ ರಸ್ತೆ / ಎನ್.ಎಚ್ 275'
  },
  {
    place: 'Bengaluru (Bangalore)',
    city: 'Bengaluru (Bangalore)',
    cityKn: 'ಬೆಂಗಳೂರು ನಗರ',
    distance: '235 km',
    time: '~4.5 hrs',
    timeKn: '~4.5 ಗಂಟೆ',
    route: 'Via BLR - MYS Expressway & NH 275',
    routeKn: 'ಬೆಂಗಳೂರು - ಮೈಸೂರು ಎಕ್ಸ್‌ಪ್ರೆಸ್‌ವೇ & ಎನ್.ಎಚ್ 275'
  }
];

async function runMigration() {
  console.log('=====================================================');
  console.log('🚀 Starting Marichin Homestay Driving Routes Migration');
  console.log('=====================================================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const db = mongoose.connection.db;
    const siteSettingsCol = db.collection('sitesettings');

    const currentSettings = await siteSettingsCol.findOne();

    if (!currentSettings) {
      console.log('⚠️ No SiteSettings document found. Inserting defaults...');
      await siteSettingsCol.insertOne({
        propertyName: 'Marichin Homestay',
        drivingDistances: PRESET_ROUTES,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Created SiteSettings with default driving routes.');
    } else {
      console.log('ℹ️ Existing drivingDistances in Atlas:', JSON.stringify(currentSettings.drivingDistances, null, 2));

      // Build updated routes preserving any custom values but fixing empty place/city/route/time
      const existing = Array.isArray(currentSettings.drivingDistances) ? currentSettings.drivingDistances : [];
      let updatedRoutes = [];

      if (existing.length === 0) {
        updatedRoutes = PRESET_ROUTES;
      } else {
        updatedRoutes = existing.map((item, idx) => {
          const rawDist = String(item.distance || '').trim();
          const rawPlace = String(item.place || item.city || '').trim();

          // Match by place or distance
          let matched = null;
          if (rawPlace) {
            const lower = rawPlace.toLowerCase();
            matched = PRESET_ROUTES.find(r =>
              lower.includes(r.place.toLowerCase().split(' ')[0]) ||
              r.place.toLowerCase().includes(lower)
            );
          }
          if (!matched && rawDist) {
            const num = rawDist.replace(/\D/g, '');
            matched = PRESET_ROUTES.find(r => r.distance.replace(/\D/g, '') === num);
          }
          if (!matched && PRESET_ROUTES[idx]) {
            matched = PRESET_ROUTES[idx];
          }

          const place = rawPlace || (matched ? matched.place : `Transit Point ${idx + 1}`);
          const city = place;
          const distance = rawDist || (matched ? matched.distance : '');
          const time = item.time || (matched ? matched.time : '~30 mins');
          const route = item.route || (matched ? matched.route : 'Highway Connectivity');
          const cityKn = item.cityKn || (matched ? matched.cityKn : place);
          const timeKn = item.timeKn || (matched ? matched.timeKn : time);
          const routeKn = item.routeKn || (matched ? matched.routeKn : route);

          return {
            place,
            city,
            cityKn,
            distance,
            time,
            timeKn,
            route,
            routeKn
          };
        });

        // Ensure 4 key routes exist
        if (updatedRoutes.length < 4) {
          for (let i = updatedRoutes.length; i < PRESET_ROUTES.length; i++) {
            updatedRoutes.push(PRESET_ROUTES[i]);
          }
        }
      }

      const result = await siteSettingsCol.updateOne(
        { _id: currentSettings._id },
        {
          $set: {
            drivingDistances: updatedRoutes,
            updatedAt: new Date()
          }
        }
      );

      console.log(`✅ Successfully updated drivingDistances (${result.modifiedCount} document modified).`);
      console.log('New drivingDistances stored:', JSON.stringify(updatedRoutes, null, 2));
    }

    console.log('\n=====================================================');
    console.log('🎉 Migration completed successfully!');
    console.log('=====================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

runMigration();


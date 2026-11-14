/**
 * One-Time Database Migration Script: Room-Based Model
 * 
 * Target Database: MongoDB Atlas (or local dev via MONGODB_URI)
 * 
 * INSTRUCTIONS FOR USER:
 * 1. Back up your MongoDB Atlas cluster before running this migration.
 * 2. To run this script against your Atlas database, execute the following command from the server directory:
 *    cd homestayswebsite/server
 *    node scripts/migrate-to-room-based.mjs
 * 
 * What this script performs:
 * - Upserts 3 room types with real property data:
 *   • Standard Room: 2 units, 2 adults + 1 child, balcony facing, ₹8,000/night, morning breakfast included (Photos: real3, real5).
 *   • Suite Room: 2 units, 2 adults + 2 children, balcony facing, ₹10,000/night, morning breakfast included (Photos: real4, real6).
 *   • Single Room: 1 unit, 2 adults, no balcony, ₹6,000/night, morning breakfast included (Placeholder tile in UI).
 * - Updates SiteSettings to remove whole-home wording and set default taxPercent = 0, extraGuestCharge = 0.
 * - Removes legacy room slugs if present.
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
  console.error('❌ MONGODB_URI environment variable not found in server/.env');
  process.exit(1);
}

async function migrate() {
  console.log('🚀 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB.');

  const db = mongoose.connection.db;

  // 1. UPDATE ROOMS COLLECTION
  console.log('📦 Updating rooms to Room-Based Model...');
  const roomsCollection = db.collection('rooms');

  const roomsToUpsert = [
    {
      slug: 'standard-room',
      name: 'Standard Room',
      category: 'Standard Room',
      tag: 'Balcony facing',
      isRealPhoto: true,
      hasBalcony: true,
      mealsIncluded: 'Morning breakfast',
      bedLayout: '',
      sizeSqft: null,
      pricePerNight: 8000,
      weekendPrice: 8000,
      maxAdults: 2,
      maxChildren: 1,
      maxGuests: 3,
      totalUnits: 2,
      view: '',
      description: 'Balcony-facing room for 2 adults and 1 child. Morning breakfast included.',
      images: [
        { url: '/images/realimage/real3.jpeg', alt: 'Standard Room wooden double bed' },
        { url: '/images/realimage/real5.jpeg', alt: 'Standard Room beds with white linen' }
      ],
      amenities: [
        'Morning breakfast',
        'Wi-Fi',
        'Parking Facility',
        'Campfire',
        'Indoor & Outdoor Games',
        'Estate Walk'
      ],
      isActive: true,
      displayOrder: 1,
      updatedAt: new Date()
    },
    {
      slug: 'suite-room',
      name: 'Suite Room',
      category: 'Suite Room',
      tag: 'Balcony facing',
      isRealPhoto: true,
      hasBalcony: true,
      mealsIncluded: 'Morning breakfast',
      bedLayout: '',
      sizeSqft: null,
      pricePerNight: 10000,
      weekendPrice: 10000,
      maxAdults: 2,
      maxChildren: 2,
      maxGuests: 4,
      totalUnits: 2,
      view: '',
      description: 'Balcony-facing room for 2 adults and 2 children. Morning breakfast included.',
      images: [
        { url: '/images/realimage/real4.jpeg', alt: 'Suite Room interior with balcony entrance' },
        { url: '/images/realimage/real6.jpeg', alt: 'Suite Room ensuite bathroom and view' }
      ],
      amenities: [
        'Morning breakfast',
        'Wi-Fi',
        'Parking Facility',
        'Campfire',
        'Indoor & Outdoor Games',
        'Estate Walk'
      ],
      isActive: true,
      displayOrder: 2,
      updatedAt: new Date()
    },
    {
      slug: 'single-room',
      name: 'Single Room',
      category: 'Single Room',
      tag: 'No balcony',
      isRealPhoto: false,
      hasBalcony: false,
      mealsIncluded: 'Morning breakfast',
      bedLayout: '',
      sizeSqft: null,
      pricePerNight: 6000,
      weekendPrice: 6000,
      maxAdults: 2,
      maxChildren: 0,
      maxGuests: 2,
      totalUnits: 1,
      view: '',
      description: 'Room for 2 adults, without balcony. Morning breakfast included.',
      images: [], // No real photo exists; neutral placeholder rendered in UI
      amenities: [
        'Morning breakfast',
        'Wi-Fi',
        'Parking Facility',
        'Campfire',
        'Indoor & Outdoor Games',
        'Estate Walk'
      ],
      isActive: true,
      displayOrder: 3,
      updatedAt: new Date()
    }
  ];

  for (const r of roomsToUpsert) {
    await roomsCollection.updateOne(
      { slug: r.slug },
      { $set: r, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    console.log(`  ✓ Upserted: ${r.name} (₹${r.pricePerNight}, ${r.totalUnits} units, Balcony: ${r.hasBalcony})`);
  }

  // Remove legacy slug duplicates if any
  const deletedOld = await roomsCollection.deleteMany({
    slug: { $in: ['real-standard-room', 'real-suite-room'] }
  });
  if (deletedOld.deletedCount > 0) {
    console.log(`  ✓ Removed ${deletedOld.deletedCount} legacy duplicate rooms.`);
  }

  // 2. UPDATE SITESETTINGS COLLECTION
  console.log('⚙️ Updating SiteSettings to Room-Based Model...');
  const siteSettingsCollection = db.collection('sitesettings');

  await siteSettingsCollection.updateOne(
    {},
    {
      $set: {
        tagline: 'Escape to Nature. Experience Warm Hospitality.',
        seoTitle: 'Marichin Homestay | Authentic Plantation Sanctuary in Kushalnagar, Coorg',
        seoDescription: 'Experience pristine coffee plantation living at Marichin Homestay in Kushalnagar, Coorg. Bonfires, estate walks & nature retreat.',
        mealsIncluded: 'Morning breakfast',
        inclusionsNote: 'Includes morning breakfast, Wi-Fi, parking, campfire, indoor and outdoor games and estate walk',
        roomsPageHeading: 'Our Rooms',
        roomsPageDescription: 'Three room types, each with morning breakfast included. Choose the room that fits your group.',
        aboutStoryText: 'Welcome to Marichin Homestay, situated amidst lush coffee plantations in Chikkabettageri Village near Kushalnagar, Kodagu. Enjoy peaceful nature, morning estate walks, and cozy evening campfires.',
        phones: ['+91 XXXXX XXXXX', '+91 XXXXX XXXXX'],
        whatsappNumber: '+91 XXXXX XXXXX',
        facilities: [
          'Morning breakfast',
          'Wi-Fi',
          'Parking Facility',
          'Campfire',
          'Indoor & Outdoor Games',
          'Estate Walk'
        ],
        taxPercent: 0,
        extraGuestCharge: 0,
        'sampleDefaultsVerified.taxPercent': 'Sample value, please verify',
        'sampleDefaultsVerified.extraGuestCharge': 'Sample value, please verify',
        updatedAt: new Date()
      }
    }
  );
  console.log('  ✓ SiteSettings updated with room-based defaults, placeholder phones, and sample verification markers.');

  // 3. UPDATE INCLUSIONS COLLECTION (Mongoose InclusionItem -> 'inclusionitems')
  console.log('📋 Updating Inclusions Collection...');
  const inclusionsCollection = db.collection('inclusionitems');

  // Remove obsolete "Entire homestay" inclusion
  await inclusionsCollection.deleteMany({
    $or: [
      { 'title.en': { $regex: /entire homestay/i } },
      { 'title.kn': { $regex: /ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ/i } }
    ]
  });

  const inclusionsToUpsert = [
    {
      type: 'include',
      title: { en: 'Morning breakfast', kn: 'ಬೆಳಗಿನ ಉಪಹಾರ' },
      note: { en: 'Freshly prepared wholesome home-style breakfast served every morning.', kn: 'ಪ್ರತಿದಿನ ಮುಂಜಾನೆ ತಾಜಾವಾಗಿ ತಯಾರಿಸಿದ ಆರೋಗ್ಯಕರ ಮನೆ ಶೈಲಿಯ ಉಪಹಾರ.' },
      icon: 'Coffee',
      displayOrder: 1,
      isActive: true
    },
    {
      type: 'include',
      title: { en: 'Wi-Fi', kn: 'ವೈ-ಫೈ (Wi-Fi)' },
      note: { en: 'High-speed wireless internet across common living, dining, and verandah areas.', kn: 'ಸಾಮಾನ್ಯ ವಾಸದ ಕೋಣೆ, ಊಟದ ಹಾಲ್ ಮತ್ತು ವರಾಂಡಾ ಪ್ರದೇಶಗಳಲ್ಲಿ ಹೈ-ಸ್ಪೀಡ್ ವೈ-ಫೈ.' },
      icon: 'Wifi',
      displayOrder: 2,
      isActive: true
    },
    {
      type: 'include',
      title: { en: 'Parking facility', kn: 'ವಾಹನ ನಿಲುಗಡೆ ಸೌಲಭ್ಯ' },
      note: { en: 'Secure on-premises vehicle parking within the gated homestay grounds.', kn: 'ಹೋಂಸ್ಟೇ ಆವರಣದೊಳಗೆ ವಾಹನಗಳಿಗೆ ಸುರಕ್ಷಿತ ಪಾರ್ಕಿಂಗ್ ಸೌಲಭ್ಯ.' },
      icon: 'Car',
      displayOrder: 3,
      isActive: true
    },
    {
      type: 'include',
      title: { en: 'Campfire', kn: 'ಕ್ಯಾಂಪ್‌ಫೈರ್ (ಬೆಂಕಿ ಕಾಯಿಸುವಿಕೆ)' },
      note: { en: 'Cozy evening campfire setup under the open Coorg night skies.', kn: 'ತೆರೆದ ಕೂರ್ಗ್ ರಾತ್ರಿಯ ಆಕಾಶದ ಕೆಳಗೆ ಸ್ನೇಹಪರ ಸಂಜೆ ಕ್ಯಾಂಪ್‌ಫೈರ್ ಅನುಭವ.' },
      icon: 'Flame',
      displayOrder: 4,
      isActive: true
    },
    {
      type: 'include',
      title: { en: 'Indoor & outdoor games', kn: 'ಒಳಾಂಗಣ ಮತ್ತು ಹೊರಾಂಗಣ ಆಟಗಳು' },
      note: { en: 'Carrom, board games, badminton, and spacious lawn recreation for all age groups.', kn: 'ಕ್ಯಾರಮ್, ಬೋರ್ಡ್ ಆಟಗಳು, ಬ್ಯಾಡ್ಮಿಂಟನ್ ಮತ್ತು ಎಲ್ಲಾ ವಯೋಮಾನದವರಿಗೆ ಹೊರಾಂಗಣ ಆಟಗಳು.' },
      icon: 'Gamepad2',
      displayOrder: 5,
      isActive: true
    },
    {
      type: 'include',
      title: { en: 'Estate walk', kn: 'ಕಾಫಿ ತೋಟದ ನಡಿಗೆ' },
      note: { en: 'Serene morning or evening walk amidst the green coffee and spice plantation trails.', kn: 'ಕಾಫಿ ಮತ್ತು ಸಾಂಬಾರ ಪದಾರ್ಥಗಳ ತೋಟದ ಹಾದಿಗಳಲ್ಲಿ ಪ್ರಶಾಂತವಾದ ಮುಂಜಾನೆ ಅಥವಾ ಸಂಜೆಯ ನಡಿಗೆ.' },
      icon: 'Footprints',
      displayOrder: 6,
      isActive: true
    },
    {
      type: 'exclude',
      title: { en: 'Dinner', kn: 'ರಾತ್ರಿಯ ಊಟ' },
      note: { en: 'Available on request, ask the host', kn: 'ಕೋರಿಕೆಯ ಮೇರೆಗೆ ಲಭ್ಯ, ಆತಿಥೇಯರನ್ನು ವಿಚಾರಿಸಿ' },
      icon: 'UtensilsCrossed',
      displayOrder: 1,
      isActive: true
    }
  ];

  for (const inc of inclusionsToUpsert) {
    await inclusionsCollection.updateOne(
      { 'title.en': inc.title.en },
      { $set: inc },
      { upsert: true }
    );
  }
  // Also remove old "Homely food" and "Meals beyond those included" inclusion records
  await inclusionsCollection.deleteMany({
    $or: [
      { 'title.en': { $regex: /^homely food$/i } },
      { 'title.en': { $regex: /^meals beyond those included$/i } }
    ]
  });
  console.log('  ✓ Inclusions updated: 6 included items & Dinner under not included.');

  console.log('\n🎉 Migration completed successfully!');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});


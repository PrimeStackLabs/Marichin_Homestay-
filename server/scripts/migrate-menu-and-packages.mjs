/**
 * One-Time Database Migration Script: Real Food Menu & New Packages
 * 
 * Target Database: MongoDB Atlas (or local dev via MONGODB_URI)
 * 
 * INSTRUCTIONS FOR USER:
 * 1. Back up your MongoDB Atlas cluster before running this migration.
 * 2. To run this script against your Atlas database, execute the following command from the server directory:
 *    cd homestayswebsite/server
 *    node scripts/migrate-menu-and-packages.mjs
 * 
 * What this script performs:
 * - Deletes all old sample dishes completely (Pandi Curry, Koli Curry, Akki Roti, etc.)
 * - Upserts the 4 Real Menu Categories:
 *   • Morning Breakfast
 *   • Dinner, Veg
 *   • Dinner, Non-Veg
 *   • Evening
 * - Upserts the 8 Real Menu Dishes with illustrative badges and WebP photography:
 *   • Paputtu with egg curry (Non-Veg, price: null)
 *   • Chapati with kadala curry (chickpea curry) (Veg, price: null)
 *   • Kadambuttu with rajma curry (Veg, price: null)
 *   • Rice item: lemon rice, puliyogare (Veg, price: null)
 *   • Coffee / Tea (Morning) (Veg, price: null)
 *   • Chapati; white rice with vegetable curry, rasam, veg palya, curd and pickle (Veg Dinner, price: null)
 *   • Chapati; white rice with chicken fry or chicken curry, curd and vegetable curry (Non-Veg Dinner, price: null)
 *   • Coffee / Tea. (Evening) (Veg, price: null)
 * - Empties meal timings and disables auxiliary kitchen so they remain hidden until filled in Admin.
 * - Upserts the 4 Real Packages:
 *   1. Room + Breakfast: "Choose any room. Morning breakfast included." (₹6,000 / From ₹6,000 per night)
 *   2. Room + Breakfast + Dinner: "Dinner choice: veg or non-veg from the menu." (price: null / Contact us for rates)
 *   3. Entire Homestay (all 5 rooms): "Exclusive reservation of all 5 rooms" (₹42,000 / Total for all rooms)
 *   4. Family Stay: "1 Standard or Suite room with breakfast." (price: null / Contact us for rates)
 * - Deletes legacy packages ('complete-homestay-stay' and old variants).
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

  // STEP 0 (Safety Check): Ensure Room-Based Model is initialized even if migrate-to-room-based was not run first
  console.log('\n🛡️ Step 0: Pre-flight Safety Check for Room-Based Model...');
  const roomsCollection = db.collection('rooms');
  const existingSingle = await roomsCollection.findOne({ slug: 'single-room' });
  if (!existingSingle) {
    console.log('  ⚠️ Room-based model not detected. Initializing 3 rooms (Standard, Suite, Single)...');
    const roomsToUpsert = [
      {
        slug: 'standard-room',
        name: 'Standard Room',
        category: 'Standard Room',
        tag: 'Balcony Facing',
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
        amenities: ['Morning breakfast', 'Wi-Fi', 'Parking Facility', 'Campfire', 'Indoor & Outdoor Games', 'Estate Walk'],
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
        amenities: ['Morning breakfast', 'Wi-Fi', 'Parking Facility', 'Campfire', 'Indoor & Outdoor Games', 'Estate Walk'],
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
        images: [],
        amenities: ['Morning breakfast', 'Wi-Fi', 'Parking Facility', 'Campfire', 'Indoor & Outdoor Games', 'Estate Walk'],
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
    }
    await roomsCollection.deleteMany({ slug: { $nin: ['standard-room', 'suite-room', 'single-room'] } });

    const siteSettingsCollection = db.collection('sitesettings');
    await siteSettingsCollection.updateOne(
      {},
      {
        $set: {
          tagline: 'Escape to Nature. Experience Warm Hospitality.',
          seoTitle: 'Marichin Homestay | Authentic Plantation Sanctuary in Kushalnagar, Coorg',
          seoDescription: 'Experience pristine coffee plantation living at Marichin Homestay in Kushalnagar, Coorg. Authentic home-cooked food, bonfires, estate walks & nature retreat.',
          mealsIncluded: 'Morning breakfast',
          inclusionsNote: 'Includes morning breakfast, Wi-Fi, parking, campfire, indoor and outdoor games and estate walk',
          roomsPageHeading: 'Our Rooms',
          roomsPageDescription: 'Comfortable, well-ventilated rooms nestled in our coffee estate. Choose from Standard, Suite, and Single rooms.',
          taxPercent: 0,
          extraGuestCharge: 0,
          'sampleDefaultsVerified.taxPercent': 'Sample value, please verify',
          'sampleDefaultsVerified.extraGuestCharge': 'Sample value, please verify',
          updatedAt: new Date()
        }
      }
    );
    console.log('  ✓ Pre-flight room-based safety sync complete.');
  } else {
    console.log('  ✓ Room-based model verified active.');
  }

  // 1. CLEAN UP AND UPDATE MENU CATEGORIES
  console.log('\n📦 Step 1: Deleting ALL Existing Categories & Inserting 4 Real Categories...');
  const categoryCollection = db.collection('menucategories');

  // Purge ALL existing categories
  await categoryCollection.deleteMany({});
  console.log('  • Purged ALL existing menu categories in Atlas');

  const realCategories = [
    {
      slug: 'morning-breakfast',
      name: 'Morning Breakfast',
      nameKn: 'ಬೆಳಗಿನ ಉಪಹಾರ',
      subtitle: '',
      subtitleKn: '',
      description: '',
      descriptionKn: '',
      icon: 'leaf',
      displayOrder: 1,
      isActive: true
    },
    {
      slug: 'dinner-veg',
      name: 'Dinner, Veg',
      nameKn: 'ರಾತ್ರಿಯ ಊಟ, ಸಸ್ಯಾಹಾರಿ',
      subtitle: '',
      subtitleKn: '',
      description: '',
      descriptionKn: '',
      icon: 'leaf',
      displayOrder: 2,
      isActive: true
    },
    {
      slug: 'dinner-non-veg',
      name: 'Dinner, Non-Veg',
      nameKn: 'ರಾತ್ರಿಯ ಊಟ, ಮಾಂಸಾಹಾರಿ',
      subtitle: '',
      subtitleKn: '',
      description: '',
      descriptionKn: '',
      icon: 'CookingPot',
      displayOrder: 3,
      isActive: true
    },
    {
      slug: 'evening',
      name: 'Evening',
      nameKn: 'ಸಂಜೆ',
      subtitle: '',
      subtitleKn: '',
      description: '',
      descriptionKn: '',
      icon: 'Clock',
      displayOrder: 4,
      isActive: true
    }
  ];

  for (const cat of realCategories) {
    await categoryCollection.insertOne(cat);
    console.log(`  • Category: ${cat.name} (${cat.slug})`);
  }

  // 2. DELETE ALL EXISTING DISHES & INSERT REAL MENU DISHES
  console.log('\n📦 Step 2: Purging ALL Existing Dishes & Inserting Real Dishes...');
  const itemsCollection = db.collection('menuitems');

  // Purge ALL existing dishes
  await itemsCollection.deleteMany({});
  console.log('  • Purged ALL existing menu items in Atlas');

  const realDishes = [
    // Morning Breakfast
    {
      category: 'morning-breakfast',
      name: 'Paputtu with egg curry',
      nameKn: 'ಪಾಪುಟ್ಟು ಮತ್ತು ಮೊಟ್ಟೆ ಸಾರು',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: false,
      badge: '',
      badgeKn: '',
      image: '/images/food/paputtu_egg_curry.webp',
      isIllustrative: true,
      displayOrder: 1,
      isActive: true
    },
    {
      category: 'morning-breakfast',
      name: 'Chapati with kadala curry (chickpea curry)',
      nameKn: 'ಚಪಾತಿ ಮತ್ತು ಕಡಲೆ ಸಾರು',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/chapati_kadala_curry.webp',
      isIllustrative: true,
      displayOrder: 2,
      isActive: true
    },
    {
      category: 'morning-breakfast',
      name: 'Kadambuttu with rajma curry',
      nameKn: 'ಕದಂಬುಟ್ಟು ಮತ್ತು ರಾಜ್ಮಾ ಸಾರು',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/kadambuttu_rajma_curry.webp',
      isIllustrative: true,
      displayOrder: 3,
      isActive: true
    },
    {
      category: 'morning-breakfast',
      name: 'Lemon rice',
      nameKn: 'ಲೆಮನ್ ರೈಸ್',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/lemon_rice.webp',
      isIllustrative: true,
      displayOrder: 4,
      isActive: true
    },
    {
      category: 'morning-breakfast',
      name: 'Puliyogare',
      nameKn: 'ಪುಳಿಯೋಗರೆ',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/puliyogare.webp',
      isIllustrative: true,
      displayOrder: 5,
      isActive: true
    },
    {
      category: 'morning-breakfast',
      name: 'Coffee',
      nameKn: 'ಕಾಫಿ',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/coffee.webp',
      isIllustrative: true,
      displayOrder: 6,
      isActive: true
    },
    {
      category: 'morning-breakfast',
      name: 'Tea',
      nameKn: 'ಚಹಾ',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/tea.webp',
      isIllustrative: true,
      displayOrder: 7,
      isActive: true
    },

    // Dinner, Veg
    {
      category: 'dinner-veg',
      name: 'Chapati',
      nameKn: 'ಚಪಾತಿ',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/chapati.webp',
      isIllustrative: true,
      displayOrder: 1,
      isActive: true
    },
    {
      category: 'dinner-veg',
      name: 'White rice with vegetable curry, rasam, veg palya, curd and pickle',
      nameKn: 'ಅನ್ನ, ತರಕಾರಿ ಸಾರು, ರಸಂ, ಪಲ್ಯ, ಮೊಸರು ಮತ್ತು ಉಪ್ಪಿನಕಾಯಿ',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/veg_dinner_thali.webp',
      isIllustrative: true,
      displayOrder: 2,
      isActive: true
    },

    // Dinner, Non-Veg
    {
      category: 'dinner-non-veg',
      name: 'Chapati',
      nameKn: 'ಚಪಾತಿ',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/chapati.webp',
      isIllustrative: true,
      displayOrder: 1,
      isActive: true
    },
    {
      category: 'dinner-non-veg',
      name: 'White rice with chicken fry or chicken curry',
      nameKn: 'ಅನ್ನ ಮತ್ತು ಚಿಕನ್ ಫ್ರೈ ಅಥವಾ ಚಿಕನ್ ಸಾರು',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: false,
      badge: '',
      badgeKn: '',
      image: '/images/food/chicken_rice_dinner.webp',
      isIllustrative: true,
      displayOrder: 2,
      isActive: true
    },
    {
      category: 'dinner-non-veg',
      name: 'Curd and vegetable curry',
      nameKn: 'ಮೊಸರು ಮತ್ತು ತರಕಾರಿ ಸಾರು',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/curd_veg_curry.webp',
      isIllustrative: true,
      displayOrder: 3,
      isActive: true
    },

    // Evening
    {
      category: 'evening',
      name: 'Coffee',
      nameKn: 'ಕಾಫಿ',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/coffee.webp',
      isIllustrative: true,
      displayOrder: 1,
      isActive: true
    },
    {
      category: 'evening',
      name: 'Tea',
      nameKn: 'ಚಹಾ',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/tea.webp',
      isIllustrative: true,
      displayOrder: 2,
      isActive: true
    }
  ];

  for (const dish of realDishes) {
    await itemsCollection.insertOne(dish);
    console.log(`  • Dish: ${dish.name} (${dish.isVeg ? 'Veg' : 'Non-Veg'})`);
  }

  // 3. RESET DINING CONTENT
  console.log('\n📦 Step 3: Resetting DiningContent...');
  const diningContentCollection = db.collection('diningcontents');
  await diningContentCollection.deleteMany({});
  await diningContentCollection.insertOne({
    hero: {
      badge: { en: 'HOMELY DINING', kn: 'ಮನೆಯೂಟ' },
      title: { en: 'Homely Food at Marichin Homestay', kn: 'ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇನಲ್ಲಿ ಮನೆಯೂಟ' },
      description: { en: 'Homely food at Marichin Homestay.', kn: 'ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇನಲ್ಲಿ ಮನೆಯೂಟ.' },
      tags: [
        { en: 'Breakfast', kn: 'ಉಪಹಾರ' },
        { en: 'Dinner Veg and Non-Veg', kn: 'ರಾತ್ರಿಯ ಊಟ (ಸಸ್ಯಾಹಾರಿ ಮತ್ತು ಮಾಂಸಾಹಾರಿ)' },
        { en: 'Evening Tea and Coffee', kn: 'ಸಂಜೆಯ ಚಹಾ ಮತ್ತು ಕಾಫಿ' }
      ]
    },
    timings: {
      heading: { en: 'Meal Timings', kn: 'ಊಟದ ಸಮಯ' },
      subtitle: { en: '', kn: '' },
      description: { en: '', kn: '' },
      items: []
    },
    auxiliaryKitchen: {
      enabled: false,
      badge: { en: '', kn: '' },
      heading: { en: '', kn: '' },
      text: { en: '', kn: '' },
      buttonLabel: { en: '', kn: '' }
    },
    menuSection: {
      badge: { en: 'MENU', kn: 'ಮೆನು' },
      heading: { en: 'Homely Dining Menu', kn: 'ಮನೆ ಊಟದ ಪಟ್ಟಿ' },
      description: { en: 'Home-cooked meals at the homestay.', kn: 'ಹೋಂಸ್ಟೇನಲ್ಲಿ ಮನೆಯೂಟ.' }
    }
  });
  console.log('  • Set meal timings to empty (hidden) and auxiliary kitchen disabled until filled in Admin.');

  // 4. UPDATE PACKAGES COLLECTION
  console.log('\n📦 Step 4: Upserting 4 Curated Packages...');
  const packagesCollection = db.collection('packages');

  // Remove legacy package
  await packagesCollection.deleteMany({
    slug: { $nin: ['room-breakfast', 'room-breakfast-dinner', 'entire-homestay-5-rooms', 'family-stay'] }
  });

  const packagesToUpsert = [
    {
      slug: 'room-breakfast',
      title: 'Room + Breakfast',
      name: 'Room + Breakfast',
      description: 'Choose any room. Morning breakfast included.',
      inclusions: [
        'Choose any room (Standard, Suite, or Single)',
        'Morning breakfast included',
        'High-Speed Wi-Fi & Parking Facility',
        'Evening Campfire Gathering',
        'Indoor & Outdoor Games',
        'Guided Coffee Estate Walk'
      ],
      features: [
        'Choose any room (Standard, Suite, or Single)',
        'Morning breakfast included',
        'High-Speed Wi-Fi & Parking Facility',
        'Evening Campfire Gathering',
        'Indoor & Outdoor Games',
        'Guided Coffee Estate Walk'
      ],
      durationLabel: 'Per Night',
      duration: 'Per Night',
      price: 6000,
      regularPrice: 6000,
      offerPrice: 6000,
      discount: null,
      idealFor: 'Couples & Families',
      image: '/images/realimage/real3.jpeg',
      tag: 'Flexible Room Choice',
      displayOrder: 1,
      isActive: true,
      isSample: false
    },
    {
      slug: 'room-breakfast-dinner',
      title: 'Room + Breakfast + Dinner',
      name: 'Room + Breakfast + Dinner',
      description: 'Dinner choice: veg or non-veg from the menu.',
      inclusions: [
        'Choose any room (Standard, Suite, or Single)',
        'Morning breakfast included',
        'Dinner choice: veg or non-veg from the menu',
        'High-Speed Wi-Fi & Parking Facility',
        'Evening Campfire Gathering',
        'Indoor & Outdoor Games',
        'Guided Coffee Estate Walk'
      ],
      features: [
        'Choose any room (Standard, Suite, or Single)',
        'Morning breakfast included',
        'Dinner choice: veg or non-veg from the menu',
        'High-Speed Wi-Fi & Parking Facility',
        'Evening Campfire Gathering',
        'Indoor & Outdoor Games',
        'Guided Coffee Estate Walk'
      ],
      durationLabel: 'Per Night',
      duration: 'Per Night',
      price: null,
      regularPrice: null,
      offerPrice: null,
      discount: null,
      idealFor: 'Couples & Families',
      image: '/images/realimage/real8.jpeg',
      tag: 'Breakfast & Dinner',
      displayOrder: 2,
      isActive: true,
      isSample: true
    },
    {
      slug: 'entire-homestay-5-rooms',
      title: 'Entire Homestay (all 5 rooms)',
      name: 'Entire Homestay (all 5 rooms)',
      description: 'Exclusive reservation of all 5 rooms (2 Standard Rooms, 2 Suite Rooms, 1 Single Room).',
      inclusions: [
        'Exclusive reservation of all 5 homestay rooms',
        'Total capacity: up to 10 adults + 6 children',
        'Morning breakfast included for all guests',
        'High-Speed Wi-Fi & Parking Facility',
        'Evening Campfire Gathering',
        'Indoor & Outdoor Games',
        'Guided Coffee Estate Walk'
      ],
      features: [
        'Exclusive reservation of all 5 homestay rooms',
        'Total capacity: up to 10 adults + 6 children',
        'Morning breakfast included for all guests',
        'High-Speed Wi-Fi & Parking Facility',
        'Evening Campfire Gathering',
        'Indoor & Outdoor Games',
        'Guided Coffee Estate Walk'
      ],
      durationLabel: 'Per Night',
      duration: 'Per Night',
      price: 42000,
      regularPrice: 42000,
      offerPrice: 42000,
      discount: null,
      idealFor: 'Groups up to 10 Adults + 6 Children',
      image: '/images/realimage/homeimage.jpeg',
      tag: 'Exclusive All 5 Rooms',
      displayOrder: 3,
      isActive: true,
      isSample: false
    },
    {
      slug: 'family-stay',
      title: 'Family Stay',
      name: 'Family Stay',
      description: '1 Standard or Suite room with breakfast.',
      inclusions: [
        '1 Standard or Suite room',
        'Morning breakfast included',
        'High-Speed Wi-Fi & Parking Facility',
        'Evening Campfire Gathering',
        'Indoor & Outdoor Games',
        'Guided Coffee Estate Walk'
      ],
      features: [
        '1 Standard or Suite room',
        'Morning breakfast included',
        'High-Speed Wi-Fi & Parking Facility',
        'Evening Campfire Gathering',
        'Indoor & Outdoor Games',
        'Guided Coffee Estate Walk'
      ],
      durationLabel: 'Per Night',
      duration: 'Per Night',
      price: null,
      regularPrice: null,
      offerPrice: null,
      discount: null,
      idealFor: 'Families',
      image: '/images/realimage/real4.jpeg',
      tag: 'Family Special',
      displayOrder: 4,
      isActive: true,
      isSample: true
    }
  ];

  for (const pkg of packagesToUpsert) {
    await packagesCollection.updateOne(
      { slug: pkg.slug },
      { $set: pkg },
      { upsert: true }
    );
    console.log(`  • Package: ${pkg.title} (${pkg.slug})`);
  }

  // 5. UPDATE SITE SETTINGS IN ATLAS (Ensure placeholder phones)
  console.log('\n📦 Step 5: Normalizing SiteSettings in Atlas...');
  const settingsCollection = db.collection('sitesettings');
  await settingsCollection.updateMany(
    {},
    {
      $set: {
        phones: ['+91 XXXXX XXXXX', '+91 XXXXX XXXXX'],
        phone: '+91 XXXXX XXXXX',
        whatsappNumber: '+91 XXXXX XXXXX',
        mealsIncluded: 'Morning breakfast',
        roomsPageDescription: 'Three room types, each with morning breakfast included. Choose the room that fits your group.'
      }
    }
  );
  console.log('  • Set phone and whatsapp to placeholder +91 XXXXX XXXXX in Atlas');

  console.log('\n🎉 Migration completed successfully!');
  await mongoose.connection.close();
  console.log('🔒 Closed database connection.');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});


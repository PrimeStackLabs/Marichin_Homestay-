import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function cleanAtlas() {
  if (!process.env.MONGODB_URI) {
    console.error('No MONGODB_URI found in environment.');
    process.exit(1);
  }

  console.log('Connecting to Atlas to inspect and clean test data...');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const collections = [
    'activitylogs',
    'bookings',
    'blockeddates',
    'enquiries',
    'newsletters',
    'reviews',
    'rooms',
    'sitesettings',
    'galleryimages',
    'menuitems',
    'menucategories',
    'packages',
    'experiences',
    'promos',
    'users'
  ];

  const beforeCounts = {};
  for (const c of collections) {
    beforeCounts[c] = await db.collection(c).countDocuments();
  }

  // 1. List records modified or created by test runs
  const testLogs = await db.collection('activitylogs').find().toArray();
  console.log(`Found ${testLogs.length} test activity logs to delete.`);

  // 2. Clear activity logs
  await db.collection('activitylogs').deleteMany({});

  // 3. Clear stray bookings, blocked dates, enquiries, newsletters
  await db.collection('bookings').deleteMany({});
  await db.collection('blockeddates').deleteMany({});
  await db.collection('enquiries').deleteMany({});
  await db.collection('newsletters').deleteMany({});

  // 4. Update all seeded sample reviews to 'hidden'
  const revUpdate = await db.collection('reviews').updateMany({}, { $set: { status: 'hidden' } });
  console.log(`Updated ${revUpdate.modifiedCount} reviews to status: 'hidden'`);

  // 5. Restore sitesettings: remove invented reg number and set placeholders
  await db.collection('sitesettings').updateMany({}, {
    $set: {
      registrationNumber: '',
      whatsappNumber: '+91 95912 09522',
      phones: ['+91 95912 09522'],
      instagramUrl: 'https://www.instagram.com/coorg_marichin_homestay?utm_source=qr&cplk=bWd6MjhrcHducjVt',
      facebookUrl: 'https://www.facebook.com/profile.php?id=61596613283636',
      youtubeUrl: 'https://www.youtube.com/channel/UCaf39e4l1iRDA-CMj72q1gQ',
      address: 'Chikkabettageri Village, Gudde Hosur Post, Kushalnagar, Kodagu District, Karnataka 571234',
      email: 'coorgmarichinhomestay@gmail.com'
    }
  });

  // 6. Restore canonical room prices
  await db.collection('rooms').updateOne({ slug: 'standard-room' }, { $set: { pricePerNight: 8000, weekendPrice: 8000, maxAdults: 2, maxChildren: 1, maxGuests: 3, totalUnits: 2, hasBalcony: true } });
  await db.collection('rooms').updateOne({ slug: 'suite-room' }, { $set: { pricePerNight: 10000, weekendPrice: 10000, maxAdults: 2, maxChildren: 2, maxGuests: 4, totalUnits: 2, hasBalcony: true } });
  await db.collection('rooms').updateOne({ slug: 'single-room' }, { $set: { pricePerNight: 6000, weekendPrice: 6000, maxAdults: 2, maxChildren: 0, maxGuests: 2, totalUnits: 1, hasBalcony: false } });
  await db.collection('rooms').deleteMany({ slug: { $in: ['valley-mist-wooden-cottage', 'heritage-plantation-villa'] } });

  const afterCounts = {};
  for (const c of collections) {
    afterCounts[c] = await db.collection(c).countDocuments();
  }

  console.log('\n===============================================================');
  console.log('📊 ATLAS COLLECTIONS AUDIT: BEFORE vs AFTER CLEANUP');
  console.log('===============================================================');
  for (const c of collections) {
    const diff = afterCounts[c] - beforeCounts[c];
    const diffStr = diff === 0 ? ' (No change)' : ` (${diff > 0 ? '+' : ''}${diff})`;
    console.log(`  ${c.padEnd(16)}: Before = ${String(beforeCounts[c]).padStart(2)} -> After = ${String(afterCounts[c]).padStart(2)}${diffStr}`);
  }
  console.log('===============================================================\n');

  await mongoose.connection.close();
  process.exit(0);
}

cleanAtlas().catch(err => {
  console.error('Error during Atlas cleanup:', err);
  process.exit(1);
});


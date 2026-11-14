import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const REAL_INSTAGRAM_URL = 'https://www.instagram.com/coorg_marichin_homestay?utm_source=qr&cplk=bWd6MjhrcHducjVt';

async function updateInstagramUrl() {
  if (!process.env.MONGODB_URI) {
    console.error('No MONGODB_URI found in server/.env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB to update SiteSettings instagramUrl...');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const result = await db.collection('sitesettings').updateMany(
    {},
    {
      $set: {
        instagramUrl: REAL_INSTAGRAM_URL,
        'sampleDefaultsVerified.instagramUrl': true
      }
    }
  );

  console.log(`✅ Updated ${result.modifiedCount} SiteSettings document(s) to ${REAL_INSTAGRAM_URL}.`);
  await mongoose.disconnect();
  process.exit(0);
}

updateInstagramUrl().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});


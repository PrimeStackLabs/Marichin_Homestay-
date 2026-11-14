import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const REAL_YOUTUBE_URL = 'https://www.youtube.com/channel/UCaf39e4l1iRDA-CMj72q1gQ';

async function updateYoutubeUrl() {
  if (!process.env.MONGODB_URI) {
    console.error('No MONGODB_URI found in server/.env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB to update SiteSettings youtubeUrl...');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const result = await db.collection('sitesettings').updateMany(
    {},
    {
      $set: {
        youtubeUrl: REAL_YOUTUBE_URL,
        'sampleDefaultsVerified.youtubeUrl': true
      }
    }
  );

  console.log(`✅ Updated ${result.modifiedCount} SiteSettings document(s) to ${REAL_YOUTUBE_URL}.`);
  await mongoose.disconnect();
  process.exit(0);
}

updateYoutubeUrl().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});


import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const REAL_PHONE = '+91 95912 09522';

async function updateContactNumber() {
  if (!process.env.MONGODB_URI) {
    console.error('No MONGODB_URI found in server/.env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB to update SiteSettings phone and WhatsApp numbers...');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const result = await db.collection('sitesettings').updateMany(
    {},
    {
      $set: {
        phones: [REAL_PHONE],
        whatsappNumber: REAL_PHONE
      }
    }
  );

  console.log(`✅ Updated ${result.modifiedCount} SiteSettings document(s) to ${REAL_PHONE}.`);
  await mongoose.disconnect();
  process.exit(0);
}

updateContactNumber().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});


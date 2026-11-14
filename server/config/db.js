import mongoose from 'mongoose';

let connectionPromise = null;

export const connectDB = async () => {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    const isTest = process.env.NODE_ENV === 'test';
    if (isTest) {
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const testUri = mongod.getUri();
        const conn = await mongoose.connect(testUri);
        console.log(`🧪 Test Database (Isolated In-Memory) connected at: ${testUri}`);
        return conn;
      } catch (testDbErr) {
        console.error('❌ FATAL: Could not launch isolated in-memory test database:', testDbErr.message);
        process.exit(1);
      }
    }

    const uri = process.env.MONGODB_URI;
    const isProduction = process.env.NODE_ENV === 'production';

    if (!uri && isProduction) {
      console.error('❌ FATAL ERROR: MONGODB_URI is required in production environment.');
      process.exit(1);
    }

    if (uri) {
      try {
        const conn = await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 10000,
        });
        console.log(`✅ MongoDB Connected (Atlas/Persistent): ${conn.connection.host}/${conn.connection.name}`);
        return conn;
      } catch (error) {
        console.error(`❌ MongoDB Connection Error (${uri.replace(/:([^@]+)@/, ':****@')}): ${error.message}`);
        
        if (isProduction) {
          console.error('❌ FATAL ERROR: Server refusing to start in production without a valid MongoDB connection.');
          process.exit(1);
        }
      }
    }

    // Development Fallback to MongoMemoryServer with Loud Warning
    try {
      console.warn(`
********************************************************************************
⚠️  LOUD WARNING: RUNNING WITH TEMPORARY IN-MEMORY MONGODB DATABASE!
⚠️  ALL CREATED BOOKINGS, ROOMS, AND SETTINGS WILL BE LOST UPON SERVER RESTART.
⚠️  REASON: MongoDB Atlas/local connection failed or MONGODB_URI was invalid.
⚠️  TO PERSIST DATA: Check username/password in server/.env for your Atlas cluster.
********************************************************************************
`);
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`ℹ️  In-Memory Database active at: ${memoryUri}`);
      return conn;
    } catch (memErr) {
      console.error('❌ Failed to start in-memory MongoDB fallback:', memErr.message);
      process.exit(1);
    }
  })();

  return connectionPromise;
};

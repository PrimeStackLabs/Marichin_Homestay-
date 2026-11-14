import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly set NODE_ENV to test
process.env.NODE_ENV = 'test';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
process.env.NODE_ENV = 'test';

// Dynamically import app and seedDatabase so NODE_ENV='test' is active
const { connectDB } = await import('../config/db.js');
const { default: app } = await import('../server.js');
const { seedDatabase } = await import('../seed/seed.js');

let server;
const PORT = 5555;
const BASE_URL = `http://localhost:${PORT}/api`;

const runTests = async () => {
  console.log('\n=============================================');
  console.log('🧪 RUNNING MARICHIN HOMESTAY BACKEND VERIFICATION');
  console.log('=============================================\n');

  // Await isolated DB connection
  await connectDB();

  // Strict test database isolation guard
  const host = mongoose.connection.host || '';
  if (host.includes('mongodb.net') || host.includes('cluster') || (!host.includes('127.0.0.1') && !host.includes('localhost'))) {
    console.error(`❌ FATAL TEST GUARD: Refusing to run tests against non-isolated database: ${host}`);
    process.exit(1);
  }
  console.log(`🔒 Test isolation verified: connected strictly to ${host}`);

  // Start test server
  await seedDatabase();

  server = app.listen(PORT, () => {
    console.log(`Test server running at http://localhost:${PORT}`);
  });

  let passed = 0;
  let failed = 0;

  const assert = (condition, name, details = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  };

  try {
    // TEST 1: Health check
    console.log('\n--- 1. Testing Health & Public Endpoints ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.success, 'GET /api/health');

    // TEST 2: Rooms listing
    const roomsRes = await fetch(`${BASE_URL}/rooms`);
    const roomsData = await roomsRes.json();
    assert(roomsRes.status === 200 && Array.isArray(roomsData.data) && roomsData.data.length > 0, 'GET /api/rooms returns seeded rooms');

    const standardRoom = roomsData.data.find(r => r.slug === 'real-standard-room') || roomsData.data[0];

    // TEST 3: Site settings
    const settingsRes = await fetch(`${BASE_URL}/settings`);
    const settingsData = await settingsRes.json();
    assert(settingsRes.status === 200 && settingsData.data?.propertyName === 'Marichin Homestay', 'GET /api/settings');

    // TEST 4: Menu, Packages, Experiences, Gallery, Reviews
    const menuRes = await fetch(`${BASE_URL}/menu`);
    const menuData = await menuRes.json();
    assert(menuRes.status === 200 && menuData.data?.length > 0, 'GET /api/menu');

    const galleryRes = await fetch(`${BASE_URL}/gallery`);
    const galleryData = await galleryRes.json();
    assert(galleryRes.status === 200 && galleryData.data?.length > 0, 'GET /api/gallery');

    // TEST 5: Double-Booking Prevention
    console.log('\n--- 2. Testing Double-Booking Prevention & Recalculation ---');
    const firstBookingPayload = {
      roomId: standardRoom._id,
      guestName: 'First Test Guest',
      email: 'guest1@example.com',
      phone: '+919999911111',
      checkIn: '2026-12-10',
      checkOut: '2026-12-13',
      adults: 2,
      children: 0,
      promoCode: 'MISTDIRECT',
      advanceOption: 20
    };

    const firstBookingRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firstBookingPayload)
    });
    const firstBookingData = await firstBookingRes.json();
    assert(
      firstBookingRes.status === 201 && firstBookingData.data?.bookingCode,
      `Create initial booking (Code: ${firstBookingData.data?.bookingCode})`
    );

    // Overlapping booking attempt (must be rejected!)
    const overlappingPayload = {
      roomId: standardRoom._id,
      guestName: 'Second Conflicting Guest',
      email: 'guest2@example.com',
      phone: '+919999922222',
      checkIn: '2026-12-12', // Overlaps with 2026-12-10 to 2026-12-13
      checkOut: '2026-12-15',
      adults: 2,
      children: 0,
      advanceOption: 20
    };

    const overlapRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(overlappingPayload)
    });
    const overlapData = await overlapRes.json();
    assert(
      overlapRes.status === 400 && overlapData.success === false,
      'Double-booking rejected with 400 status',
      overlapData.message
    );

    // TEST 6: Promo Code Validation
    console.log('\n--- 3. Testing Promo Validation ---');
    // Valid Promo
    const validPromoRes = await fetch(`${BASE_URL}/promos/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'MISTDIRECT', nights: 2, amount: 9000 })
    });
    const validPromoData = await validPromoRes.json();
    assert(validPromoRes.status === 200 && validPromoData.data?.discountPercent === 15, 'Valid promo MISTDIRECT accepted (15% discount)');

    // Invalid Promo (must be rejected)
    const invalidPromoRes = await fetch(`${BASE_URL}/promos/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'INVALIDCODE999', nights: 2, amount: 9000 })
    });
    const invalidPromoData = await invalidPromoRes.json();
    assert(invalidPromoRes.status === 400 && invalidPromoData.success === false, 'Invalid promo code rejected with 400');

    // TEST 7: Authentication & Unauthorized Admin Call
    console.log('\n--- 4. Testing Authentication & Authorization ---');
    // Unauthorized call without token (must return 401)
    const unauthRes = await fetch(`${BASE_URL}/admin/dashboard`);
    const unauthData = await unauthRes.json();
    assert(unauthRes.status === 401 && unauthData.success === false, 'Unauthenticated call to /api/admin/dashboard returns 401');

    // Login as Admin
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@marichinhomestay.com',
        password: process.env.ADMIN_PASSWORD || 'Marichin@2026'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.data?.token;
    assert(loginRes.status === 200 && token, 'Admin login succeeds and returns JWT token');

    // Authorized call with Bearer token
    const authDashboardRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const authDashboardData = await authDashboardRes.json();
    assert(authDashboardRes.status === 200 && authDashboardData.success, 'Authorized call to /api/admin/dashboard returns 200 and KPI stats');

    // TEST 8: File Upload Security (Wrong file type rejected)
    console.log('\n--- 5. Testing File Upload Validation ---');
    // Create temporary bad file (.txt)
    const badFilePath = path.join(__dirname, 'test.txt');
    fs.writeFileSync(badFilePath, 'This is a test text file, not an image.');

    const formDataBad = new FormData();
    const badBlob = new Blob([fs.readFileSync(badFilePath)], { type: 'text/plain' });
    formDataBad.append('image', badBlob, 'test.txt');

    const uploadBadRes = await fetch(`${BASE_URL}/admin/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formDataBad
    });
    const uploadBadData = await uploadBadRes.json();
    assert(uploadBadRes.status === 400 && uploadBadData.success === false, 'File upload of .txt rejected (Must be JPG/PNG/WEBP)');

    fs.unlinkSync(badFilePath);

    // Create temporary valid image (1x1 PNG)
    const validPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const validFilePath = path.join(__dirname, 'test-image.png');
    fs.writeFileSync(validFilePath, validPngBuffer);

    const formDataGood = new FormData();
    const goodBlob = new Blob([validPngBuffer], { type: 'image/png' });
    formDataGood.append('image', goodBlob, 'test-image.png');

    const uploadGoodRes = await fetch(`${BASE_URL}/admin/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formDataGood
    });
    const uploadGoodData = await uploadGoodRes.json();
    assert(uploadGoodRes.status === 201 && uploadGoodData.data?.url, 'Valid PNG upload accepted and saved in /server/uploads');

    fs.unlinkSync(validFilePath);

    // Clean up uploaded file from server
    if (uploadGoodData.data?.filename) {
      await fetch(`${BASE_URL}/admin/upload/${uploadGoodData.data.filename}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    // TEST 9: Newsletter & Contact Enquiries
    console.log('\n--- 6. Testing Newsletter & Enquiries ---');
    const newsRes = await fetch(`${BASE_URL}/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'wanderer@example.com' })
    });
    const newsData = await newsRes.json();
    assert(newsRes.status === 201 && newsData.success, 'POST /api/newsletter accepts valid subscription');

    const enqRes = await fetch(`${BASE_URL}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Arjun Rao',
        phone: '+91 99887 76655',
        email: 'arjun@example.com',
        message: 'Do you offer pickup service from Mysore railway station?'
      })
    });
    const enqData = await enqRes.json();
    assert(enqRes.status === 201 && enqData.success, 'POST /api/enquiries receives and stores enquiry');

    console.log('\n=============================================');
    console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    try {
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        console.log('🧹 Cleaning up test database...');
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
      }
    } catch (cleanErr) {
      console.warn('Test cleanup warning:', cleanErr.message);
    }
    process.exit(0);
  }
};

runTests();


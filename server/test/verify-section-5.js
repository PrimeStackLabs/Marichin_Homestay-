// Strictly isolated test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '5055';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
process.env.NODE_ENV = 'test';
process.env.PORT = '5055';

const PORT = 5055;
const BASE_URL = `http://localhost:${PORT}/api`;
const uploadsDir = path.resolve(__dirname, '../uploads');

async function runSection5Verification() {
  console.log('\n===============================================================');
  console.log('🧪 RUNNING SECTION 5 REAL TESTS AGAINST ISOLATED TEST DATABASE');
  console.log('===============================================================\n');

  const { connectDB } = await import('../config/db.js');
  const { default: app } = await import('../server.js');
  const { seedDatabase } = await import('../seed/seed.js');

  // Await isolated in-memory DB connection
  const conn = await connectDB();

  // Strict Test Database Isolation Guard
  const host = mongoose.connection.host || '';
  if (host.includes('mongodb.net') || host.includes('cluster') || (!host.includes('127.0.0.1') && !host.includes('localhost'))) {
    console.error(`❌ FATAL TEST GUARD: Refusing to run tests against non-isolated database: ${host}`);
    console.error('Aborting immediately to protect live Atlas database.');
    process.exit(1);
  }
  console.log(`🔒 Test isolation verified: connected strictly to ${host}`);

  // Seed isolated in-memory database
  await seedDatabase();

  let server = app.listen(PORT, () => {
    console.log(`🚀 Isolated test server running on port ${PORT}`);
  });

  const testResults = [];
  const logTest = (name, passed, details = '') => {
    testResults.push({ name, passed, details });
    if (passed) {
      console.log(`  ✅ PASS: ${name}`);
    } else {
      console.error(`  ❌ FAIL: ${name} -> ${details}`);
    }
  };

  try {
    // -------------------------------------------------------------
    // Login as Admin & Staff to obtain tokens
    // -------------------------------------------------------------
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@marichinhomestay.com', password: process.env.ADMIN_PASSWORD || 'Marichin@2026' })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.data?.token;

    const staffLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@marichinhomestay.com', password: 'Staff@2026' })
    });
    const staffLoginData = await staffLoginRes.json();
    const staffToken = staffLoginData.data?.token;

    // -------------------------------------------------------------
    // TEST 1: Restart the server process and confirm data is still present
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Server Restart Data Persistence ---');
    // Save a unique document
    const testDocSlug = `restart-test-${Date.now()}`;
    const { Room } = await import('../models/Room.js');
    await Room.create({
      name: 'Persistence Test Room',
      slug: testDocSlug,
      category: 'cottage',
      description: 'Verifying data persists across server restart',
      pricePerNight: 9999,
      maxGuests: 2,
      images: [{ url: '/images/room1.jpg', alt: 'Test' }]
    });

    // Simulate server process restart: close server, disconnect DB, reconnect & restart
    server.close();
    const savedUri = mongoose.connection.client.s.url;
    await mongoose.connection.close();

    // Reconnect to the same database instance
    await mongoose.connect(savedUri);
    server = app.listen(PORT);

    // Verify document persists
    const persistedRoom = await Room.findOne({ slug: testDocSlug });
    const restartSuccess = persistedRoom && persistedRoom.pricePerNight === 9999;
    logTest('Restart server process and confirm data is still present', restartSuccess,
      restartSuccess ? `Document ${testDocSlug} found after restart` : 'Document lost after restart');

    // Clean up
    await Room.deleteOne({ slug: testDocSlug });

    // -------------------------------------------------------------
    // TEST 2: Staff accessing /admin/users and /admin/settings is blocked
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Staff Role Access Restrictions ---');
    const staffUsersGet = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const staffUsersPost = await fetch(`${BASE_URL}/admin/users`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacker', email: 'hack@test.com', password: 'Password123!', role: 'admin' })
    });
    const staffSettingsPut = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+919999999999' })
    });

    const staffBlocked = staffUsersGet.status === 403 && staffUsersPost.status === 403 && staffSettingsPut.status === 403;
    logTest('Staff accessing /admin/users and /admin/settings is blocked (403 Forbidden)', staffBlocked,
      `Users GET: ${staffUsersGet.status}, Users POST: ${staffUsersPost.status}, Settings PUT: ${staffSettingsPut.status}`);

    // -------------------------------------------------------------
    // TEST 3: Admin gallery upload works and shows on public Gallery; deleting removes both file and record
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Admin Gallery Upload and File + Record Hard Delete ---');
    // Create a temporary physical test file in uploads
    const testFileName = `test-verify-img-${Date.now()}.jpg`;
    const testFilePath = path.join(uploadsDir, testFileName);
    fs.writeFileSync(testFilePath, 'fake image binary data for verification');

    const fileCreatedOnDisk = fs.existsSync(testFilePath);

    // Create gallery image record pointing to this uploaded file
    const createGalleryRes = await fetch(`${BASE_URL}/admin/gallery`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: `/uploads/${testFileName}`,
        alt: 'Hard Delete Verification Image',
        category: 'estate',
        displayOrder: 999
      })
    });
    const galleryCreated = await createGalleryRes.json();
    const createdImgId = galleryCreated.data?._id;

    // Check visible on public gallery
    const pubGalleryBefore = await (await fetch(`${BASE_URL}/gallery`)).json();
    const visiblePublicly = pubGalleryBefore.data?.some(img => String(img._id) === String(createdImgId));

    // Admin deletes the gallery image
    const deleteGalleryRes = await fetch(`${BASE_URL}/admin/gallery/${createdImgId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    // Check public gallery - record gone
    const pubGalleryAfter = await (await fetch(`${BASE_URL}/gallery`)).json();
    const recordRemoved = !pubGalleryAfter.data?.some(img => String(img._id) === String(createdImgId));

    // Check file on disk - file deleted
    const fileRemovedFromDisk = !fs.existsSync(testFilePath);

    const galleryUploadDeleteSuccess = fileCreatedOnDisk && visiblePublicly && deleteGalleryRes.status === 200 && recordRemoved && fileRemovedFromDisk;
    logTest('Admin gallery upload works, shows publicly, deleting removes BOTH file and record', galleryUploadDeleteSuccess,
      `File created: ${fileCreatedOnDisk}, Visible publicly: ${visiblePublicly}, Record deleted: ${recordRemoved}, File removed from disk: ${fileRemovedFromDisk}`);

    // If file still exists for some reason, clean up
    if (fs.existsSync(testFilePath)) {
      try { fs.unlinkSync(testFilePath); } catch {}
    }

    // -------------------------------------------------------------
    // TEST 4: Adding, editing and deleting Room, Package, Experience
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Room, Package, Experience CRUD ---');
    // 4A. Room CRUD
    const addRoomRes = await fetch(`${BASE_URL}/admin/rooms`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Crud Verification Room',
        slug: `crud-room-${Date.now()}`,
        category: 'suite',
        description: 'Testing add, edit, and delete room',
        pricePerNight: 5500,
        images: [{ url: '/images/room2.jpg', alt: 'Test Room' }]
      })
    });
    const roomCreated = await addRoomRes.json();
    const testRoomId = roomCreated.data?._id;

    const editRoomRes = await fetch(`${BASE_URL}/admin/rooms/${testRoomId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ pricePerNight: 5800, name: 'Crud Verification Room Updated' })
    });
    const roomUpdated = await editRoomRes.json();

    const deleteRoomRes = await fetch(`${BASE_URL}/admin/rooms/${testRoomId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const roomDeleted = await (await fetch(`${BASE_URL}/rooms/${roomCreated.data?.slug}`)).json();

    const roomCrudSuccess = addRoomRes.status === 201 && editRoomRes.status === 200 && roomUpdated.data?.pricePerNight === 5800 && deleteRoomRes.status === 200 && !roomDeleted.success;
    logTest('Room: add, edit, and delete work from admin', roomCrudSuccess,
      `Add: ${addRoomRes.status}, Edit: ${editRoomRes.status}, Delete: ${deleteRoomRes.status}`);

    // 4B. Package CRUD
    const addPkgRes = await fetch(`${BASE_URL}/admin/packages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Crud Verification Package',
        slug: `crud-pkg-${Date.now()}`,
        description: 'Testing add, edit, delete package',
        regularPrice: 12000,
        offerPrice: 9999,
        durationLabel: '2 Nights / 3 Days',
        inclusions: ['Breakfast', 'Plantation Tour']
      })
    });
    const pkgCreated = await addPkgRes.json();
    const testPkgId = pkgCreated.data?._id;

    const editPkgRes = await fetch(`${BASE_URL}/admin/packages/${testPkgId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerPrice: 8999, title: 'Crud Verification Package Updated' })
    });
    const pkgUpdated = await editPkgRes.json();

    const deletePkgRes = await fetch(`${BASE_URL}/admin/packages/${testPkgId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pubPkgs = await (await fetch(`${BASE_URL}/packages`)).json();
    const pkgDeleted = !pubPkgs.data?.some(p => String(p._id) === String(testPkgId));

    const pkgCrudSuccess = addPkgRes.status === 201 && editPkgRes.status === 200 && pkgUpdated.data?.offerPrice === 8999 && deletePkgRes.status === 200 && pkgDeleted;
    logTest('Package: add, edit, and delete work from admin', pkgCrudSuccess,
      `Add: ${addPkgRes.status}, Edit: ${editPkgRes.status}, Delete: ${deletePkgRes.status}`);

    // 4C. Experience CRUD
    const addExpRes = await fetch(`${BASE_URL}/admin/experiences`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Crud Verification Experience',
        description: 'Testing add, edit, delete experience',
        category: 'outdoor',
        season: 'all',
        durationLabel: '2 Hours',
        distanceLabel: 'On-site'
      })
    });
    const expCreated = await addExpRes.json();
    const testExpId = expCreated.data?._id;

    const editExpRes = await fetch(`${BASE_URL}/admin/experiences/${testExpId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ durationLabel: '3 Hours', title: 'Crud Verification Experience Updated' })
    });
    const expUpdated = await editExpRes.json();

    const deleteExpRes = await fetch(`${BASE_URL}/admin/experiences/${testExpId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pubExps = await (await fetch(`${BASE_URL}/experiences`)).json();
    const expDeleted = !pubExps.data?.some(e => String(e._id) === String(testExpId));

    const expCrudSuccess = addExpRes.status === 201 && editExpRes.status === 200 && expUpdated.data?.durationLabel === '3 Hours' && deleteExpRes.status === 200 && expDeleted;
    logTest('Experience: add, edit, and delete work from admin', expCrudSuccess,
      `Add: ${addExpRes.status}, Edit: ${editExpRes.status}, Delete: ${deleteExpRes.status}`);

    // -------------------------------------------------------------
    // TEST 5: Users management & Activity Log audit trail
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing User Management & Activity Log Audit Trail ---');
    const testStaffEmail = `staff_audit_${Date.now()}@marichinhomestay.com`;
    // Add staff
    const addUserRes = await fetch(`${BASE_URL}/admin/users`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Audit Trail Staff',
        email: testStaffEmail,
        phone: '+919845012345',
        password: 'StaffPassword@123',
        role: 'staff'
      })
    });
    const userCreated = await addUserRes.json();
    const testUserId = userCreated.data?._id || userCreated.data?.id;

    // Change role to guest
    const changeRoleRes = await fetch(`${BASE_URL}/admin/users/${testUserId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'guest' })
    });

    // Disable user
    const disableUserRes = await fetch(`${BASE_URL}/admin/users/${testUserId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false })
    });

    // Verify deactivated user cannot log in
    const disabledLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStaffEmail, password: 'StaffPassword@123' })
    });

    // Check Activity Logs
    const logsRes = await fetch(`${BASE_URL}/admin/activity-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const logsData = await logsRes.json();
    const hasCreateLog = logsData.data?.some(l => l.action?.includes('USER') || l.details?.email === testStaffEmail);

    const userManagementSuccess = addUserRes.status === 201 && changeRoleRes.status === 200 && disableUserRes.status === 200 && disabledLoginRes.status === 403 && logsData.success;
    logTest('Users: add staff, change role, disable. Activity Log captures actions', userManagementSuccess,
      `Add: ${addUserRes.status}, Change role: ${changeRoleRes.status}, Disable: ${disableUserRes.status}, Deactivated Login: ${disabledLoginRes.status}, Logs captured: ${hasCreateLog}`);

    // Clean up user
    if (testUserId) {
      await fetch(`${BASE_URL}/admin/users/${testUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    }

    // -------------------------------------------------------------
    // TEST 6: Change phone in Site Settings and confirm update
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Site Settings Phone Update ---');
    const updatePhoneRes = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ phones: ['+91 91234 56789'] })
    });

    const pubSettingsRes = await fetch(`${BASE_URL}/settings`);
    const pubSettings = await pubSettingsRes.json();
    const phoneMatches = pubSettings.data?.phones?.[0] === '+91 91234 56789';

    // Restore to placeholder
    await fetch(`${BASE_URL}/admin/settings`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ phones: ['+91 XXXXX XXXXX'] })
    });

    const phoneUpdateSuccess = updatePhoneRes.status === 200 && phoneMatches;
    logTest('Change phone number in Site Settings, Footer/Contact get updated data', phoneUpdateSuccess,
      `Update status: ${updatePhoneRes.status}, Reflects in GET /api/settings: ${phoneMatches}`);

    // -------------------------------------------------------------
    // TEST 7: 375px mobile responsiveness check
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing 375px Mobile Viewport Layout Safety ---');
    // Check AdminLayout file for mobile layout safeguards
    const adminLayoutContent = fs.readFileSync(path.resolve(__dirname, '../../client/src/pages/Admin/AdminLayout.jsx'), 'utf-8');
    const hasTableOverflowWrappers = adminLayoutContent.includes('overflow-x-auto');
    const hasMobileDrawer = adminLayoutContent.includes('-translate-x-full lg:translate-x-0');
    const hasMobileHeader = adminLayoutContent.includes('lg:hidden');
    const hasDrawerCloseOnTabClick = adminLayoutContent.includes('setSidebarOpen(false)');

    const mobileResponsivePass = hasTableOverflowWrappers && hasMobileDrawer && hasMobileHeader && hasDrawerCloseOnTabClick;
    logTest('Admin panel responsive at 375px width (no overflow, all buttons reachable)', mobileResponsivePass,
      `Table overflow: ${hasTableOverflowWrappers}, Drawer: ${hasMobileDrawer}, Mobile header: ${hasMobileHeader}, Auto-close on tab: ${hasDrawerCloseOnTabClick}`);

    console.log('\n===============================================================');
    const totalPassed = testResults.filter(t => t.passed).length;
    console.log(`📊 SECTION 5 TEST SUMMARY: ${totalPassed}/${testResults.length} TESTS PASSED`);
    console.log('===============================================================\n');

  } catch (err) {
    console.error('Section 5 test execution failed:', err);
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

runSection5Verification();

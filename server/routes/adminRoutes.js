import express from 'express';
import {
  getDashboardStats,
  getAllRoomsAdmin,
  createRoom,
  updateRoom,
  deleteRoom,
  getAllBookings,
  createManualBooking,
  updateBookingStatus,
  recordBookingPayment,
  cancelBooking,
  requestDateChange,
  clearDateChangeFlag,
  changeBookingDates,
  cancelAndRefundBooking,
  markBalanceReceived,
  getBookingAvailableDates,
  deleteBooking,
  exportBookingsCSV,
  getAllPackagesAdmin,
  createPackage,
  updatePackage,
  deletePackage,
  getAllExperiencesAdmin,
  createExperience,
  updateExperience,
  deleteExperience,
  getAllMenuAdmin,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getDiningContentAdmin,
  updateDiningContentAdmin,
  getAllGalleryAdmin,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  getAllReviewsAdmin,
  createReviewAdmin,
  approveReview,
  hideReview,
  deleteReview,
  getAllEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
  getAllPromos,
  createPromo,
  updatePromo,
  deletePromo,
  getBlockedDates,
  createBlockedDate,
  deleteBlockedDate,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  updateSettings,
  uploadImage,
  deleteImage,
  uploadHeroBannerMedia,
  deleteHeroBannerMedia,
  getActivityLogs,
  getAllInclusionsAdmin,
  createInclusionItem,
  updateInclusionItem,
  deleteInclusionItem,
  reorderInclusions,
  toggleInclusionActive,
  getAllPoliciesAdmin,
  createPolicySection,
  updatePolicySection,
  deletePolicySection,
  reorderPolicySections,
  togglePolicySectionVisibility,
  getAllSafetyContactsAdmin,
  createSafetyContact,
  updateSafetyContact,
  deleteSafetyContact,
  toggleSafetyContactVisibility
} from '../controllers/adminController.js';
import { getSettings } from '../controllers/publicController.js';
import { protect, authorize, checkStaffPermissions } from '../middleware/auth.js';
import { upload, handleHeroBannerUpload } from '../middleware/upload.js';
import { heroBannerUploadLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply auth protection to all admin routes
router.use(protect);

// 1. Dashboard Stats (Admin + Staff)
router.get('/dashboard', authorize('admin', 'staff'), getDashboardStats);

// 2. Bookings (Admin + Staff have write access)
router.get('/bookings', authorize('admin', 'staff'), getAllBookings);
router.post('/bookings', authorize('admin', 'staff'), createManualBooking);
router.get('/bookings/export-csv', authorize('admin', 'staff'), exportBookingsCSV);
router.get('/bookings/:id/available-dates', authorize('admin', 'staff'), getBookingAvailableDates);
router.put('/bookings/:id/status', authorize('admin', 'staff'), updateBookingStatus);
router.put('/bookings/:id/payment', authorize('admin', 'staff'), recordBookingPayment);
router.put('/bookings/:id/cancel', authorize('admin', 'staff'), cancelBooking);
router.put('/bookings/:id/request-date-change', authorize('admin', 'staff'), requestDateChange);
router.put('/bookings/:id/clear-date-change-flag', authorize('admin', 'staff'), clearDateChangeFlag);
router.put('/bookings/:id/change-dates', authorize('admin', 'staff'), changeBookingDates);
router.put('/bookings/:id/cancel-and-refund', authorize('admin', 'staff'), cancelAndRefundBooking);
router.put('/bookings/:id/mark-balance-received', authorize('admin', 'staff'), markBalanceReceived);
router.delete('/bookings/:id', authorize('admin', 'staff'), deleteBooking);

// 3. Enquiries (Admin + Staff have write access)
router.get('/enquiries', authorize('admin', 'staff'), getAllEnquiries);
router.put('/enquiries/:id', authorize('admin', 'staff'), updateEnquiryStatus);
router.delete('/enquiries/:id', authorize('admin', 'staff'), deleteEnquiry);

// 4. Reviews (Admin + Staff have write access)
router.get('/reviews', authorize('admin', 'staff'), getAllReviewsAdmin);
router.post('/reviews', authorize('admin', 'staff'), createReviewAdmin);
router.put('/reviews/:id/approve', authorize('admin', 'staff'), approveReview);
router.put('/reviews/:id/hide', authorize('admin', 'staff'), hideReview);
router.delete('/reviews/:id', authorize('admin', 'staff'), deleteReview);

// 5. Rooms (Staff read-only, Admin write)
router.get('/rooms', authorize('admin', 'staff'), getAllRoomsAdmin);
router.post('/rooms', authorize('admin'), createRoom);
router.put('/rooms/:id', authorize('admin'), updateRoom);
router.delete('/rooms/:id', authorize('admin'), deleteRoom);

// 6. Packages & Experiences (Staff read-only, Admin write)
router.get('/packages', authorize('admin', 'staff'), getAllPackagesAdmin);
router.post('/packages', authorize('admin'), createPackage);
router.put('/packages/:id', authorize('admin'), updatePackage);
router.delete('/packages/:id', authorize('admin'), deletePackage);

router.get('/experiences', authorize('admin', 'staff'), getAllExperiencesAdmin);
router.post('/experiences', authorize('admin'), createExperience);
router.put('/experiences/:id', authorize('admin'), updateExperience);
router.delete('/experiences/:id', authorize('admin'), deleteExperience);

// 7. Dining Content & Menu (Staff read-only, Admin write)
router.get('/dining/content', authorize('admin', 'staff'), getDiningContentAdmin);
router.put('/dining/content', authorize('admin'), updateDiningContentAdmin);
router.get('/menu', authorize('admin', 'staff'), getAllMenuAdmin);
router.post('/menu/categories', authorize('admin'), createMenuCategory);
router.put('/menu/categories/:id', authorize('admin'), updateMenuCategory);
router.delete('/menu/categories/:id', authorize('admin'), deleteMenuCategory);
router.post('/menu/items', authorize('admin'), createMenuItem);
router.put('/menu/items/:id', authorize('admin'), updateMenuItem);
router.delete('/menu/items/:id', authorize('admin'), deleteMenuItem);

// 8. Gallery Images (Staff read-only, Admin write)
router.get('/gallery', authorize('admin', 'staff'), getAllGalleryAdmin);
router.post('/gallery', authorize('admin'), createGalleryImage);
router.put('/gallery/:id', authorize('admin'), updateGalleryImage);
router.delete('/gallery/:id', authorize('admin'), deleteGalleryImage);

// 9. Promos & Blocked Dates (Staff read-only, Admin write)
router.get('/promos', authorize('admin', 'staff'), getAllPromos);
router.post('/promos', authorize('admin'), createPromo);
router.put('/promos/:id', authorize('admin'), updatePromo);
router.delete('/promos/:id', authorize('admin'), deletePromo);

router.get('/blocked-dates', authorize('admin', 'staff'), getBlockedDates);
router.post('/blocked-dates', authorize('admin', 'staff'), createBlockedDate);
router.delete('/blocked-dates/:id', authorize('admin', 'staff'), deleteBlockedDate);

// 10. Site Settings (Staff read-only, Admin write)
router.get('/settings', authorize('admin', 'staff'), getSettings);
router.put('/settings', authorize('admin'), updateSettings);
router.post('/settings/hero-upload', authorize('admin'), heroBannerUploadLimiter, handleHeroBannerUpload, uploadHeroBannerMedia);
router.delete('/settings/hero-upload/:filename', authorize('admin'), deleteHeroBannerMedia);

// 11. User Management (Admin only)
router.get('/users', authorize('admin'), getAllUsers);
router.post('/users', authorize('admin'), createUser);
router.put('/users/:id', authorize('admin'), updateUser);
router.delete('/users/:id', authorize('admin'), deleteUser);

// 12. File Upload & Delete (Admin + Staff)
router.post('/upload', authorize('admin', 'staff'), upload.single('image'), uploadImage);
router.delete('/upload/:filename', authorize('admin', 'staff'), deleteImage);

// 13. Activity / Audit Logs (Admin only)
router.get('/activity-logs', authorize('admin'), getActivityLogs);

// 14. Inclusions & Exclusions (Staff read-only, Admin write)
router.get('/inclusions', authorize('admin', 'staff'), getAllInclusionsAdmin);
router.post('/inclusions', authorize('admin'), createInclusionItem);
router.put('/inclusions/:id', authorize('admin'), updateInclusionItem);
router.delete('/inclusions/:id', authorize('admin'), deleteInclusionItem);
router.patch('/inclusions/reorder', authorize('admin'), reorderInclusions);
router.patch('/inclusions/:id/toggle', authorize('admin'), toggleInclusionActive);

// 15. Policies & Safety Management (Staff read-only, Admin write)
router.get('/policies', authorize('admin', 'staff'), getAllPoliciesAdmin);
router.post('/policies/sections', authorize('admin'), createPolicySection);
router.put('/policies/sections/:id', authorize('admin'), updatePolicySection);
router.delete('/policies/sections/:id', authorize('admin'), deletePolicySection);
router.patch('/policies/sections/reorder', authorize('admin'), reorderPolicySections);
router.patch('/policies/sections/:id/toggle', authorize('admin'), togglePolicySectionVisibility);

router.get('/safety-contacts', authorize('admin', 'staff'), getAllSafetyContactsAdmin);
router.post('/safety-contacts', authorize('admin'), createSafetyContact);
router.put('/safety-contacts/:id', authorize('admin'), updateSafetyContact);
router.delete('/safety-contacts/:id', authorize('admin'), deleteSafetyContact);
router.patch('/safety-contacts/:id/toggle', authorize('admin'), toggleSafetyContactVisibility);

export default router;


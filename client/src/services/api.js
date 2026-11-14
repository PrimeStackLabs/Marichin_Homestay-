const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '/api').trim().replace(/\/+$/, '');
const API_BASE = rawApiBase.endsWith('/api') ? rawApiBase : (rawApiBase ? `${rawApiBase}/api` : '/api');

// Helper function for fetch requests
async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Attach Bearer token if stored in browser (critical for cross-origin hosting e.g. Hostinger + Render)
  try {
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('marichin_token') || sessionStorage.getItem('marichin_token'))
      : null;
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {}

  // If body is FormData, let browser set multipart Content-Type
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const config = {
    cache: 'no-store',
    ...options,
    headers,
    credentials: 'include' // Transmit httpOnly cookie automatically
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.message || `Request failed with status ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      if (res.status === 429) {
        const retryHeader = res.headers.get('Retry-After');
        const retrySec = Number(retryHeader);
        if (!Number.isNaN(retrySec) && retrySec > 0) {
          err.retryAfterMs = retrySec * 1000;
        }
      }
      throw err;
    }

    return data;
  } catch (error) {
    // If network error (backend down)
    if (!error.status) {
      console.warn(`[API] Server unreachable at ${endpoint}. Using offline fallback.`);
    }
    throw error;
  }
}

export const api = {
  // 1. PUBLIC ENDPOINTS
  getRooms: () => request('/rooms'),
  getRoomBySlug: (slug) => request(`/rooms/${slug}`),
  checkAvailability: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/availability?${qs}`);
  },
  getAvailabilityCalendar: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/availability/calendar?${qs}`);
  },
  getCheckoutOptions: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/availability/checkout-options?${qs}`);
  },
  getBookingQuote: (quoteData) => request('/bookings/quote', { method: 'POST', body: JSON.stringify(quoteData) }),
  createBooking: (bookingData) => request('/bookings', { method: 'POST', body: JSON.stringify(bookingData) }),
  confirmPayment: (identifier, paymentData) =>
    request(`/bookings/${identifier}/confirm-payment`, { method: 'PUT', body: JSON.stringify(paymentData) }),
  lookupBooking: (code, phone) => {
    const qs = new URLSearchParams({ code, ...(phone && { phone }) }).toString();
    return request(`/bookings/lookup?${qs}`);
  },
  getBookingStatus: (code, phone) => {
    const qs = new URLSearchParams({ code, ...(phone && { phone }) }).toString();
    return request(`/payments/booking/status?${qs}`);
  },
  getBookingPass: (token) => request(`/pass/${encodeURIComponent(token)}`),
  getRazorpayConfig: () => request('/payments/razorpay/config'),
  createRazorpayOrder: (orderData) =>
    request('/payments/razorpay/create-order', { method: 'POST', body: JSON.stringify(orderData) }),
  verifyRazorpayPayment: (verifyData) =>
    request('/payments/razorpay/verify', { method: 'POST', body: JSON.stringify(verifyData) }),
  validatePromo: (promoData) => request('/promos/validate', { method: 'POST', body: JSON.stringify(promoData) }),
  getPackages: () => request('/packages'),
  getExperiences: () => request('/experiences'),
  getMenu: () => request('/menu'),
  getDiningContent: () => request('/dining/content'),
  getGallery: () => request('/gallery'),
  getReviews: () => request('/reviews'),
  createReview: (reviewData) => request('/reviews', { method: 'POST', body: JSON.stringify(reviewData) }),
  createEnquiry: (enquiryData) => request('/enquiries', { method: 'POST', body: JSON.stringify(enquiryData) }),
  subscribeNewsletter: (email) => request('/newsletter', { method: 'POST', body: JSON.stringify({ email }) }),
  getSettings: () => request('/settings'),
  getInclusions: () => request('/inclusions'),
  getPolicies: () => request('/policies'),
  getSafety: () => request('/safety'),

  // 2. AUTH ENDPOINTS
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  changePassword: (newPassword) => request('/auth/change-password', { method: 'PUT', body: JSON.stringify({ newPassword }) }),
  getMe: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // 3. ADMIN ENDPOINTS
  admin: {
    getDashboard: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/admin/dashboard${qs ? `?${qs}` : ''}`);
    },
    getBookings: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/admin/bookings${qs ? `?${qs}` : ''}`);
    },
    createManualBooking: (data) => request('/admin/bookings', { method: 'POST', body: JSON.stringify(data) }),
    updateBookingStatus: (id, status, adminNotes) =>
      request(`/admin/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, adminNotes }) }),
    recordPayment: (id, data) => request(`/admin/bookings/${id}/payment`, { method: 'PUT', body: JSON.stringify(data) }),
    cancelBooking: (id, reason) =>
      request(`/admin/bookings/${id}/cancel`, { method: 'PUT', body: JSON.stringify({ reason }) }),
    requestDateChange: (id, data) =>
      request(`/admin/bookings/${id}/request-date-change`, { method: 'PUT', body: JSON.stringify(data) }),
    clearDateChangeFlag: (id) =>
      request(`/admin/bookings/${id}/clear-date-change-flag`, { method: 'PUT' }),
    changeBookingDates: (id, data) =>
      request(`/admin/bookings/${id}/change-dates`, { method: 'PUT', body: JSON.stringify(data) }),
    cancelAndRefund: (id, data) =>
      request(`/admin/bookings/${id}/cancel-and-refund`, { method: 'PUT', body: JSON.stringify(data) }),
    markBalanceReceived: (id, data) =>
      request(`/admin/bookings/${id}/mark-balance-received`, { method: 'PUT', body: JSON.stringify(data) }),
    getBookingAvailableDates: (id, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/admin/bookings/${id}/available-dates${qs ? `?${qs}` : ''}`);
    },
    deleteBooking: (id) => request(`/admin/bookings/${id}`, { method: 'DELETE' }),
    getExportCsvUrl: () => `${API_BASE}/admin/bookings/export-csv`,

    getRooms: () => request('/admin/rooms'),
    createRoom: (data) => request('/admin/rooms', { method: 'POST', body: JSON.stringify(data) }),
    updateRoom: (id, data) => request(`/admin/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteRoom: (id) => request(`/admin/rooms/${id}`, { method: 'DELETE' }),

    getPackages: () => request('/admin/packages'),
    createPackage: (data) => request('/admin/packages', { method: 'POST', body: JSON.stringify(data) }),
    updatePackage: (id, data) => request(`/admin/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePackage: (id) => request(`/admin/packages/${id}`, { method: 'DELETE' }),

    getExperiences: () => request('/admin/experiences'),
    createExperience: (data) => request('/admin/experiences', { method: 'POST', body: JSON.stringify(data) }),
    updateExperience: (id, data) => request(`/admin/experiences/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteExperience: (id) => request(`/admin/experiences/${id}`, { method: 'DELETE' }),

    getMenu: () => request('/admin/menu'),
    getDiningContent: () => request('/admin/dining/content'),
    updateDiningContent: (data) => request('/admin/dining/content', { method: 'PUT', body: JSON.stringify(data) }),
    createMenuCategory: (data) => request('/admin/menu/categories', { method: 'POST', body: JSON.stringify(data) }),
    updateMenuCategory: (id, data) => request(`/admin/menu/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteMenuCategory: (id) => request(`/admin/menu/categories/${id}`, { method: 'DELETE' }),
    createMenuItem: (data) => request('/admin/menu/items', { method: 'POST', body: JSON.stringify(data) }),
    updateMenuItem: (id, data) => request(`/admin/menu/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteMenuItem: (id) => request(`/admin/menu/items/${id}`, { method: 'DELETE' }),

    getGallery: () => request('/admin/gallery'),
    createGalleryImage: (data) => request('/admin/gallery', { method: 'POST', body: JSON.stringify(data) }),
    updateGalleryImage: (id, data) => request(`/admin/gallery/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteGalleryImage: (id) => request(`/admin/gallery/${id}`, { method: 'DELETE' }),

    getReviews: () => request('/admin/reviews'),
    createReview: (data) => request('/admin/reviews', { method: 'POST', body: JSON.stringify(data) }),
    approveReview: (id) => request(`/admin/reviews/${id}/approve`, { method: 'PUT' }),
    hideReview: (id) => request(`/admin/reviews/${id}/hide`, { method: 'PUT' }),
    deleteReview: (id) => request(`/admin/reviews/${id}`, { method: 'DELETE' }),

    getEnquiries: () => request('/admin/enquiries'),
    updateEnquiryStatus: (id, status, adminNotes) =>
      request(`/admin/enquiries/${id}`, { method: 'PUT', body: JSON.stringify({ status, adminNotes }) }),
    deleteEnquiry: (id) => request(`/admin/enquiries/${id}`, { method: 'DELETE' }),

    getPromos: () => request('/admin/promos'),
    createPromo: (data) => request('/admin/promos', { method: 'POST', body: JSON.stringify(data) }),
    updatePromo: (id, data) => request(`/admin/promos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePromo: (id) => request(`/admin/promos/${id}`, { method: 'DELETE' }),

    getBlockedDates: () => request('/admin/blocked-dates'),
    createBlockedDate: (data) => request('/admin/blocked-dates', { method: 'POST', body: JSON.stringify(data) }),
    deleteBlockedDate: (id) => request(`/admin/blocked-dates/${id}`, { method: 'DELETE' }),

    getSettings: () => request('/admin/settings'),
    updateSettings: (data) => request('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
    uploadHeroBannerMedia: (formData, kind = 'video') =>
      request(`/admin/settings/hero-upload?kind=${encodeURIComponent(kind)}`, {
        method: 'POST',
        body: formData
      }),
    deleteHeroBannerMedia: (filename) =>
      request(`/admin/settings/hero-upload/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      }),

    getUsers: () => request('/admin/users'),
    createUser: (data) => request('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
    updateUser: (id, data) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),

    uploadImage: (formData) => request('/admin/upload', { method: 'POST', body: formData }),
    deleteImage: (filename) => request(`/admin/upload/${filename}`, { method: 'DELETE' }),

    getInclusions: () => request('/admin/inclusions'),
    createInclusion: (data) => request('/admin/inclusions', { method: 'POST', body: JSON.stringify(data) }),
    updateInclusion: (id, data) => request(`/admin/inclusions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteInclusion: (id) => request(`/admin/inclusions/${id}`, { method: 'DELETE' }),
    reorderInclusions: (orderedIds) => request('/admin/inclusions/reorder', { method: 'PATCH', body: JSON.stringify({ orderedIds }) }),
    toggleInclusion: (id) => request(`/admin/inclusions/${id}/toggle`, { method: 'PATCH' }),

    // Policies & Safety Management
    getPolicies: () => request('/admin/policies'),
    createPolicySection: (data) => request('/admin/policies/sections', { method: 'POST', body: JSON.stringify(data) }),
    updatePolicySection: (id, data) => request(`/admin/policies/sections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePolicySection: (id) => request(`/admin/policies/sections/${id}`, { method: 'DELETE' }),
    reorderPolicySections: (page, orderedIds) => request('/admin/policies/sections/reorder', { method: 'PATCH', body: JSON.stringify({ page, orderedIds }) }),
    togglePolicySection: (id) => request(`/admin/policies/sections/${id}/toggle`, { method: 'PATCH' }),
    getSafetyContacts: () => request('/admin/safety-contacts'),
    createSafetyContact: (data) => request('/admin/safety-contacts', { method: 'POST', body: JSON.stringify(data) }),
    updateSafetyContact: (id, data) => request(`/admin/safety-contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteSafetyContact: (id) => request(`/admin/safety-contacts/${id}`, { method: 'DELETE' }),
    toggleSafetyContact: (id) => request(`/admin/safety-contacts/${id}/toggle`, { method: 'PATCH' }),

    getActivityLogs: () => request('/admin/activity-logs')
  }
};


import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AdminProvider } from './context/AdminContext';
import { BookingProvider } from './context/BookingContext';

// Components
import { Navbar } from './components/Navbar/Navbar';
import { Footer } from './components/Footer/Footer';
import { Chatbot } from './components/Chatbot/Chatbot';
import { WhatsApp } from './components/WhatsApp/WhatsApp';
import { SocialFloatingMenu } from './components/Social/SocialFloatingMenu';

// Public Pages
import { Home } from './pages/Home/Home';
import { About } from './pages/About/About';
import { Rooms } from './pages/Rooms/Rooms';
import { Dining } from './pages/Dining/Dining';
import { DiningCategory } from './pages/Dining/DiningCategory';
import { Booking } from './pages/Booking/Booking';
import { BookingStatus } from './pages/Booking/BookingStatus';
import { Pass } from './pages/Booking/Pass';
import { Policies } from './pages/Policies/Policies';
import { RefundPolicy } from './pages/Policies/RefundPolicy';
import { PrivacyPolicy } from './pages/Policies/PrivacyPolicy';
import { Safety } from './pages/Safety/Safety';
import { Experiences } from './pages/Experiences/Experiences';
import { Packages } from './pages/Packages/Packages';
import { Services } from './pages/Services/Services';
import { Reviews } from './pages/Reviews/Reviews';
import { Gallery } from './pages/Gallery/Gallery';
import { Contact } from './pages/Contact/Contact';

// Admin Page
import { AdminLayout } from './pages/Admin/AdminLayout';

// Scroll to top helper on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

// Layout wrapper for Public Website
const PublicLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAF6EC] text-[#1A2A21] selection:bg-[#B8964A] selection:text-[#0F2A20] relative">
      <Navbar />
      <main className="flex-1 w-full relative">
        {children}
      </main>
      <Footer />
      {/* Floating AI Chatbot, Social Media & WhatsApp on all public pages */}
      <Chatbot />
      <SocialFloatingMenu />
      <WhatsApp />
    </div>
  );
};

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || '' };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application render error:', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    let isKn = false;
    try {
      isKn = localStorage.getItem('marichin_lang') === 'kn';
    } catch {}

    return (
      <div className="min-h-screen bg-[#F7F3EA] text-[#18251E] flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full bg-white border border-[#E5DEC9] rounded-2xl p-8 shadow-sm text-center space-y-5">
          <div className="w-12 h-12 rounded-full bg-[#F4EFE4] border border-[#C9A45C]/40 flex items-center justify-center mx-auto text-[#C9A45C] text-xl font-serif">
            !
          </div>
          <h1 className="text-2xl font-serif text-[#18251E]">
            {isKn ? 'ಪುಟವನ್ನು ಲೋಡ್ ಮಾಡುವಲ್ಲಿ ತಾತ್ಕಾಲಿಕ ದೋಷ' : 'Something went wrong'}
          </h1>
          <p className="text-sm text-[#5A655E] leading-relaxed">
            {isKn
              ? 'ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಬಟನ್ ಒತ್ತಿ ಪುಟವನ್ನು ಮರುಲೋಡ್ ಮಾಡಿ. ನಿಮ್ಮ ಬುಕಿಂಗ್ ವಿವರಗಳು ಸುರಕ್ಷಿತವಾಗಿವೆ.'
              : 'A temporary display error occurred. Please retry or reload the page to continue safely.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="px-5 py-2.5 rounded-xl border border-[#18251E] text-[#18251E] text-sm font-medium hover:bg-[#F7F3EA] transition-colors"
            >
              {isKn ? 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ' : 'Try Again'}
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-[#C9A45C] text-[#18251E] text-sm font-semibold hover:bg-[#b89249] transition-colors"
            >
              {isKn ? 'ಪುಟ ಮರುಲೋಡ್ ಮಾಡಿ' : 'Reload Page'}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export function App() {
  return (
    <AppErrorBoundary>
      <LanguageProvider>
        <AdminProvider>
          <BookingProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <Routes>
              {/* Public Website Routes */}
              <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
              <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
              <Route path="/rooms" element={<PublicLayout><Rooms /></PublicLayout>} />
              <Route path="/dining" element={<PublicLayout><Dining /></PublicLayout>} />
              <Route path="/dining/category/:categoryId" element={<PublicLayout><DiningCategory /></PublicLayout>} />
              <Route path="/dining/:categoryId" element={<PublicLayout><DiningCategory /></PublicLayout>} />
              <Route path="/booking" element={<PublicLayout><Booking /></PublicLayout>} />
              <Route path="/booking/status" element={<PublicLayout><BookingStatus /></PublicLayout>} />
              <Route path="/bookings/status" element={<PublicLayout><BookingStatus /></PublicLayout>} />
              <Route path="/pass/:token" element={<PublicLayout><Pass /></PublicLayout>} />
              <Route path="/policies" element={<PublicLayout><Policies /></PublicLayout>} />
              <Route path="/refund-policy" element={<PublicLayout><RefundPolicy /></PublicLayout>} />
              <Route path="/privacy" element={<PublicLayout><PrivacyPolicy /></PublicLayout>} />
              <Route path="/safety" element={<PublicLayout><Safety /></PublicLayout>} />
              <Route path="/terms" element={<Navigate to="/policies" replace />} />
              <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
              <Route path="/cancellation-policy" element={<Navigate to="/refund-policy" replace />} />
              <Route path="/experiences" element={<PublicLayout><Experiences /></PublicLayout>} />
              <Route path="/packages" element={<PublicLayout><Packages /></PublicLayout>} />
              <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
              <Route path="/reviews" element={<PublicLayout><Reviews /></PublicLayout>} />
              <Route path="/gallery" element={<PublicLayout><Gallery /></PublicLayout>} />
              <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />

              {/* Separate Admin Dashboard Routes */}
              <Route path="/admin" element={<AdminLayout />} />
              <Route path="/admin/:tab" element={<AdminLayout />} />
            </Routes>
          </BrowserRouter>
          </BookingProvider>
        </AdminProvider>
      </LanguageProvider>
    </AppErrorBoundary>
  );
}

export default App;

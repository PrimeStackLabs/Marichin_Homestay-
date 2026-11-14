# Marichin Homestay - Frontend Application

A premier nature luxury homestay booking web application inspired by Copperhill, tailored with modern nature luxury design, interactive booking workflows, and an administrative management dashboard.

## Tech Stack
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + Custom luxury theme
- **Icons**: Lucide React
- **Celebration Effects**: Canvas Confetti
- **State Management**: React Context API (`LanguageContext`, `BookingContext`, `AdminContext`) with `localStorage` persistence
- **Routing**: React Router DOM (v6)

## Features Implemented
1. **Strict Horizontal Top Navigation**:
   - Exact one-word labels in required order: `Home` | `About` | `Rooms` | `Dining` | `Experiences` | `Packages` | `Gallery` | `Contact` | `EN/ಕನ್ನಡ` | `Book Now`
   - Transparent over hero, dark translucent with blur on scroll, gold underline active indicator.
   - Mobile-responsive hamburger menu.
2. **Design System & Aesthetics**:
   - Forest Green (`#101C17`, `#18251E`), Champagne Gold (`#C9A45C`), Ivory (`#F4F0E6`), Charcoal (`#292D29`).
   - Cormorant Garamond / Playfair Display luxury serif headings and Plus Jakarta Sans clean body text.
   - Glassmorphism cards with subtle gold borders.
3. **14 Feature Groups / Pages**:
   - **01. Home**: HD autoplaying hero image slider with smooth touch swipe, glassmorphism floating booking bar, direct booking promo banner (`MISTDIRECT` for 15% off), featured rooms, packages, dining, and reviews.
   - **02. About**: Heritage story, peaceful coffee plantation, Kodava hospitality, authentic estate living.
   - **03. Rooms**: Standalone wooden cottages, heritage villa, luxury canopy glamping tents, and ridge lofts with full specs, capacity, amenities, and photo modal.
   - **04. Dining**: Authentic Kodava cuisine (Pandi Curry, Kadambuttu, Akki Roti, Kaad Mange, Baimbale), meal timings, pricing, and auxiliary self-cooking kitchen availability.
   - **05. Booking**: Interactive availability calendar (Available/Booked/Blocked), 20% or 50% advance payment selector, promo validation, mock UPI QR & Card payment gateway, and printable booking receipt with unique reference ID.
   - **06. Policies**: Check-in (1:00 PM) / check-out (11:00 AM), pet guidelines, quiet hours (10:00 PM), alcohol & smoking rules, cancellation terms.
   - **07. Safety**: 24/7 CCTV, gated security, nearby hospitals, 24/7 doctor on call, emergency contacts, 4x4 mechanic assistance.
   - **08. Experiences**: Estate Walk, Evening Campfire, Indoor & Outdoor Games, and Homely Food.
   - **09. Packages**: Honeymoon & couple getaways, 7-day nature workation, family reunions, and weekend coffee trails.
   - **10. Services**: Station & airport transfers, driver accommodation & food, downloadable digital guest guidebook.
   - **11. Reviews**: Verified guest reviews, ratings, and digital guestbook with submission form.
   - **12. Gallery**: Filterable high-res photo gallery with modal lightbox and interactive 360° virtual tour mode.
   - **13. Contact**: Interactive message form, Google Maps embed, driving directions from Bengaluru & Mysuru, and Instagram feed.
   - **14. Support & Floating Widgets**:
     - Global English & Kannada (`ಕನ್ನಡ`) toggle updating all labels and content instantly without page reload.
     - Floating AI Chatbot Concierge in bottom-right with pre-configured FAQs and intelligent automated responses.
     - Floating WhatsApp Direct Chat button with pre-filled enquiry message.
4. **Complete Admin Dashboard (`/admin`)**:
   - Sidebar with 10 modules: Dashboard, Bookings, Calendar, Rooms, Dining, Offers, Reviews, Enquiries, Reports, Settings.
   - Live availability calendar to click and block/unblock dates.
   - Room price editor, booking status manager (Confirmed/Pending/Cancelled), promo code creator, review moderator.
   - Changes sync live with the guest website via LocalStorage!

## Running the Project Locally
```bash
cd client
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
To access the Admin Portal, click the shield icon in the navbar, the footer link, or navigate directly to [http://localhost:3000/admin](http://localhost:3000/admin).


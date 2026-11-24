import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Room } from '../models/Room.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { Package } from '../models/Package.js';
import { Experience } from '../models/Experience.js';
import { MenuCategory, MenuItem } from '../models/MenuItem.js';
import { DiningContent } from '../models/DiningContent.js';
import { GalleryImage } from '../models/GalleryImage.js';
import { Review } from '../models/Review.js';
import { SAMPLE_REVIEWS } from './sampleReviews.js';
import { Promo } from '../models/Promo.js';
import { InclusionItem } from '../models/InclusionItem.js';
import { PolicySection } from '../models/PolicySection.js';
import { DEFAULT_POLICY_SECTIONS } from './policyDefaults.js';
import {
  DEFAULT_CANCELLATION_TIERS,
  DEFAULT_SAFETY_FEATURES,
  DEFAULT_DATE_CHANGE_RULE,
  DEFAULT_EARLY_DEPARTURE_RULE,
  DEFAULT_GATEWAY_FEE_NOTE
} from '../utils/refundPolicy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const seedDatabase = async () => {
  console.log('🌱 Starting Marichin Homestay database seed...');
  await connectDB();

  // 1. SEED ADMIN USER
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@marichinhomestay.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Marichin@2026';

  let adminUser = await User.findOne({ email: adminEmail });
  if (!adminUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);
    adminUser = await User.create({
      name: 'Marichin Homestay Administrator',
      email: adminEmail,
      phone: process.env.WHATSAPP_NUMBER || '+91 95912 09522',
      passwordHash,
      role: 'admin',
      mustChangePassword: false,
      isActive: true
    });
    console.log(`✅ Admin user created: ${adminEmail}`);
  } else {
    console.log(`ℹ️ Admin user already exists: ${adminEmail}`);
  }

  // Also create a demo staff user if not exists
  const staffEmail = 'staff@marichinhomestay.com';
  let staffUser = await User.findOne({ email: staffEmail });
  if (!staffUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Staff@2026', salt);
    await User.create({
      name: 'Kushalnagar Estate Concierge',
      email: staffEmail,
      phone: '+91 95912 09522',
      passwordHash,
      role: 'staff',
      mustChangePassword: false,
      isActive: true
    });
    console.log(`✅ Demo Staff user created: ${staffEmail}`);
  }

  // 2. SEED SITE SETTINGS (Single-Property Marichin Homestay)
  const settingsData = {
    propertyName: 'Marichin Homestay',
    tagline: 'Escape to Nature. Experience Warm Hospitality.',
    subTagline: 'A tranquil nature retreat nestled amidst lush coffee plantations in Chikkabettageri Village, Kushalnagar, Kodagu District.',
    address: 'Chikkabettageri Village, Gudde Hosur Post, Kushalnagar, Kodagu District, Karnataka 571234',
    registrationNumber: '',
    phones: ['+91 95912 09522'],
    email: 'coorgmarichinhomestay@gmail.com',
    whatsappNumber: '+91 95912 09522',
    instagramUrl: 'https://www.instagram.com/coorg_marichin_homestay?utm_source=qr&cplk=bWd6MjhrcHducjVt',
    facebookUrl: 'https://www.facebook.com/profile.php?id=61596613283636',
    youtubeUrl: 'https://www.youtube.com/channel/UCaf39e4l1iRDA-CMj72q1gQ',
    googleMapsEmbedUrl: 'https://maps.google.com/maps?q=12.425583,75.911889&t=m&z=16&output=embed',
    googleMapsShareUrl: 'https://www.google.com/maps/dir/?api=1&destination=12.425583,75.911889',
    upiId: 'marichin@okaxis',
    checkInTime: '12:00 PM',
    checkOutTime: '11:00 AM',
    autoConfirmAfterPayment: true,
    taxPercent: 0,
    pricePerNight: 8000,
    extraGuestCharge: 0,
    mealsIncluded: 'Morning breakfast',
    inclusionsNote: 'Includes morning breakfast, Wi-Fi, parking, campfire, indoor and outdoor games and estate walk',
    advanceOptions: [20, 50, 100],
    cancellationTiers: DEFAULT_CANCELLATION_TIERS,
    noShowRefundPercent: 0,
    refundTimelineText: '5 to 7 working days',
    hostCancelsRefundPercent: 100,
    dateChangeRule: DEFAULT_DATE_CHANGE_RULE,
    earlyDepartureRule: DEFAULT_EARLY_DEPARTURE_RULE,
    gatewayFeeNote: DEFAULT_GATEWAY_FEE_NOTE,
    safetyFeatures: DEFAULT_SAFETY_FEATURES,
    policiesLastUpdated: new Date(),
    roomsPageHeading: 'Our Rooms',
    roomsPageDescription: 'Three room types, each with morning breakfast included. Choose the room that fits your group.',
    aboutStoryText: 'Welcome to Marichin Homestay, situated amidst lush coffee plantations in Chikkabettageri Village near Kushalnagar, Kodagu. Enjoy peaceful nature, morning estate walks, and cozy evening campfires.',
    drivingDistances: [],
    sampleDefaultsVerified: {
      taxPercent: 'Sample value, please verify',
      extraGuestCharge: 'Sample value, please verify',
      cancellationTiers: 'Sample value, please verify',
      noShowRefundPercent: 'Sample value, please verify',
      refundTimelineText: 'Sample value, please verify',
      hostCancelsRefundPercent: 'Sample value, please verify',
      dateChangeRule: 'Sample value, please verify',
      earlyDepartureRule: 'Sample value, please verify',
      gatewayFeeNote: 'Sample value, please verify'
    },
    facilities: [
      'Morning breakfast',
      'Wi-Fi',
      'Parking Facility',
      'Campfire',
      'Indoor & Outdoor Games',
      'Estate Walk'
    ],
    heroImage: '/images/realimage/homeimage.jpeg',
    logoUrl: '/images/logo.jpeg',
    seoTitle: 'Marichin Homestay | Coffee Plantation Stay near Kushalnagar, Coorg',
    seoDescription: 'Stay amidst coffee plantations at Marichin Homestay near Kushalnagar, Coorg. Morning breakfast, campfires, estate walks & nature retreat.'
  };

  await SiteSettings.findOneAndUpdate({}, settingsData, { upsert: true, new: true });
  console.log('✅ Site settings seeded');

  for (const sec of DEFAULT_POLICY_SECTIONS) {
    await PolicySection.findOneAndUpdate(
      { page: sec.page, key: sec.key },
      { $setOnInsert: sec },
      { upsert: true, new: true }
    );
  }
  console.log(`✅ Policy sections checked/seeded (${DEFAULT_POLICY_SECTIONS.length} default sections)`);

  // 3. SEED ROOMS: Standard Room (2 units), Suite Room (2 units), Single Room (1 unit)
  await Room.deleteMany({
    slug: {
      $nin: ['standard-room', 'suite-room', 'single-room']
    }
  });

  const roomsData = [
    {
      slug: 'standard-room',
      name: 'Standard Room',
      category: 'Standard Room',
      tag: 'Balcony facing',
      isRealPhoto: true,
      hasBalcony: true,
      mealsIncluded: 'Morning breakfast',
      bedLayout: '',
      sizeSqft: null,
      pricePerNight: 8000,
      weekendPrice: 8000,
      maxAdults: 2,
      maxChildren: 1,
      maxGuests: 3,
      totalUnits: 2,
      view: '',
      description: 'Balcony-facing room for 2 adults and 1 child. Morning breakfast included.',
      images: [
        { url: '/images/realimage/real3.jpeg', alt: 'Standard Room wooden double bed' },
        { url: '/images/realimage/real5.jpeg', alt: 'Standard Room beds with white linen' }
      ],
      amenities: [
        'Morning breakfast',
        'Wi-Fi',
        'Parking Facility',
        'Campfire',
        'Indoor & Outdoor Games',
        'Estate Walk'
      ],
      isActive: true,
      displayOrder: 1
    },
    {
      slug: 'suite-room',
      name: 'Suite Room',
      category: 'Suite Room',
      tag: 'Balcony facing',
      isRealPhoto: true,
      hasBalcony: true,
      mealsIncluded: 'Morning breakfast',
      bedLayout: '',
      sizeSqft: null,
      pricePerNight: 10000,
      weekendPrice: 10000,
      maxAdults: 2,
      maxChildren: 2,
      maxGuests: 4,
      totalUnits: 2,
      view: '',
      description: 'Balcony-facing room for 2 adults and 2 children. Morning breakfast included.',
      images: [
        { url: '/images/realimage/real4.jpeg', alt: 'Suite Room interior with balcony entrance' },
        { url: '/images/realimage/real6.jpeg', alt: 'Suite Room ensuite bathroom and view' }
      ],
      amenities: [
        'Morning breakfast',
        'Wi-Fi',
        'Parking Facility',
        'Campfire',
        'Indoor & Outdoor Games',
        'Estate Walk'
      ],
      isActive: true,
      displayOrder: 2
    },
    {
      slug: 'single-room',
      name: 'Single Room',
      category: 'Single Room',
      tag: 'No balcony',
      isRealPhoto: false,
      hasBalcony: false,
      mealsIncluded: 'Morning breakfast',
      bedLayout: '',
      sizeSqft: null,
      pricePerNight: 6000,
      weekendPrice: 6000,
      maxAdults: 2,
      maxChildren: 0,
      maxGuests: 2,
      totalUnits: 1,
      view: '',
      description: 'Room for 2 adults, without balcony. Morning breakfast included.',
      images: [], // No real photo exists; neutral placeholder rendered in UI
      amenities: [
        'Morning breakfast',
        'Wi-Fi',
        'Parking Facility',
        'Campfire',
        'Indoor & Outdoor Games',
        'Estate Walk'
      ],
      isActive: true,
      displayOrder: 3
    }
  ];

  for (const r of roomsData) {
    await Room.findOneAndUpdate({ slug: r.slug }, r, { upsert: true, new: true });
  }
  console.log(`✅ Seeded ${roomsData.length} rooms (Standard Room x2, Suite Room x2, Single Room x1)`);

  // 4. SEED GALLERY IMAGES (All 14 Real photos from estate only)
  // Delete any stock gallery images
  await GalleryImage.deleteMany({
    url: { $not: { $regex: /^\/images\/realimage\// } }
  });

  const galleryData = [
    { url: '/images/realimage/homeimage.jpeg', title: 'Marichin Homestay Estate Architecture', alt: 'Marichin Homestay two-storey architecture with tiled roof, balcony and paved courtyard surrounded by coffee trees', category: 'estate', displayOrder: 1, isVisible: true },
    { url: '/images/realimage/real2.jpeg', title: 'First-Floor Balcony Verandah', alt: 'Spacious first-floor covered verandah with outdoor seating overlooking coffee trees', category: 'estate', displayOrder: 2, isVisible: true },
    { url: '/images/realimage/real3.jpeg', title: 'Standard Bedroom Handcrafted Wooden Beds', alt: 'Standard Room wooden double bed and floral runner with warm ambient lighting', category: 'rooms', displayOrder: 3, isVisible: true },
    { url: '/images/realimage/real4.jpeg', title: 'Suite Bedroom with Balcony Entrance', alt: 'High-ceiling Suite Room double bed with doorway opening to verandah view', category: 'rooms', displayOrder: 4, isVisible: true },
    { url: '/images/realimage/real5.jpeg', title: 'Standard Bedroom Double & Single Beds', alt: 'Standard Room double bed and single bed dressed in fresh white linens with green runner', category: 'rooms', displayOrder: 5, isVisible: true },
    { url: '/images/realimage/real6.jpeg', title: 'Suite Room Interior & Ensuite Bathroom View', alt: 'Suite Room interior showing attached private bathroom and balcony doorway', category: 'rooms', displayOrder: 6, isVisible: true },
    { url: '/images/realimage/real7.jpeg', title: 'Private Balcony with Tree-Stump Table', alt: 'Private room balcony with rustic tree-stump seating overlooking lush green coffee plants', category: 'rooms', displayOrder: 7, isVisible: true },
    { url: '/images/realimage/real8.jpeg', title: 'Homely Dining Hall & Seating', alt: 'Homely dining hall with polished granite tables, wooden chairs and buffet spread', category: 'dining', displayOrder: 8, isVisible: true },
    { url: '/images/realimage/real9.jpeg', title: 'Stainless Steel Buffet Service Counter', alt: 'Buffet service counter with stainless steel chafing dishes and beverage dispensers', category: 'dining', displayOrder: 9, isVisible: true },
    { url: '/images/realimage/real10.jpeg', title: 'Front Reception & Welcoming Desk', alt: 'Front reception desk with welcome counter and traditional decor', category: 'estate', displayOrder: 10, isVisible: true },
    { url: '/images/realimage/real11.mp4', title: 'Panoramic Estate Canopy Aerial Video', alt: 'Scenic video overlooking the estate gate, courtyard, and tall canopy trees', category: 'estate', displayOrder: 11, isVisible: true },
    { url: '/images/realimage/real12.jpeg', title: 'Guests on Plantation Nature Path', alt: 'Guests walking along the shaded coffee plantation trail during a nature stroll', category: 'guests', displayOrder: 12, isVisible: true },
    { url: '/images/realimage/real13.jpeg', title: 'Guided Coffee Estate Walk', alt: 'Guided walk with guests along the mud pathway through dense coffee plants', category: 'estate', displayOrder: 13, isVisible: true },
    { url: '/images/realimage/real14.jpeg', title: 'Evening Campfire & Board Games in Gazebo', alt: 'Guests enjoying evening board games next to a warm outdoor campfire brazier under the gazebo', category: 'guests', displayOrder: 14, isVisible: true }
  ];

  for (const g of galleryData) {
    await GalleryImage.findOneAndUpdate({ url: g.url }, g, { upsert: true });
  }
  console.log(`✅ Seeded ${galleryData.length} authentic gallery images`);

  // 5. SEED PACKAGES: 4 Real Packages
  await Package.deleteMany({
    slug: { $nin: ['room-breakfast', 'room-breakfast-dinner', 'entire-homestay-5-rooms', 'family-stay'] }
  });

  const packagesData = [
    {
      slug: 'room-breakfast',
      title: 'Room + Breakfast',
      name: 'Room + Breakfast',
      description: 'Choose any room. Morning breakfast included.',
      inclusions: [
        'Choose any room (Standard, Suite, or Single)',
        'Morning breakfast included',
        'High-Speed Wi-Fi & Parking Facility',
        'Evening Campfire Gathering',
        'Indoor & Outdoor Games',
        'Guided Coffee Estate Walk'
      ],
      features: [
        'Choose any room (Standard, Suite, or Single)',
        'Morning breakfast included',
        'High-Speed Wi-Fi & Parking Facility',
        'Evening Campfire Gathering',
        'Indoor & Outdoor Games',
        'Guided Coffee Estate Walk'
      ],
      durationLabel: 'Per Night',
      duration: 'Per Night',
      price: 6000,
      regularPrice: 6000,
      offerPrice: 6000,
      idealFor: 'Couples & Families',
      image: '/images/realimage/real3.jpeg',
      tag: 'Flexible Room Choice',
      displayOrder: 1,
      isActive: true,
      isSample: false
    },
    {
      slug: 'room-breakfast-dinner',
      title: 'Room + Breakfast + Dinner',
      name: 'Room + Breakfast + Dinner',
      description: 'Dinner choice: veg or non-veg from the menu.',
      inclusions: [
        'Choose any room (Standard, Suite, or Single)',
        'Morning breakfast included',
        'Dinner choice: veg or non-veg from the menu',
        'High-Speed Wi-Fi & Parking Facility',
        'Evening Campfire Gathering',
        'Indoor & Outdoor Games',
        'Guided Coffee Estate Walk'
      ],
      features: [
        'Choose any room (Standard, Suite, or Single)',
        'Morning breakfast included',
        'Dinner choice: veg or non-veg from the menu',
        'High-Speed Wi-Fi & Parking Facility',
        'Evening Campfire Gathering',
        'Indoor & Outdoor Games',
        'Guided Coffee Estate Walk'
      ],
      durationLabel: 'Per Night',
      duration: 'Per Night',
      price: 8000,
      regularPrice: 8000,
      offerPrice: 8000,
      idealFor: 'Couples & Families',
      image: '/images/realimage/real8.jpeg',
      tag: 'Breakfast & Dinner',
      displayOrder: 2,
      isActive: true,
      isSample: false
    },
    {
      slug: 'entire-homestay-5-rooms',
      title: 'Entire Homestay (all 5 rooms)',
      name: 'Entire Homestay (all 5 rooms)',
      description: 'Exclusive reservation of all 5 rooms (2 Standard Rooms, 2 Suite Rooms, 1 Single Room).',
      inclusions: [
        'Exclusive reservation of all 5 homestay rooms',
        'Total capacity: up to 10 adults + 6 children',
        'Morning breakfast included for all guests',
        'High-Speed Wi-Fi & Parking Facility',
        'Evening Campfire Gathering',
        'Indoor & Outdoor Games',
        'Guided Coffee Estate Walk'
      ],
      features: [
        'Exclusive reservation of all 5 homestay rooms',
        'Total capacity: up to 10 adults + 6 children',
        'Morning breakfast included for all guests',
        'High-Speed Wi-Fi & Parking Facility',
        'Evening Campfire Gathering',
        'Indoor & Outdoor Games',
        'Guided Coffee Estate Walk'
      ],
      durationLabel: 'Per Night',
      duration: 'Per Night',
      price: 42000,
      regularPrice: 42000,
      offerPrice: 42000,
      discount: null,
      idealFor: 'Groups up to 10 Adults + 6 Children',
      image: '/images/realimage/homeimage.jpeg',
      tag: 'Exclusive All 5 Rooms',
      displayOrder: 3,
      isActive: true,
      isSample: false
    },
    {
      slug: 'family-stay',
      title: 'Family Stay',
      name: 'Family Stay',
      description: '1 Standard or Suite room with breakfast.',
      inclusions: [
        '1 Standard or Suite room',
        'Morning breakfast included',
        'High-Speed Wi-Fi & Parking Facility',
        'Evening Campfire Gathering',
        'Indoor & Outdoor Games',
        'Guided Coffee Estate Walk'
      ],
      features: [
        '1 Standard or Suite room',
        'Morning breakfast included',
        'High-Speed Wi-Fi & Parking Facility',
        'Evening Campfire Gathering',
        'Indoor & Outdoor Games',
        'Guided Coffee Estate Walk'
      ],
      durationLabel: 'Per Night',
      duration: 'Per Night',
      price: 8000,
      regularPrice: 8000,
      offerPrice: 8000,
      idealFor: 'Families',
      image: '/images/realimage/real4.jpeg',
      tag: 'Family Special',
      displayOrder: 4,
      isActive: true,
      isSample: false
    }
  ];

  for (const pkg of packagesData) {
    await Package.findOneAndUpdate({ slug: pkg.slug }, pkg, { upsert: true, new: true });
  }
  console.log(`✅ Seeded ${packagesData.length} curated stay packages`);

  // 6. SEED EXPERIENCES: Exactly 4 Real items
  await Experience.deleteMany({
    slug: { $nin: ['estate-walk', 'campfire', 'indoor-outdoor-games', 'homely-food'] }
  });

  const realExperiences = [
    {
      slug: 'estate-walk',
      title: 'Estate Walk',
      description: 'Walk through the coffee estate surrounding the homestay.',
      category: '',
      season: '',
      durationLabel: '',
      distanceLabel: '',
      image: '/images/realimage/real13.jpeg',
      displayOrder: 1,
      isActive: true
    },
    {
      slug: 'campfire',
      title: 'Campfire',
      description: 'Evening campfire at the homestay.',
      category: '',
      season: '',
      durationLabel: '',
      distanceLabel: '',
      image: '/images/realimage/homeimage.jpeg',
      displayOrder: 2,
      isActive: true
    },
    {
      slug: 'indoor-outdoor-games',
      title: 'Indoor & Outdoor Games',
      description: 'Indoor and outdoor games for guests of all ages.',
      category: '',
      season: '',
      durationLabel: '',
      distanceLabel: '',
      image: '/images/realimage/real14.jpeg',
      displayOrder: 3,
      isActive: true
    },
    {
      slug: 'homely-food',
      title: 'Homely Food',
      description: 'Home-cooked meals prepared at the homestay.',
      category: '',
      season: '',
      durationLabel: '',
      distanceLabel: '',
      image: '/images/realimage/real8.jpeg',
      displayOrder: 4,
      isActive: true
    }
  ];

  for (const exp of realExperiences) {
    await Experience.findOneAndUpdate({ slug: exp.slug }, exp, { upsert: true, new: true });
  }
  console.log(`✅ Seeded ${realExperiences.length} real experiences`);

  // 7. SEED DINING CONTENT & MENU
  const defaultDiningContent = {
    hero: {
      badge: {
        en: 'HOMELY DINING',
        kn: 'ಮನೆಯೂಟ'
      },
      title: {
        en: 'Homely Food at Marichin Homestay',
        kn: 'ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇನಲ್ಲಿ ಮನೆಯೂಟ'
      },
      description: {
        en: 'Homely food at Marichin Homestay.',
        kn: 'ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇನಲ್ಲಿ ಮನೆಯೂಟ.'
      },
      tags: [
        { en: 'Breakfast', kn: 'ಉಪಹಾರ' },
        { en: 'Dinner Veg and Non-Veg', kn: 'ರಾತ್ರಿಯ ಊಟ (ಸಸ್ಯಾಹಾರಿ ಮತ್ತು ಮಾಂಸಾಹಾರಿ)' },
        { en: 'Evening Tea and Coffee', kn: 'ಸಂಜೆಯ ಚಹಾ ಮತ್ತು ಕಾಫಿ' }
      ]
    },
    timings: {
      heading: {
        en: 'Meal Timings',
        kn: 'ಊಟದ ಸಮಯ'
      },
      subtitle: {
        en: '',
        kn: ''
      },
      description: {
        en: '',
        kn: ''
      },
      items: []
    },
    auxiliaryKitchen: {
      enabled: false,
      badge: {
        en: 'Auxiliary Kitchen',
        kn: 'ಸಹಾಯಕ ಅಡುಗೆಮನೆ'
      },
      heading: {
        en: 'Guest Kitchen Access',
        kn: 'ಅತಿಥಿ ಅಡುಗೆಮನೆ'
      },
      text: {
        en: '',
        kn: ''
      },
      buttonLabel: {
        en: 'Guest Access',
        kn: 'ಅತಿಥಿ ಪ್ರವೇಶ'
      }
    },
    menuSection: {
      badge: {
        en: 'MENU',
        kn: 'ಮೆನು'
      },
      heading: {
        en: 'Homely Dining Menu',
        kn: 'ಮನೆ ಊಟದ ಪಟ್ಟಿ'
      },
      description: {
        en: 'Home-cooked meals at the homestay.',
        kn: 'ಹೋಂಸ್ಟೇನಲ್ಲಿ ಮನೆಯೂಟ.'
      }
    }
  };

  await DiningContent.findOneAndUpdate({}, defaultDiningContent, { upsert: true, new: true });
  console.log('✅ Seeded DiningContent');

  // Clear all old categories and dishes completely
  await MenuCategory.deleteMany({});
  await MenuItem.deleteMany({});

  const menuCategories = [
    {
      slug: 'morning-breakfast',
      name: 'Morning Breakfast',
      nameKn: 'ಬೆಳಗಿನ ಉಪಹಾರ',
      subtitle: '',
      subtitleKn: '',
      description: '',
      icon: 'leaf',
      displayOrder: 1,
      isActive: true
    },
    {
      slug: 'dinner-veg',
      name: 'Dinner, Veg',
      nameKn: 'ರಾತ್ರಿಯ ಊಟ, ಸಸ್ಯಾಹಾರಿ',
      subtitle: '',
      subtitleKn: '',
      description: '',
      icon: 'leaf',
      displayOrder: 2,
      isActive: true
    },
    {
      slug: 'dinner-non-veg',
      name: 'Dinner, Non-Veg',
      nameKn: 'ರಾತ್ರಿಯ ಊಟ, ಮಾಂಸಾಹಾರಿ',
      subtitle: '',
      subtitleKn: '',
      description: '',
      icon: 'CookingPot',
      displayOrder: 3,
      isActive: true
    },
    {
      slug: 'evening',
      name: 'Evening',
      nameKn: 'ಸಂಜೆ',
      subtitle: '',
      subtitleKn: '',
      description: '',
      icon: 'Clock',
      displayOrder: 4,
      isActive: true
    }
  ];

  for (const cat of menuCategories) {
    await MenuCategory.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true });
  }

  const menuItems = [
    // Morning Breakfast
    {
      category: 'morning-breakfast',
      name: 'Paputtu with egg curry',
      nameKn: 'ಪಾಪುಟ್ಟು ಮತ್ತು ಮೊಟ್ಟೆ ಸಾರು',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: false,
      badge: '',
      badgeKn: '',
      image: '/images/food/paputtu_egg_curry.webp',
      isIllustrative: true,
      displayOrder: 1,
      isActive: true
    },
    {
      category: 'morning-breakfast',
      name: 'Chapati with kadala curry (chickpea curry)',
      nameKn: 'ಚಪಾತಿ ಮತ್ತು ಕಡಲೆ ಸಾರು',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/chapati_kadala_curry.webp',
      isIllustrative: true,
      displayOrder: 2,
      isActive: true
    },
    {
      category: 'morning-breakfast',
      name: 'Kadambuttu with rajma curry',
      nameKn: 'ಕದಂಬುಟ್ಟು ಮತ್ತು ರಾಜ್ಮಾ ಸಾರು',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/kadambuttu_rajma_curry.webp',
      isIllustrative: true,
      displayOrder: 3,
      isActive: true
    },
    {
      category: 'morning-breakfast',
      name: 'Lemon rice',
      nameKn: 'ಲೆಮನ್ ರೈಸ್',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/lemon_rice.webp',
      isIllustrative: true,
      displayOrder: 4,
      isActive: true
    },
    {
      category: 'morning-breakfast',
      name: 'Puliyogare',
      nameKn: 'ಪುಳಿಯೋಗರೆ',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/puliyogare.webp',
      isIllustrative: true,
      displayOrder: 5,
      isActive: true
    },
    {
      category: 'morning-breakfast',
      name: 'Coffee',
      nameKn: 'ಕಾಫಿ',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/coffee.webp',
      isIllustrative: true,
      displayOrder: 6,
      isActive: true
    },
    {
      category: 'morning-breakfast',
      name: 'Tea',
      nameKn: 'ಚಹಾ',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/tea.webp',
      isIllustrative: true,
      displayOrder: 7,
      isActive: true
    },

    // Dinner, Veg
    {
      category: 'dinner-veg',
      name: 'Chapati',
      nameKn: 'ಚಪಾತಿ',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/chapati.webp',
      isIllustrative: true,
      displayOrder: 1,
      isActive: true
    },
    {
      category: 'dinner-veg',
      name: 'White rice with vegetable curry, rasam, veg palya, curd and pickle',
      nameKn: 'ಅನ್ನ, ತರಕಾರಿ ಸಾರು, ರಸಂ, ಪಲ್ಯ, ಮೊಸರು ಮತ್ತು ಉಪ್ಪಿನಕಾಯಿ',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/veg_dinner_thali.webp',
      isIllustrative: true,
      displayOrder: 2,
      isActive: true
    },

    // Dinner, Non-Veg
    {
      category: 'dinner-non-veg',
      name: 'Chapati',
      nameKn: 'ಚಪಾತಿ',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/chapati.webp',
      isIllustrative: true,
      displayOrder: 1,
      isActive: true
    },
    {
      category: 'dinner-non-veg',
      name: 'White rice with chicken fry or chicken curry',
      nameKn: 'ಅನ್ನ ಮತ್ತು ಚಿಕನ್ ಫ್ರೈ ಅಥವಾ ಚಿಕನ್ ಸಾರು',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: false,
      badge: '',
      badgeKn: '',
      image: '/images/food/chicken_rice_dinner.webp',
      isIllustrative: true,
      displayOrder: 2,
      isActive: true
    },
    {
      category: 'dinner-non-veg',
      name: 'Curd and vegetable curry',
      nameKn: 'ಮೊಸರು ಮತ್ತು ತರಕಾರಿ ಸಾರು',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/curd_veg_curry.webp',
      isIllustrative: true,
      displayOrder: 3,
      isActive: true
    },

    // Evening
    {
      category: 'evening',
      name: 'Coffee',
      nameKn: 'ಕಾಫಿ',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/coffee.webp',
      isIllustrative: true,
      displayOrder: 1,
      isActive: true
    },
    {
      category: 'evening',
      name: 'Tea',
      nameKn: 'ಚಹಾ',
      alias: '',
      aliasKn: '',
      description: '',
      descriptionKn: '',
      price: null,
      isVeg: true,
      badge: '',
      badgeKn: '',
      image: '/images/food/tea.webp',
      isIllustrative: true,
      displayOrder: 2,
      isActive: true
    }
  ];

  for (const item of menuItems) {
    await MenuItem.findOneAndUpdate({ name: item.name }, item, { upsert: true });
  }
  console.log(`✅ Seeded ${menuItems.length} real menu items across 4 categories`);

  // 8. REVIEWS: Seed initial realistic sample reviews idempotently without erasing guest reviews
  let seededReviewsCount = 0;
  for (const sample of SAMPLE_REVIEWS) {
    const existing = await Review.findOne({ guestName: sample.guestName, stayDate: sample.stayDate }).lean();
    if (!existing) {
      await Review.create(sample);
      seededReviewsCount += 1;
    }
  }
  console.log(`✅ Ensured ${SAMPLE_REVIEWS.length} sample reviews in DB (${seededReviewsCount} newly inserted)`);

  // 9. PROMOS: Remove seeded sample promos (COORG25, MISTDIRECT, WEEKENDVIBES)
  await Promo.deleteMany({
    code: { $in: ['COORG25', 'MISTDIRECT', 'WEEKENDVIBES', 'MONSOON20', 'COORGWEEKEND'] }
  });
  console.log('✅ Removed unverified sample promo codes');

  // 10. SEED INCLUSION ITEMS (What's Included & Not Included)
  const defaultInclusions = [
    // Included (6 real amenities)
    {
      type: 'include',
      title: {
        en: 'Morning breakfast',
        kn: 'ಬೆಳಗಿನ ಉಪಹಾರ'
      },
      note: {
        en: 'Freshly prepared wholesome home-style breakfast served every morning.',
        kn: 'ಪ್ರತಿದಿನ ಮುಂಜಾನೆ ತಾಜಾವಾಗಿ ತಯಾರಿಸಿದ ಆರೋಗ್ಯಕರ ಮನೆ ಶೈಲಿಯ ಉಪಹಾರ.'
      },
      icon: 'Coffee',
      displayOrder: 1,
      isActive: true,
      isSample: true
    },
    {
      type: 'include',
      title: {
        en: 'Wi-Fi',
        kn: 'ವೈ-ಫೈ (Wi-Fi)'
      },
      note: {
        en: 'High-speed wireless internet across common living, dining, and verandah areas.',
        kn: 'ಸಾಮಾನ್ಯ ವಾಸದ ಕೋಣೆ, ಊಟದ ಹಾಲ್ ಮತ್ತು ವರಾಂಡಾ ಪ್ರದೇಶಗಳಲ್ಲಿ ಹೈ-ಸ್ಪೀಡ್ ವೈ-ಫೈ.'
      },
      icon: 'Wifi',
      displayOrder: 2,
      isActive: true,
      isSample: true
    },
    {
      type: 'include',
      title: {
        en: 'Parking facility',
        kn: 'ವಾಹನ ನಿಲುಗಡೆ ಸೌಲಭ್ಯ'
      },
      note: {
        en: 'Secure on-premises vehicle parking within the gated homestay grounds.',
        kn: 'ಹೋಂಸ್ಟೇ ಆವರಣದೊಳಗೆ ವಾಹನಗಳಿಗೆ ಸುರಕ್ಷಿತ ಪಾರ್ಕಿಂಗ್ ಸೌಲಭ್ಯ.'
      },
      icon: 'Car',
      displayOrder: 3,
      isActive: true,
      isSample: true
    },
    {
      type: 'include',
      title: {
        en: 'Campfire',
        kn: 'ಕ್ಯಾಂಪ್‌ಫೈರ್ (ಬೆಂಕಿ ಕಾಯಿಸುವಿಕೆ)'
      },
      note: {
        en: 'Cozy evening campfire setup under the open Coorg night skies.',
        kn: 'ತೆರೆದ ಕೂರ್ಗ್ ರಾತ್ರಿಯ ಆಕಾಶದ ಕೆಳಗೆ ಸ್ನೇಹಪರ ಸಂಜೆ ಕ್ಯಾಂಪ್‌ಫೈರ್ ಅನುಭವ.'
      },
      icon: 'Flame',
      displayOrder: 4,
      isActive: true,
      isSample: true
    },
    {
      type: 'include',
      title: {
        en: 'Indoor & outdoor games',
        kn: 'ಒಳಾಂಗಣ ಮತ್ತು ಹೊರಾಂಗಣ ಆಟಗಳು'
      },
      note: {
        en: 'Carrom, board games, badminton, and spacious lawn recreation for all age groups.',
        kn: 'ಕ್ಯಾರಮ್, ಬೋರ್ಡ್ ಆಟಗಳು, ಬ್ಯಾಡ್ಮಿಂಟನ್ ಮತ್ತು ಎಲ್ಲಾ ವಯೋಮಾನದವರಿಗೆ ಹೊರಾಂಗಣ ಆಟಗಳು.'
      },
      icon: 'Gamepad2',
      displayOrder: 5,
      isActive: true,
      isSample: true
    },
    {
      type: 'include',
      title: {
        en: 'Estate walk',
        kn: 'ಕಾಫಿ ತೋಟದ ನಡಿಗೆ'
      },
      note: {
        en: 'Serene morning or evening walk amidst the green coffee and spice plantation trails.',
        kn: 'ಕಾಫಿ ಮತ್ತು ಸಾಂಬಾರ ಪದಾರ್ಥಗಳ ತೋಟದ ಹಾದಿಗಳಲ್ಲಿ ಪ್ರಶಾಂತವಾದ ಮುಂಜಾನೆ ಅಥವಾ ಸಂಜೆಯ ನಡಿಗೆ.'
      },
      icon: 'Footprints',
      displayOrder: 6,
      isActive: true,
      isSample: true
    },

    // Not Included
    {
      type: 'exclude',
      title: {
        en: 'Dinner',
        kn: 'ರಾತ್ರಿಯ ಊಟ'
      },
      note: {
        en: 'Available on request, ask the host',
        kn: 'ಕೋರಿಕೆಯ ಮೇರೆಗೆ ಲಭ್ಯ, ಆತಿಥೇಯರನ್ನು ವಿಚಾರಿಸಿ'
      },
      icon: 'UtensilsCrossed',
      displayOrder: 1,
      isActive: true,
      isSample: true
    },
    {
      type: 'exclude',
      title: {
        en: 'Travel and transport to the homestay',
        kn: 'ಹೋಂಸ್ಟೇಗೆ ಪ್ರಯಾಣ ಮತ್ತು ಸಾರಿಗೆ'
      },
      note: {
        en: 'Guests arrange their own transport; local taxi assistance available upon prior request.',
        kn: 'ಅತಿಥಿಗಳು ತಮ್ಮದೇ ಆದ ಸಾರಿಗೆಯನ್ನು ವ್ಯವಸ್ಥೆ ಮಾಡಿಕೊಳ್ಳಬೇಕು; ಮುಂಚಿತ ಕೋರಿಕೆಯ ಮೇರೆಗೆ ಸ್ಥಳೀಯ ಟ್ಯಾಕ್ಸಿ ಲಭ್ಯ.'
      },
      icon: 'Bus',
      displayOrder: 2,
      isActive: true,
      isSample: true
    },
    {
      type: 'exclude',
      title: {
        en: 'Personal expenses',
        kn: 'ವೈಯಕ್ತಿಕ ವೆಚ್ಚಗಳು'
      },
      note: {
        en: 'Personal shopping, laundry services, and entry tickets for outside sightseeing spots.',
        kn: 'ವೈಯಕ್ತಿಕ ಶಾಪಿಂಗ್, ಲಾಂಡ್ರಿ ಮತ್ತು ಹೊರಗಿನ ಪ್ರವಾಸಿ ತಾಣಗಳ ಪ್ರವೇಶ ಟಿಕೆಟ್‌ಗಳು.'
      },
      icon: 'Wallet',
      displayOrder: 3,
      isActive: true,
      isSample: true
    },
    {
      type: 'exclude',
      title: {
        en: 'Guests beyond the stated capacity',
        kn: 'ಗರಿಷ್ಠ ಮಿತಿಗಿಂತ ಹೆಚ್ಚಿನ ಅತಿಥಿಗಳು'
      },
      note: {
        en: 'Additional guests must be booked in advance subject to homestay room capacity.',
        kn: 'ಹೆಚ್ಚುವರಿ ಅತಿಥಿಗಳಿಗೆ ಕೊಠಡಿ ಸಾಮರ್ಥ್ಯಕ್ಕೆ ಅನುಗುಣವಾಗಿ ಮುಂಚಿತವಾಗಿಯೇ ಬುಕ್ ಮಾಡಿರಬೇಕು.'
      },
      icon: 'Users',
      displayOrder: 4,
      isActive: true,
      isSample: true
    }
  ];

  for (const item of defaultInclusions) {
    await InclusionItem.findOneAndUpdate(
      { type: item.type, 'title.en': item.title.en },
      item,
      { upsert: true, new: true }
    );
  }
  console.log(`✅ Seeded ${defaultInclusions.length} inclusion & exclusion items`);

  console.log('🎉 Database seeding completed successfully for Marichin Homestay (Single Property)!');
};

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => {
      console.log('Closing connection...');
      mongoose.connection.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}

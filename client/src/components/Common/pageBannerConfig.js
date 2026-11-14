// Configuration for Inner Page Hero Banners (7 Inner Pages)
// Configures: About, Rooms, Dining, Experiences, Packages, Gallery, Contact
// Sourced strictly from verified property data, siteSettings, and authentic photography

import {
  isPlaceholderPhone,
  resolveHostPhone
} from '../../utils/whatsappMessages';

export { isPlaceholderPhone, resolveHostPhone };

export const getPageBannerConfig = (pageKey, ctx = {}) => {
  const { t = (k) => k, isKn = false, siteSettings = {}, diningContent = null, onFilterSelect = null } = ctx;

  // Resolve localized dining hero tags and remove any "Kodava flavors" wording
  const resolveDiningTitle = () => {
    let title = '';
    if (diningContent?.hero?.title) {
      if (typeof diningContent.hero.title === 'object') {
        title = isKn ? (diningContent.hero.title.kn || diningContent.hero.title.en) : (diningContent.hero.title.en || diningContent.hero.title.kn);
      } else {
        title = String(diningContent.hero.title);
      }
    }
    if (!title || !title.trim()) {
      title = t('pageBanner.diningTitle') || 'Homely Food at Marichin Homestay';
    }
    return title.replace(/Kodava flavors/gi, 'Homely Food').replace(/Kodava/gi, 'Homestay');
  };

  const resolveDiningDescription = () => {
    let desc = '';
    if (diningContent?.hero?.description) {
      if (typeof diningContent.hero.description === 'object') {
        desc = isKn ? (diningContent.hero.description.kn || diningContent.hero.description.en) : (diningContent.hero.description.en || diningContent.hero.description.kn);
      } else {
        desc = String(diningContent.hero.description);
      }
    }
    if (!desc || !desc.trim() || desc.includes('Freshly prepared authentic') || desc.includes('local care')) {
      desc = isKn ? 'ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇನಲ್ಲಿ ಮನೆಯೂಟ.' : 'Homely food at Marichin Homestay.';
    }
    return desc;
  };

  const resolveDiningChips = () => {
    let tags = [];
    if (diningContent?.hero?.tags && Array.isArray(diningContent.hero.tags) && diningContent.hero.tags.length > 0) {
      tags = diningContent.hero.tags.map((tg) => {
        if (!tg) return '';
        if (typeof tg === 'object') {
          return isKn ? (tg.kn || tg.en || '') : (tg.en || tg.kn || '');
        }
        return String(tg);
      }).filter((s) => s && s.trim().length > 0 && !s.includes('Meal Timings') && !s.includes('Kitchen'));
    }

    if (tags.length === 0) {
      return [
        { icon: 'Leaf', label: isKn ? 'ಉಪಹಾರ' : 'Breakfast' },
        { icon: 'CookingPot', label: isKn ? 'ರಾತ್ರಿಯ ಊಟ (ಸಸ್ಯಾಹಾರಿ ಮತ್ತು ಮಾಂಸಾಹಾರಿ)' : 'Dinner Veg & Non-Veg' },
        { icon: 'Coffee', label: isKn ? 'ಸಂಜೆಯ ಚಹಾ ಮತ್ತು ಕಾಫಿ' : 'Evening Tea & Coffee' }
      ];
    }

    const iconMap = ['Leaf', 'CookingPot', 'Coffee', 'Clock', 'CookingPot'];
    return tags.map((label, idx) => ({
      icon: iconMap[idx % iconMap.length],
      label: label.replace(/Kodava/gi, 'Homestay')
    }));
  };

  const configs = {
    // 1. ABOUT PAGE
    about: {
      pageKey: 'about',
      breadcrumb: {
        to: '/about',
        label: t('pageBanner.aboutBreadcrumb') || 'About'
      },
      title: t('pageBanner.aboutTitle') || 'The Marichin Homestay Heritage',
      description: t('about.lead') || t('pageBanner.aboutDesc') || 'A peaceful private nature homestay nestled amidst lush coffee plantations in Chikkabettageri Village, Kushalnagar, Kodagu.',
      bgImage: '/images/realimage/homeimage.jpeg',
      bgAlt: 'Marichin Homestay heritage estate exterior with coffee plantation canopy',
      bgPosition: 'center 40%',
      nextBgColor: '#FAF6EC',
      showBookingBtn: true,
      bookingBtnText: t('pageBanner.bookNow') || 'Book Now',
      storyVideoUrl: siteSettings?.storyVideoUrl || siteSettings?.videoUrl || '',
      storyBtnText: t('pageBanner.watchStory') || 'Watch Our Story',
      chips: [
        { icon: 'Trees', label: t('pageBanner.estateSetting') || 'Estate Setting' },
        { icon: 'Coffee', label: t('pageBanner.homelyFood') || 'Homely Food' },
        { icon: 'Sparkles', label: t('pageBanner.naturalStay') || 'Natural Stay' },
        ...(siteSettings?.registrationNumber && siteSettings.registrationNumber.trim() ? [
          { icon: 'ShieldCheck', label: t('pageBanner.tourismCertified') || 'Karnataka Tourism Certified' }
        ] : [])
      ],
      rightSideType: 'floatingCards',
      floatingCards: [
        {
          id: 'about-card-1',
          image: '/images/realimage/real12.jpeg',
          alt: 'Guests walking on plantation nature path under shady silver oak trees',
          badge: t('pageBanner.naturePath') || 'Nature Path',
          rot: -3,
          delay: 0,
          objectPosition: 'center 35%'
        },
        {
          id: 'about-card-2',
          image: '/images/realimage/real13.jpeg',
          alt: 'Guided coffee plantation trail with lush coffee bushes',
          badge: t('pageBanner.coffeeTrail') || 'Coffee Trail',
          rot: 3,
          delay: 140,
          objectPosition: 'center 45%'
        }
      ]
    },

    // 2. ROOMS PAGE
    rooms: {
      pageKey: 'rooms',
      breadcrumb: {
        to: '/rooms',
        label: t('pageBanner.roomsBreadcrumb') || 'Rooms'
      },
      title: isKn ? (t('pageBanner.roomsTitle') || 'ನಮ್ಮ ಕೊಠಡಿಗಳು') : (siteSettings?.roomsPageHeading || t('pageBanner.roomsTitle') || 'Our Rooms'),
      description: isKn
        ? (t('pageBanner.roomsDesc') || 'ಮೂರು ಪ್ರಕಾರದ ಕೊಠಡಿಗಳು, ಪ್ರತಿಯೊಂದರಲ್ಲೂ ಬೆಳಗಿನ ಉಪಹಾರ ಸೇರಿದೆ. ನಿಮ್ಮ ಗುಂಪಿಗೆ ಸರಿಹೊಂದುವ ಕೊಠಡಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.')
        : (siteSettings?.roomsPageDescription && !siteSettings.roomsPageDescription.includes('Booked together')
            ? siteSettings.roomsPageDescription
            : (t('pageBanner.roomsDesc') || 'Three room types, each with morning breakfast included. Choose the room that fits your group.')),
      bgImage: '/images/realimage/real3.jpeg',
      bgAlt: 'Standard Bedroom wooden bed at Marichin Homestay',
      bgPosition: 'center 45%',
      nextBgColor: '#F1E9D8',
      showBookingBtn: true,
      bookingBtnText: t('pageBanner.reserveStay') || 'Reserve Your Stay',
      showCarouselDots: true,
      chips: [
        { icon: 'BedDouble', label: t('pageBanner.threeRooms') || 'Three Room Types' },
        { icon: 'Trees', label: t('pageBanner.estateViews') || 'Estate Views' },
        { icon: 'Wifi', label: t('pageBanner.wifi') || 'Wi-Fi' },
        { icon: 'Car', label: t('pageBanner.parkingFacility') || 'Parking Facility' }
      ],
      rightSideType: 'carousel',
      carouselSlides: [
        {
          id: 'room-slide-1',
          image: '/images/realimage/real3.jpeg',
          alt: 'Standard Bedroom wooden double bed with floral runner and warm lighting',
          badge: t('pageBanner.standardRoom') || 'Standard Room',
          objectPosition: 'center 45%'
        },
        {
          id: 'room-slide-2',
          image: '/images/realimage/real5.jpeg',
          alt: 'Standard Bedroom double bed and single bed dressed in fresh white linens',
          badge: t('pageBanner.standardRoom') || 'Standard Room',
          objectPosition: 'center 50%'
        },
        {
          id: 'room-slide-3',
          image: '/images/realimage/real4.jpeg',
          alt: 'Suite Room double bed with doorway opening to verandah view',
          badge: t('pageBanner.suiteRoom') || 'Suite Room',
          objectPosition: 'center 40%'
        },
        {
          id: 'room-slide-4',
          image: '/images/realimage/real6.jpeg',
          alt: 'Suite Room interior with balcony doorway and view',
          badge: t('pageBanner.suiteRoom') || 'Suite Room',
          objectPosition: 'center 45%'
        }
      ]
    },

    // 3. DINING PAGE
    dining: {
      pageKey: 'dining',
      breadcrumb: {
        to: '/dining',
        label: t('pageBanner.diningBreadcrumb') || 'Dining'
      },
      title: resolveDiningTitle(),
      description: resolveDiningDescription(),
      bgImage: '/images/realimage/real8.jpeg',
      bgAlt: 'Homely Dining Hall & Seating at Marichin Homestay',
      bgPosition: 'center 40%',
      nextBgColor: '#FAF6EC',
      showBookingBtn: true,
      bookingBtnText: t('pageBanner.bookNow') || 'Book Now',
      chips: resolveDiningChips(),
      rightSideType: 'floatingCards',
      floatingCards: [
        {
          id: 'dining-card-1',
          image: '/images/realimage/real9.jpeg',
          alt: isKn ? 'ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇ ಊಟದ ಸ್ಥಳ' : 'Dining area at Marichin Homestay',
          badge: isKn ? 'ಊಟದ ಸ್ಥಳ' : 'Dining area',
          rot: -3,
          delay: 0,
          objectPosition: 'center 45%'
        },
        {
          id: 'dining-card-2',
          image: '/images/realimage/real8.jpeg',
          alt: isKn ? 'ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇ ಊಟದ ಸ್ಥಳ' : 'Dining area at Marichin Homestay',
          badge: isKn ? 'ಊಟದ ಸ್ಥಳ' : 'Dining area',
          rot: 3,
          delay: 140,
          objectPosition: 'center 40%'
        }
      ]
    },

    // 4. EXPERIENCES PAGE
    experiences: {
      pageKey: 'experiences',
      breadcrumb: {
        to: '/experiences',
        label: t('pageBanner.experiencesBreadcrumb') || 'Experiences'
      },
      title: t('pageBanner.experiencesTitle') || 'Homestay Experiences',
      description: t('pageBanner.experiencesDesc') || 'Immerse yourself in authentic plantation living with peaceful estate walks, cozy campfires, indoor and outdoor games, and wholesome home-cooked meals.',
      bgImage: '/images/realimage/real13.jpeg',
      bgAlt: 'Guided nature walk in coffee estate surrounded by dense vegetation',
      bgPosition: 'center 45%',
      nextBgColor: '#FAF6EC',
      showBookingBtn: true,
      bookingBtnText: t('pageBanner.bookNow') || 'Book Now',
      chips: [
        { icon: 'Compass', label: t('pageBanner.estateWalk') || 'Estate Walk' },
        { icon: 'Flame', label: t('pageBanner.campfire') || 'Campfire' },
        { icon: 'Gamepad2', label: t('pageBanner.indoorOutdoorGames') || 'Indoor & Outdoor Games' },
        { icon: 'Coffee', label: t('pageBanner.homelyFood') || 'Homely Food' }
      ],
      rightSideType: 'floatingCards',
      floatingCards: [
        {
          id: 'exp-card-1',
          image: '/images/realimage/real12.jpeg',
          alt: 'Guests walking on plantation nature path',
          badge: t('pageBanner.naturePath') || 'Nature Path',
          rot: -4,
          delay: 0,
          objectPosition: 'center 35%'
        },
        {
          id: 'exp-card-2',
          image: '/images/realimage/real14.jpeg',
          alt: 'Guests playing board games in the gazebo with campfire brazier',
          badge: t('pageBanner.gazeboEvenings') || 'Gazebo Evenings',
          rot: 2,
          delay: 120,
          objectPosition: 'center 45%'
        },
        {
          id: 'exp-card-3',
          image: '/images/realimage/homeimage.jpeg',
          alt: 'Marichin Homestay estate exterior architecture',
          badge: t('pageBanner.heritageVilla') || 'Heritage Villa',
          rot: -2,
          delay: 220,
          objectPosition: 'center 50%'
        }
      ]
    },

    // 5. PACKAGES PAGE
    packages: {
      pageKey: 'packages',
      breadcrumb: {
        to: '/packages',
        label: t('pageBanner.packagesBreadcrumb') || 'Packages'
      },
      title: t('pageBanner.packagesTitle') || 'Homestay Packages',
      description: isKn ? (t('pageBanner.packagesDesc') || 'ಕುಟುಂಬಗಳು, ದಂಪತಿಗಳು ಮತ್ತು ಗುಂಪುಗಳಿಗಾಗಿ ರೂಪಿಸಲಾದ ವಾಸ್ತವ್ಯ ಮತ್ತು ಊಟದ ಪ್ಯಾಕೇಜ್‌ಗಳು.') : (t('pageBanner.packagesDesc') || 'Curated accommodation and dining packages tailored for families, couples, and groups.'),
      bgImage: '/images/realimage/homeimage.jpeg',
      bgAlt: 'Marichin Homestay architecture and paved courtyard',
      bgPosition: 'center 45%',
      nextBgColor: '#FAF6EC',
      showBookingBtn: true,
      bookingBtnText: isKn ? 'ನಿಮ್ಮ ವಾಸ್ತವ್ಯ ಕಾಯ್ದಿರಿಸಿ' : (t('pageBanner.reserveStay') || 'Reserve Your Stay'),
      chips: [
        { icon: 'BedDouble', label: isKn ? 'ಕೊಠಡಿ + ಉಪಹಾರ' : 'Room + Breakfast' },
        { icon: 'UtensilsCrossed', label: isKn ? 'ಉಪಹಾರ + ಊಟ' : 'Breakfast + Dinner' },
        { icon: 'Home', label: isKn ? 'ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ' : 'Entire Homestay' },
        { icon: 'Users', label: isKn ? 'ಫ್ಯಾಮಿಲಿ ವಾಸ್ತವ್ಯ' : 'Family Stay' }
      ],
      rightSideType: 'floatingCards',
      floatingCards: [
        {
          id: 'pkg-card-1',
          image: '/images/realimage/real3.jpeg',
          alt: 'Standard Room wooden bed representing Room + Breakfast package',
          badge: isKn ? 'ಕೊಠಡಿ + ಉಪಹಾರ' : 'Room + Breakfast',
          rot: -3,
          delay: 0,
          objectPosition: 'center 45%'
        },
        {
          id: 'pkg-card-2',
          image: '/images/realimage/real8.jpeg',
          alt: 'Dining hall table representing Breakfast + Dinner package',
          badge: isKn ? 'ಉಪಹಾರ + ಊಟ' : 'Breakfast + Dinner',
          rot: 3,
          delay: 140,
          objectPosition: 'center 40%'
        },
        {
          id: 'pkg-card-3',
          image: '/images/realimage/homeimage.jpeg',
          alt: 'Entire homestay estate architecture representing all 5 rooms package',
          badge: isKn ? 'ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ' : 'Entire Homestay',
          rot: -1,
          delay: 240,
          objectPosition: 'center 45%'
        }
      ]
    },

    // 6. GALLERY PAGE
    gallery: {
      pageKey: 'gallery',
      breadcrumb: {
        to: '/gallery',
        label: t('pageBanner.galleryBreadcrumb') || 'Gallery'
      },
      title: t('pageBanner.galleryTitle') || 'Marichin Homestay Photo Gallery',
      description: t('pageBanner.galleryDesc') || 'Glimpses into our coffee plantation sanctuary, spacious rooms, estate vistas, campfire starlit evenings, and authentic homestay hospitality.',
      bgImage: '/images/realimage/homeimage.jpeg',
      bgAlt: 'Marichin Homestay estate exterior photography',
      bgPosition: 'center 45%',
      nextBgColor: '#F1E9D8',
      showBookingBtn: true,
      bookingBtnText: t('pageBanner.bookNow') || 'Book Now',
      chips: [
        {
          icon: 'BedDouble',
          label: t('pageBanner.filterRooms') || 'Rooms',
          filterKey: 'Rooms',
          isFilter: true
        },
        {
          icon: 'UtensilsCrossed',
          label: t('pageBanner.filterDining') || 'Dining',
          filterKey: 'Dining',
          isFilter: true
        },
        {
          icon: 'Trees',
          label: t('pageBanner.filterEstate') || 'Estate',
          filterKey: 'Estate',
          isFilter: true
        },
        {
          icon: 'Users',
          label: t('pageBanner.filterGuests') || 'Guests',
          filterKey: 'Guests',
          isFilter: true
        }
      ],
      rightSideType: 'stackedCollage',
      collagePhotos: [
        {
          id: 'gallery-col-1',
          image: '/images/realimage/real3.jpeg',
          alt: 'Standard Bedroom interior',
          badge: t('pageBanner.standardRoom') || 'Standard Room',
          rot: -4,
          objectPosition: 'center 45%'
        },
        {
          id: 'gallery-col-2',
          image: '/images/realimage/real8.jpeg',
          alt: 'Dining Hall seating and buffet setup',
          badge: t('pageBanner.diningHall') || 'Dining Hall',
          rot: 3,
          objectPosition: 'center 40%'
        },
        {
          id: 'gallery-col-3',
          image: '/images/realimage/real12.jpeg',
          alt: 'Guests walking on plantation nature path',
          badge: t('pageBanner.naturePath') || 'Nature Path',
          rot: -1,
          objectPosition: 'center 35%'
        },
        {
          id: 'gallery-col-4',
          image: '/images/realimage/real13.jpeg',
          alt: 'Guided coffee plantation trail',
          badge: t('pageBanner.coffeeTrail') || 'Coffee Trail',
          rot: 2,
          objectPosition: 'center 45%'
        }
      ]
    },

    // 7. CONTACT PAGE
    contact: {
      pageKey: 'contact',
      breadcrumb: {
        to: '/contact',
        label: t('pageBanner.contactBreadcrumb') || 'Contact'
      },
      title: t('pageBanner.contactTitle') || 'Contact & Directions',
      description: t('pageBanner.contactDesc') || 'Located in Chikkabettageri Village, Gudde Hosur Post near Kushalnagar (nearest town). We are always happy to answer your questions or assist with your travel planning.',
      bgImage: '/images/realimage/homeimage.jpeg',
      bgAlt: 'Marichin Homestay driveway entrance and welcoming environment',
      bgPosition: 'center 45%',
      nextBgColor: '#FAF6EC',
      showBookingBtn: false, // Action tiles used instead on Contact
      chips: [], // Contact uses the 4 glass action tiles below
      rightSideType: 'contactCards',
      contactActions: {
        phone: resolveHostPhone(siteSettings?.phone || siteSettings?.phones?.[0]),
        whatsapp: resolveHostPhone(siteSettings?.whatsapp || siteSettings?.whatsappNumber),
        address: siteSettings?.address || 'Chikkabettageri Village, Gudde Hosur Post, Kushalnagar, Kodagu District, Karnataka 571234',
        googleMapsUrl: siteSettings?.googleMapsUrl || '',
        enquiryAnchor: '#enquiry-form'
      },
      floatingCards: [
        {
          id: 'contact-card-1',
          image: '/images/realimage/real10.jpeg',
          alt: 'Front reception desk and welcoming counter',
          badge: t('pageBanner.receptionLounge') || 'Reception Desk',
          rot: -3,
          delay: 0,
          objectPosition: 'center 40%'
        },
        {
          id: 'contact-card-2',
          image: '/images/realimage/real2.jpeg',
          alt: 'First-floor covered verandah balcony with estate view',
          badge: t('pageBanner.verandahView') || 'Balcony Verandah',
          rot: 3,
          delay: 140,
          objectPosition: 'center 45%'
        },
        {
          id: 'contact-card-3',
          image: '/images/realimage/homeimage.jpeg',
          alt: 'Marichin Homestay architecture',
          badge: t('pageBanner.heritageVilla') || 'Heritage Villa',
          rot: -1,
          delay: 240,
          objectPosition: 'center 50%'
        }
      ]
    },

    // 8. POLICIES PAGE (/policies)
    policies: {
      pageKey: 'policies',
      breadcrumb: {
        to: '/policies',
        label: isKn ? 'ನಿಯಮಗಳು' : 'Policies'
      },
      title: isKn ? 'ಹೋಂಸ್ಟೇ ನಿಯಮಗಳು ಮತ್ತು ನಿಬಂಧನೆಗಳು' : 'Homestay Policies & Terms',
      description: isKn
        ? 'ಚೆಕ್-ಇನ್, ಪಾವತಿ, ಮನೆ ನಿಯಮಗಳು ಮತ್ತು ವಾಸ್ತವ್ಯದ ನಿಬಂಧನೆಗಳ ಕುರಿತ ಸ್ಪಷ್ಟ ಮಾಹಿತಿ.'
        : 'Clear guidelines covering booking, check-in, house rules, and stay terms at Marichin Homestay.',
      bgImage: '/images/realimage/homeimage.jpeg',
      bgAlt: 'Marichin Homestay exterior and courtyard in Chikkabettageri Village',
      bgPosition: 'center 42%',
      nextBgColor: '#FAF6EC',
      showBookingBtn: false,
      chips: [
        { icon: 'Clock', label: `${isKn ? 'ಚೆಕ್-ಇನ್' : 'Check-In'}: ${siteSettings?.checkInTime || '12:00 PM'}` },
        { icon: 'Clock', label: `${isKn ? 'ಚೆಕ್-ಔಟ್' : 'Check-Out'}: ${siteSettings?.checkOutTime || '11:00 AM'}` },
        { icon: 'ShieldCheck', label: isKn ? 'ಮೂಲ ಸರ್ಕಾರಿ ಐಡಿ ಕಡ್ಡಾಯ' : 'Govt. Photo ID at Check-In' }
      ],
      rightSideType: 'floatingCards',
      floatingCards: [
        {
          id: 'policies-card-1',
          image: '/images/realimage/homeimage.jpeg',
          alt: 'Marichin Homestay building and courtyard',
          badge: isKn ? 'ಹೋಂಸ್ಟೇ ಆವರಣ' : 'Homestay Property',
          rot: -2,
          delay: 0,
          objectPosition: 'center 45%'
        },
        {
          id: 'policies-card-2',
          image: '/images/realimage/real2.jpeg',
          alt: 'Covered balcony verandah seating',
          badge: isKn ? 'ಬಾಲ್ಕನಿ ವರಾಂಡಾ' : 'Balcony Verandah',
          rot: 3,
          delay: 140,
          objectPosition: 'center 45%'
        }
      ]
    },

    // 9. REFUND & CANCELLATION POLICY (/refund-policy)
    refund: {
      pageKey: 'refund',
      breadcrumb: {
        to: '/refund-policy',
        label: isKn ? 'ಮರುಪಾವತಿ ನೀತಿ' : 'Refund & Cancellation'
      },
      title: isKn ? 'ಮರುಪಾವತಿ ಮತ್ತು ರದ್ದತಿ ನೀತಿ' : 'Refund & Cancellation Policy',
      description: isKn
        ? 'ರದ್ದತಿ ಹಂತಗಳು, ರೇಜರ್‌ಪೇ (Razorpay) ಮರುಪಾವತಿ ಸಮಯ, ದಿನಾಂಕ ಬದಲಾವಣೆ ಮತ್ತು ಹಾಜರಾಗದಿರುವ ನಿಯಮಗಳು.'
        : 'Cancellation tiers, Razorpay refund timelines, date changes, and worked fare examples.',
      bgImage: '/images/realimage/real2.jpeg',
      bgAlt: 'Covered verandah balcony at Marichin Homestay',
      bgPosition: 'center 45%',
      nextBgColor: '#FAF6EC',
      showBookingBtn: false,
      chips: [
        { icon: 'RefreshCw', label: isKn ? 'ರೇಜರ್‌ಪೇ ಮೂಲ ಖಾತೆಗೆ ಮರುಪಾವತಿ' : 'Razorpay Refunds to Original Method' },
        { icon: 'Clock', label: siteSettings?.refundTimelineText || '5 to 7 working days' }
      ],
      rightSideType: 'floatingCards',
      floatingCards: [
        {
          id: 'refund-card-1',
          image: '/images/realimage/real2.jpeg',
          alt: 'Marichin Homestay verandah view',
          badge: isKn ? 'ಪಾರದರ್ಶಕ ನಿಯಮಗಳು' : 'Clear Refund Tiers',
          rot: -2,
          delay: 0,
          objectPosition: 'center 45%'
        },
        {
          id: 'refund-card-2',
          image: '/images/realimage/homeimage.jpeg',
          alt: 'Marichin Homestay property exterior',
          badge: isKn ? 'ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇ' : 'Marichin Homestay',
          rot: 3,
          delay: 140,
          objectPosition: 'center 45%'
        }
      ]
    },

    // 10. PRIVACY POLICY (/privacy)
    privacy: {
      pageKey: 'privacy',
      breadcrumb: {
        to: '/privacy',
        label: isKn ? 'ಗೌಪ್ಯತಾ ನೀತಿ' : 'Privacy Policy'
      },
      title: isKn ? 'ಗೌಪ್ಯತಾ ನೀತಿ' : 'Privacy Policy',
      description: isKn
        ? 'ಬುಕಿಂಗ್ ಮತ್ತು ಚೆಕ್-ಇನ್ ಸಮಯದಲ್ಲಿ ನಾವು ಸಂಗ್ರಹಿಸುವ ಮಾಹಿತಿ ಮತ್ತು ಅದನ್ನು ಹೇಗೆ ಬಳಸುತ್ತೇವೆ.'
        : 'How guest contact, booking, payment reference, and check-in details are collected, processed, and protected.',
      bgImage: '/images/realimage/homeimage.jpeg',
      bgAlt: 'Marichin Homestay in Kushalnagar coffee estate',
      bgPosition: 'center 45%',
      nextBgColor: '#FAF6EC',
      showBookingBtn: false,
      chips: [
        { icon: 'ShieldCheck', label: isKn ? 'ರೇಜರ್‌ಪೇ ಸುರಕ್ಷಿತ ಪಾವತಿ' : 'Razorpay Payment Processing' },
        { icon: 'Clock', label: isKn ? 'ಅತಿಥಿ ಮಾಹಿತಿ ಗೌಪ್ಯತೆ' : 'Guest Data Care' }
      ],
      rightSideType: 'floatingCards',
      floatingCards: [
        {
          id: 'privacy-card-1',
          image: '/images/realimage/real10.jpeg',
          alt: 'Reception counter at Marichin Homestay',
          badge: isKn ? 'ಗೌಪ್ಯತೆ ಮತ್ತು ಸುರಕ್ಷತೆ' : 'Guest Data Privacy',
          rot: -2,
          delay: 0,
          objectPosition: 'center 45%'
        },
        {
          id: 'privacy-card-2',
          image: '/images/realimage/real2.jpeg',
          alt: 'Balcony verandah at Marichin Homestay',
          badge: isKn ? 'ಸುರಕ್ಷಿತ ಬುಕಿಂಗ್' : 'Verified Check-In',
          rot: 3,
          delay: 140,
          objectPosition: 'center 45%'
        }
      ]
    },

    // 11. SAFETY (/safety)
    safety: {
      pageKey: 'safety',
      breadcrumb: {
        to: '/safety',
        label: isKn ? 'ಸುರಕ್ಷತೆ' : 'Safety'
      },
      title: isKn ? 'ಅತಿಥಿ ಸುರಕ್ಷತೆ ಮತ್ತು ತುರ್ತು ಸಂಪರ್ಕಗಳು' : 'Safety & Emergency Contacts',
      description: isKn
        ? 'ಹೋಂಸ್ಟೇ ಆತಿಥೇಯರ ಸಂಪರ್ಕ, ರಾಷ್ಟ್ರೀಯ ತುರ್ತು ಸಂಖ್ಯೆಗಳು (112 / 108) ಮತ್ತು ಪರಿಶೀಲಿತ ಮಾಹಿತಿ.'
        : 'Direct host contact details, national emergency helplines (112 & 108), and owner-confirmed safety notes.',
      bgImage: '/images/realimage/homeimage.jpeg',
      bgAlt: 'Marichin Homestay premises near Kushalnagar',
      bgPosition: 'center 45%',
      nextBgColor: '#FAF6EC',
      showBookingBtn: false,
      chips: [
        { icon: 'Phone', label: '112 Emergency' },
        { icon: 'ShieldCheck', label: '108 Ambulance' }
      ],
      rightSideType: 'floatingCards',
      floatingCards: [
        {
          id: 'safety-card-1',
          image: '/images/realimage/homeimage.jpeg',
          alt: 'Marichin Homestay property view',
          badge: isKn ? 'ಅತಿಥಿ ಸಹಾಯ' : 'Guest Assistance',
          rot: -2,
          delay: 0,
          objectPosition: 'center 45%'
        },
        {
          id: 'safety-card-2',
          image: '/images/realimage/real7.jpeg',
          alt: 'Coffee plantation surroundings at Marichin Homestay',
          badge: isKn ? 'ಕಾಫಿ ತೋಟದ ಪರಿಸರ' : 'Estate Grounds',
          rot: 3,
          delay: 140,
          objectPosition: 'center 45%'
        }
      ]
    }
  };

  return configs[pageKey] || configs.about;
};


import mongoose from 'mongoose';
import { DEFAULT_HERO_BANNER, HERO_OVERLAY_OPTIONS } from '../utils/heroBanner.js';

const siteSettingsSchema = new mongoose.Schema(
  {
    propertyName: {
      type: String,
      default: 'Marichin Homestay'
    },
    tagline: {
      type: String,
      default: 'Escape to Nature. Experience Warm Hospitality.'
    },
    subTagline: {
      type: String,
      default: 'A tranquil nature retreat nestled amidst lush coffee plantations in Chikkabettageri Village, Kushalnagar, Kodagu District.'
    },
    address: {
      type: String,
      default: 'Chikkabettageri Village, Gudde Hosur Post, Kushalnagar, Kodagu District, Karnataka 571234'
    },
    registrationNumber: {
      type: String,
      default: ''
    },
    phones: [
      {
        type: String,
        default: '+91 95912 09522'
      }
    ],
    email: {
      type: String,
      default: 'coorgmarichinhomestay@gmail.com'
    },
    whatsappNumber: {
      type: String,
      default: '+91 95912 09522'
    },
    upiId: {
      type: String,
      default: 'marichin@okaxis'
    },
    googleMapsEmbedUrl: {
      type: String,
      default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3896.792!2d75.9382!3d12.4589!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDI3JzMyLjAiTiA3NcKwNTYnMTcuNSJF!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin'
    },
    googleMapsShareUrl: {
      type: String,
      default: ''
    },
    instagramUrl: {
      type: String,
      default: 'https://www.instagram.com/coorg_marichin_homestay?utm_source=qr&cplk=bWd6MjhrcHducjVt'
    },
    facebookUrl: {
      type: String,
      default: 'https://www.facebook.com/profile.php?id=61596613283636'
    },
    youtubeUrl: {
      type: String,
      default: 'https://www.youtube.com/channel/UCaf39e4l1iRDA-CMj72q1gQ'
    },
    checkInTime: {
      type: String,
      default: '12:00 PM'
    },
    checkOutTime: {
      type: String,
      default: '11:00 AM'
    },
    minNights: {
      type: Number,
      default: 1,
      min: 1
    },
    maxAdvanceDays: {
      type: Number,
      default: 365,
      min: 1
    },
    sameDayCutoffTime: {
      type: String,
      default: '18:00'
    },
    holdMinutes: {
      type: Number,
      default: 15,
      min: 1
    },
    autoConfirmAfterPayment: {
      type: Boolean,
      default: true
    },
    fullHomePricePerNight: {
      type: Number,
      default: 35000,
      min: 0
    },
    fullHomeEnabled: {
      type: Boolean,
      default: true
    },
    fullHomeMinNights: {
      type: Number,
      default: 1,
      min: 1
    },
    fullHomeMealsNote: {
      type: String,
      default: 'Morning breakfast included'
    },
    taxPercent: {
      type: Number,
      default: 0
    },
    pricePerNight: {
      type: Number,
      default: 8000
    },
    extraGuestCharge: {
      type: Number,
      default: 0
    },
    mealsIncluded: {
      type: String,
      default: 'Morning breakfast'
    },
    inclusionsNote: {
      type: String,
      default: 'Includes morning breakfast, Wi-Fi, parking, campfire, indoor and outdoor games and estate walk'
    },
    advanceOptions: {
      type: [Number],
      default: [20, 50, 100]
    },
    cancellationTiers: {
      type: [
        {
          _id: false,
          daysBeforeCheckIn: { type: Number, required: true, min: 0 },
          refundPercent: { type: Number, required: true, min: 0, max: 100 }
        }
      ],
      default: () => [
        { daysBeforeCheckIn: 15, refundPercent: 100 },
        { daysBeforeCheckIn: 7, refundPercent: 50 },
        { daysBeforeCheckIn: 0, refundPercent: 0 }
      ]
    },
    noShowRefundPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    refundTimelineText: {
      type: String,
      default: '5 to 7 working days'
    },
    hostCancelsRefundPercent: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    dateChangeRule: {
      en: {
        type: String,
        default: 'Date change requests are subject to room availability and tariff differences for the newly requested dates.'
      },
      kn: {
        type: String,
        default: 'ದಿನಾಂಕ ಬದಲಾವಣೆ ವಿನಂತಿಗಳು ಕೊಠಡಿ ಲಭ್ಯತೆ ಮತ್ತು ಹೊಸ ದಿನಾಂಕಗಳ ದರ ವ್ಯತ್ಯಾಸಕ್ಕೆ ಒಳಪಟ್ಟಿರುತ್ತವೆ.'
      }
    },
    earlyDepartureRule: {
      en: {
        type: String,
        default: 'Early check-out or reduction in nights after check-in is generally non-refundable unless approved by the host in exceptional cases.'
      },
      kn: {
        type: String,
        default: 'ಚೆಕ್-ಇನ್ ನಂತರ ಬೇಗನೆ ನಿರ್ಗಮಿಸಿದರೆ ಅಥವಾ ರಾತ್ರಿಗಳನ್ನು ಕಡಿಮೆ ಮಾಡಿದರೆ ಸಾಮಾನ್ಯವಾಗಿ ಮರುಪಾವತಿ ಲಭ್ಯವಿರುವುದಿಲ್ಲ.'
      }
    },
    gatewayFeeNote: {
      en: {
        type: String,
        default: ''
      },
      kn: {
        type: String,
        default: ''
      }
    },
    policiesLastUpdated: {
      type: Date,
      default: Date.now
    },
    safetyFeatures: {
      firstAidKit: { type: Boolean, default: false },
      fireExtinguisher: { type: Boolean, default: false },
      cctvCommonAreas: { type: Boolean, default: false },
      outdoorLighting: { type: Boolean, default: false },
      secureParking: { type: Boolean, default: false },
      onSiteCaretaker: { type: Boolean, default: false }
    },
    roomsPageHeading: {
      type: String,
      default: 'Our Rooms'
    },
    roomsPageDescription: {
      type: String,
      default: 'Three room types, each with morning breakfast included. Choose the room that fits your group.'
    },
    aboutStoryText: {
      type: String,
      default: 'Welcome to Marichin Homestay, situated amidst lush coffee plantations in Chikkabettageri Village near Kushalnagar, Kodagu. Enjoy peaceful nature, morning estate walks, and cozy evening campfires.'
    },
    drivingDistances: [
      {
        city: String,
        place: String,
        distance: String,
        time: String,
        route: String
      }
    ],
    sampleDefaultsVerified: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    facilities: [
      {
        type: String,
        default: ['Morning breakfast', 'Wi-Fi', 'Parking Facility', 'Campfire', 'Indoor & Outdoor Games', 'Estate Walk']
      }
    ],
    heroImage: {
      type: String,
      default: '/images/realimage/homeimage.jpeg'
    },
    heroVideoUrl: {
      type: String,
      default: DEFAULT_HERO_BANNER.heroVideoUrl
    },
    heroPosterUrl: {
      type: String,
      default: DEFAULT_HERO_BANNER.heroPosterUrl
    },
    heroBadge: {
      en: { type: String, default: DEFAULT_HERO_BANNER.heroBadge.en },
      kn: { type: String, default: DEFAULT_HERO_BANNER.heroBadge.kn }
    },
    heroTitle: {
      en: { type: String, default: DEFAULT_HERO_BANNER.heroTitle.en },
      kn: { type: String, default: DEFAULT_HERO_BANNER.heroTitle.kn }
    },
    heroSubtitle: {
      en: { type: String, default: DEFAULT_HERO_BANNER.heroSubtitle.en },
      kn: { type: String, default: DEFAULT_HERO_BANNER.heroSubtitle.kn }
    },
    heroPrimaryLabel: {
      en: { type: String, default: DEFAULT_HERO_BANNER.heroPrimaryLabel.en },
      kn: { type: String, default: DEFAULT_HERO_BANNER.heroPrimaryLabel.kn }
    },
    heroSecondaryLabel: {
      en: { type: String, default: DEFAULT_HERO_BANNER.heroSecondaryLabel.en },
      kn: { type: String, default: DEFAULT_HERO_BANNER.heroSecondaryLabel.kn }
    },
    heroOverlay: {
      type: String,
      enum: HERO_OVERLAY_OPTIONS,
      default: DEFAULT_HERO_BANNER.heroOverlay
    },
    logoUrl: {
      type: String,
      default: '/images/logo.jpeg'
    },
    seoTitle: {
      type: String,
      default: 'Marichin Homestay | Authentic Plantation Sanctuary in Kushalnagar, Coorg'
    },
    seoDescription: {
      type: String,
      default: 'Experience coffee plantation living at Marichin Homestay near Kushalnagar, Coorg. Morning breakfast, campfires, estate walks & nature retreat.'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for compatibility with existing HOMESTAY_INFO
siteSettingsSchema.virtual('phone').get(function () {
  return this.phones && this.phones.length > 0 ? this.phones[0] : '+91 95912 09522';
});
siteSettingsSchema.virtual('altPhone').get(function () {
  return this.phones && this.phones.length > 1 ? this.phones[1] : '';
});
siteSettingsSchema.virtual('whatsapp').get(function () {
  return this.whatsappNumber;
});
siteSettingsSchema.virtual('name').get(function () {
  return this.propertyName;
});

export const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);


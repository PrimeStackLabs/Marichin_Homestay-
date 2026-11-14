/**
 * Static Fallback Policy Sections (Client)
 * Mirrors server/seed/policyDefaults.js for instant rendering before/without API response.
 * Marked as isSample: true draft content for owner review.
 */

export const DEFAULT_POLICY_SECTIONS = [
  // ===========================================================================
  // /policies — Homestay Policies & Terms (10 sections)
  // ===========================================================================
  {
    page: 'policies',
    key: 'booking-payment',
    icon: 'CreditCard',
    displayOrder: 1,
    isVisible: true,
    isSample: true,
    title: {
      en: 'Booking & Payment',
      kn: 'ಬುಕಿಂಗ್ ಮತ್ತು ಪಾವತಿ'
    },
    content: {
      en: [
        'Reservations for Standard Room, Suite Room, Single Room, or Full Home (all 5 rooms) can be booked directly through this website.',
        '- Once you proceed to payment, your selected dates are placed on a temporary 15-minute payment hold while you complete checkout.',
        '- Advance payments are processed online through Razorpay using the available advance percentages (such as 20%, 50%, or 100%).',
        '- Any remaining balance payable at the property is shown clearly on your digital booking pass and is settled at check-in.',
        '- A reservation is confirmed once the online advance payment is verified. Cancellation and refund terms follow the Refund & Cancellation Policy published on this website.'
      ].join('\n'),
      kn: [
        'ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕೊಠಡಿ, ಸೂಟ್ ಕೊಠಡಿ, ಸಿಂಗಲ್ ಕೊಠಡಿ ಅಥವಾ ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ (ಎಲ್ಲಾ 5 ಕೊಠಡಿಗಳು) ಕಾಯ್ದಿರಿಸುವಿಕೆಯನ್ನು ಈ ವೆಬ್‌ಸೈಟ್ ಮೂಲಕ ನೇರವಾಗಿ ಮಾಡಬಹುದು.',
        '- ನೀವು ಪಾವತಿ ಹಂತಕ್ಕೆ ಮುಂದುವರಿದಾಗ, ಪಾವತಿ ಪೂರ್ಣಗೊಳಿಸಲು ನಿಮ್ಮ ಆಯ್ದ ದಿನಾಂಕಗಳನ್ನು 15 ನಿಮಿಷಗಳ ತಾತ್ಕಾಲಿಕ ಕಾಯ್ದಿರಿಸುವಿಕೆಯಲ್ಲಿ ಇರಿಸಲಾಗುತ್ತದೆ.',
        '- ಆನ್‌ಲೈನ್ ಮುಂಗಡ ಪಾವತಿಗಳನ್ನು ಲಭ್ಯವಿರುವ ಮುಂಗಡ ಆಯ್ಕೆಗಳ (ಉದಾ. 20%, 50%, ಅಥವಾ 100%) ಮೂಲಕ ರೇಜರ್‌ಪೇ (Razorpay) ಮುಖಾಂತರ ಸುರಕ್ಷಿತವಾಗಿ ಸಂಸ್ಕರಿಸಲಾಗುತ್ತದೆ.',
        '- ಚೆಕ್-ಇನ್ ಸಮಯದಲ್ಲಿ ಪಾವತಿಸಬೇಕಾದ ಬಾಕಿ ಮೊತ್ತವನ್ನು ನಿಮ್ಮ ಡಿಜಿಟಲ್ ಬುಕಿಂಗ್ ಪಾಸ್‌ನಲ್ಲಿ ಸ್ಪಷ್ಟವಾಗಿ ತೋರಿಸಲಾಗಿರುತ್ತದೆ.',
        '- ಆನ್‌ಲೈನ್ ಮುಂಗಡ ಪಾವತಿ ದೃಢಪಟ್ಟ ನಂತರ ನಿಮ್ಮ ಬುಕಿಂಗ್ ಖಚಿತಗೊಳ್ಳುತ್ತದೆ. ರದ್ದತಿ ಮತ್ತು ಮರುಪಾವತಿ ನಿಯಮಗಳು ಈ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಪ್ರಕಟಿಸಲಾದ ಮರುಪಾವತಿ ಮತ್ತು ರದ್ದತಿ ನೀತಿಗೆ ಒಳಪಟ್ಟಿರುತ್ತವೆ.'
      ].join('\n')
    }
  },
  {
    page: 'policies',
    key: 'check-in-out',
    icon: 'Clock',
    displayOrder: 2,
    isVisible: true,
    isSample: true,
    title: {
      en: 'Check-In & Check-Out',
      kn: 'ಚೆಕ್-ಇನ್ ಮತ್ತು ಚೆಕ್-ಔಟ್'
    },
    content: {
      en: [
        'Standard check-in and check-out times are shown in the summary cards above and on your confirmed booking pass.',
        '- Please inform the host in advance if your arrival time is expected to be outside regular daytime arrival hours so check-in can be coordinated.',
        '- Requests for early check-in or late check-out are subject to room availability on that day and must be confirmed directly with the host beforehand.',
        '- Guests are requested to vacate rooms and settle any pending balance charges at or before the stated check-out time.'
      ].join('\n'),
      kn: [
        'ಪ್ರಮಾಣಿತ ಚೆಕ್-ಇನ್ ಮತ್ತು ಚೆಕ್-ಔಟ್ ಸಮಯಗಳನ್ನು ಮೇಲಿನ ಸಾರಾಂಶ ಕಾರ್ಡ್‌ಗಳಲ್ಲಿ ಮತ್ತು ನಿಮ್ಮ ದೃಢೀಕೃತ ಬುಕಿಂಗ್ ಪಾಸ್‌ನಲ್ಲಿ ತೋರಿಸಲಾಗಿದೆ.',
        '- ನಿಮ್ಮ ಆಗಮನವು ಸಾಮಾನ್ಯ ಹಗಲಿನ ವೇಳೆಗಿಂತ ಭಿನ್ನವಾಗಿದ್ದರೆ ದಯವಿಟ್ಟು ಮುಂಚಿತವಾಗಿ ಆತಿಥೇಯರಿಗೆ ತಿಳಿಸಿ.',
        '- ಬೇಗನೆ ಚೆಕ್-ಇನ್ ಅಥವಾ ತಡವಾಗಿ ಚೆಕ್-ಔಟ್ ಮಾಡುವ ವಿನಂತಿಗಳು ಆ ದಿನದ ಕೊಠಡಿ ಲಭ್ಯತೆಗೆ ಒಳಪಟ್ಟಿರುತ್ತವೆ ಮತ್ತು ಆತಿಥೇಯರ ಪೂರ್ವಾನುಮತಿಯನ್ನು ಅವಲಂಬಿಸಿರುತ್ತವೆ.',
        '- ನಿಗದಿತ ಚೆಕ್-ಔಟ್ ಸಮಯದೊಳಗೆ ಕೊಠಡಿಯನ್ನು ತೆರವುಗೊಳಿಸಿ ಬಾಕಿ ಮೊತ್ತವನ್ನು ಪಾವತಿಸಬೇಕೆಂದು ವಿನಂತಿಸಲಾಗಿದೆ.'
      ].join('\n')
    }
  },
  {
    page: 'policies',
    key: 'guest-id',
    icon: 'UserCheck',
    displayOrder: 3,
    isVisible: true,
    isSample: true,
    title: {
      en: 'Guest & ID Requirements',
      kn: 'ಅತಿಥಿ ಮತ್ತು ಗುರುತಿನ ಚೀಟಿ ನಿಯಮಗಳು'
    },
    content: {
      en: [
        'In accordance with local homestay registration rules, all adult guests must present an original, valid Government-issued Photo ID at the time of check-in.',
        '- Accepted Indian IDs include Aadhaar Card, Passport, Driving Licence, or Voter ID.',
        '- Foreign nationals are requested to carry a valid passport and visa for registration.',
        '- Check-in cannot be completed without valid identification for all adult guests in the booking.'
      ].join('\n'),
      kn: [
        'ಸ್ಥಳೀಯ ಹೋಂಸ್ಟೇ ನೋಂದಣಿ ನಿಯಮಗಳ ಪ್ರಕಾರ, ಎಲ್ಲಾ ವಯಸ್ಕ ಅತಿಥಿಗಳು ಚೆಕ್-ಇನ್ ಸಮಯದಲ್ಲಿ ಮಾನ್ಯವಾದ ಮೂಲ ಸರ್ಕಾರಿ ಫೋಟೋ ಗುರುತಿನ ಚೀಟಿಯನ್ನು ತೋರಿಸಬೇಕು.',
        '- ಭಾರತೀಯ ನಾಗರಿಕರಿಗೆ ಆಧಾರ್ ಕಾರ್ಡ್, ಪಾಸ್‌ಪೋರ್ಟ್, ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್ ಅಥವಾ ಮತದಾರರ ಗುರುತಿನ ಚೀಟಿ ಮಾನ್ಯವಾಗಿರುತ್ತದೆ.',
        '- ವಿದೇಶಿ ಅತಿಥಿಗಳು ನೋಂದಣಿಗಾಗಿ ಮಾನ್ಯವಾದ ಪಾಸ್‌ಪೋರ್ಟ್ ಮತ್ತು ವೀಸಾವನ್ನು ಹೊಂದಿರಬೇಕು.',
        '- ಎಲ್ಲಾ ವಯಸ್ಕ ಅತಿಥಿಗಳ ಮಾನ್ಯ ಗುರುತಿನ ಚೀಟಿ ಇಲ್ಲದೆ ಚೆಕ್-ಇನ್ ಪೂರ್ಣಗೊಳಿಸಲಾಗುವುದಿಲ್ಲ.'
      ].join('\n')
    }
  },
  {
    page: 'policies',
    key: 'house-rules',
    icon: 'Home',
    displayOrder: 4,
    isVisible: true,
    isSample: true,
    title: {
      en: 'House Rules (Quiet Hours, Smoking, Alcohol, Visitors, Pets, Campfire & Games)',
      kn: 'ಮನೆ ನಿಯಮಗಳು (ಶಾಂತ ಅವಧಿ, ಧೂಮಪಾನ, ಮದ್ಯಪಾನ, ಸಂದರ್ಶಕರು, ಸಾಕುಪ್ರಾಣಿಗಳು, ಕ್ಯಾಂಪ್‌ಫೈರ್ ಮತ್ತು ಆಟಗಳು)'
    },
    content: {
      en: [
        'We aim to maintain a peaceful and comfortable stay environment for all guests and nearby neighbours:',
        '- Quiet Hours: Guests are requested to keep music and outdoor conversations low during late evening and night hours so other guests and residents are not disturbed.',
        '- Smoking: Smoking is strictly prohibited inside bedrooms and enclosed indoor areas. If permitted by the host outdoors, please use designated areas and dispose of stubs safely.',
        '- Alcohol: Responsible consumption within private guest areas is permitted; disruptive behaviour will not be tolerated.',
        '- Visitors: Outside visitors who are not listed on the booking may enter the property only with prior permission from the host during daytime hours.',
        '- Pets: Please contact the host before booking to confirm whether pets can be accommodated for your selected stay dates and room.',
        '- Campfire & Games: Evening campfire and indoor/outdoor games are arranged during host-designated hours and subject to weather conditions and safe use.'
      ].join('\n'),
      kn: [
        'ಎಲ್ಲಾ ಅತಿಥಿಗಳು ಮತ್ತು ಸುತ್ತಮುತ್ತಲಿನ ನೆರೆಹೊರೆಯವರಿಗೆ ಶಾಂತಿಯುತ ಮತ್ತು ಆರಾಮದಾಯಕ ವಾತಾವರಣವನ್ನು ಕಾಪಾಡಿಕೊಳ್ಳಲು ನಾವು ಬಯಸುತ್ತೇವೆ:',
        '- ಶಾಂತ ಅವಧಿ: ರಾತ್ರಿ ವೇಳೆ ಇತರ ಅತಿಥಿಗಳು ಮತ್ತು ನಿವಾಸಿಗಳಿಗೆ ತೊಂದರೆಯಾಗದಂತೆ ಸಂಗೀತ ಮತ್ತು ಹೊರಾಂಗಣ ಶಬ್ದವನ್ನು ಕಡಿಮೆ ಇರಿಸಲು ವಿನಂತಿಸಲಾಗಿದೆ.',
        '- ಧೂಮಪಾನ: ಕೊಠಡಿಗಳು ಮತ್ತು ಒಳಾಂಗಣ ಪ್ರದೇಶಗಳಲ್ಲಿ ಧೂಮಪಾನವನ್ನು ಕಟ್ಟುನಿಟ್ಟಾಗಿ ನಿಷೇಧಿಸಲಾಗಿದೆ. ಹೊರಗೆ ಅನುಮತಿಸಿದ್ದರೆ ನಿಗದಿತ ಸ್ಥಳವನ್ನು ಬಳಸಿ ಸುರಕ್ಷಿತವಾಗಿ ವಿಲೇವಾರಿ ಮಾಡಿ.',
        '- ಮದ್ಯಪಾನ: ಅತಿಥಿಗಳ ಖಾಸಗಿ ಸ್ಥಳಗಳಲ್ಲಿ ಜವಾಬ್ದಾರಿಯುತವಾಗಿ ಸೇವಿಸಲು ಅನುಮತಿ ಇದೆ; ಇತರರಿಗೆ ತೊಂದರೆಯಾಗುವ ವರ್ತನೆಯನ್ನು ಸಹಿಸಲಾಗುವುದಿಲ್ಲ.',
        '- ಸಂದರ್ಶಕರು: ಬುಕಿಂಗ್‌ನಲ್ಲಿ ಹೆಸರಿಸದ ಹೊರಗಿನ ಸಂದರ್ಶಕರಿಗೆ ಆತಿಥೇಯರ ಪೂರ್ವಾನುಮತಿಯೊಂದಿಗೆ ಹಗಲಿನ ವೇಳೆಯಲ್ಲಿ ಮಾತ್ರ ಪ್ರವೇಶ ಇರುತ್ತದೆ.',
        '- ಸಾಕುಪ್ರಾಣಿಗಳು: ಸಾಕುಪ್ರಾಣಿಗಳನ್ನು ಕರೆತರುವ ಮುನ್ನ ಬುಕಿಂಗ್ ಮಾಡುವ ಮೊದಲೇ ಆತಿಥೇಯರನ್ನು ಸಂಪರ್ಕಿಸಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.',
        '- ಕ್ಯಾಂಪ್‌ಫೈರ್ ಮತ್ತು ಆಟಗಳು: ಸಂಜೆಯ ಕ್ಯಾಂಪ್‌ಫೈರ್ ಹಾಗೂ ಒಳಾಂಗಣ/ಹೊರಾಂಗಣ ಆಟಗಳು ಹವಾಮಾನ ಮತ್ತು ಸುರಕ್ಷತಾ ನಿಯಮಗಳಿಗೆ ಅನುಗುಣವಾಗಿ ನಿಗದಿತ ಸಮಯದಲ್ಲಿ ಲಭ್ಯವಿರುತ್ತವೆ.'
      ].join('\n')
    }
  },
  {
    page: 'policies',
    key: 'children-extra-guests',
    icon: 'Users',
    displayOrder: 5,
    isVisible: true,
    isSample: true,
    title: {
      en: 'Children & Extra Guests',
      kn: 'ಮಕ್ಕಳು ಮತ್ತು ಹೆಚ್ಚುವರಿ ಅತಿಥಿಗಳು'
    },
    content: {
      en: [
        'Please review guest limits before completing your booking so the appropriate room is reserved:',
        '- Standard Room accommodates up to 2 adults and 1 child.',
        '- Suite Room accommodates up to 2 adults and 2 children.',
        '- Single Room accommodates up to 2 adults.',
        '- Full Home bookings cover all 5 rooms together. Any guests beyond stated room capacity must be discussed with and approved by the host prior to arrival, and applicable extra-guest tariffs (if any) will apply.',
        '- Parents and guardians are responsible for supervising children on balconies, staircases, common grounds, and around campfire areas.'
      ].join('\n'),
      kn: [
        'ಸೂಕ್ತ ಕೊಠಡಿಯನ್ನು ಕಾಯ್ದಿರಿಸಲು ಬುಕಿಂಗ್ ಮಾಡುವ ಮೊದಲು ಅತಿಥಿಗಳ ಸಾಮರ್ಥ್ಯ ಮಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ:',
        '- ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕೊಠಡಿಯಲ್ಲಿ ಗರಿಷ್ಠ 2 ವಯಸ್ಕರು ಮತ್ತು 1 ಮಗು ತಂಗಬಹುದು.',
        '- ಸೂಟ್ ಕೊಠಡಿಯಲ್ಲಿ ಗರಿಷ್ಠ 2 ವಯಸ್ಕರು ಮತ್ತು 2 ಮಕ್ಕಳು ತಂಗಬಹುದು.',
        '- ಸಿಂಗಲ್ ಕೊಠಡಿಯಲ್ಲಿ ಗರಿಷ್ಠ 2 ವಯಸ್ಕರು ತಂಗಬಹುದು.',
        '- ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ ಬುಕಿಂಗ್ ಎಲ್ಲಾ 5 ಕೊಠಡಿಗಳನ್ನು ಒಳಗೊಂಡಿರುತ್ತದೆ. ನಿಗದಿತ ಮಿತಿಗಿಂತ ಹೆಚ್ಚಿನ ಅತಿಥಿಗಳು ಬರುವುದಾದರೆ ಆಗಮನಕ್ಕೆ ಮುನ್ನ ಆತಿಥೇಯರ ಅನುಮತಿ ಪಡೆಯಬೇಕು ಹಾಗೂ ಅನ್ವಯವಾಗುವ ಹೆಚ್ಚುವರಿ ಶುಲ್ಕಗಳು ಅನ್ವಯವಾಗುತ್ತವೆ.',
        '- ಬಾಲ್ಕನಿಗಳು, ಮೆಟ್ಟಿಲುಗಳು ಮತ್ತು ಕ್ಯಾಂಪ್‌ಫೈರ್ ಪ್ರದೇಶಗಳಲ್ಲಿ ಮಕ್ಕಳ ಸುರಕ್ಷತೆಗೆ ಪೋಷಕರು ಜವಾಬ್ದಾರರಾಗಿರುತ್ತಾರೆ.'
      ].join('\n')
    }
  },
  {
    page: 'policies',
    key: 'food-meals',
    icon: 'UtensilsCrossed',
    displayOrder: 6,
    isVisible: true,
    isSample: true,
    title: {
      en: 'Food & Meals',
      kn: 'ಆಹಾರ ಮತ್ತು ಭೋಜನ'
    },
    content: {
      en: [
        'Morning breakfast is included with Standard Room, Suite Room, Single Room, and Full Home bookings unless noted otherwise in a selected package.',
        '- Additional meals such as dinner are prepared fresh on request; guests are kindly asked to inform the host in advance with meal preferences and headcount.',
        '- Please notify the host ahead of your stay if anyone in your group has food allergies or specific dietary restrictions.'
      ].join('\n'),
      kn: [
        'ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕೊಠಡಿ, ಸೂಟ್ ಕೊಠಡಿ, ಸಿಂಗಲ್ ಕೊಠಡಿ ಮತ್ತು ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ ಬುಕಿಂಗ್‌ಗಳೊಂದಿಗೆ ಬೆಳಗಿನ ಉಪಹಾರವನ್ನು ಒಳಗೊಂಡಿರುತ್ತದೆ.',
        '- ರಾತ್ರಿಯ ಊಟದಂತಹ ಹೆಚ್ಚುವರಿ ಭೋಜನಗಳನ್ನು ಕೋರಿಕೆಯ ಮೇರೆಗೆ ತಾಜಾವಾಗಿ ತಯಾರಿಸಲಾಗುತ್ತದೆ; ದಯವಿಟ್ಟು ಮುಂಚಿತವಾಗಿ ನಿಮ್ಮ ಆದ್ಯತೆ ಮತ್ತು ಅತಿಥಿಗಳ ಸಂಖ್ಯೆಯನ್ನು ಆತಿಥೇಯರಿಗೆ ತಿಳಿಸಿ.',
        '- ನಿಮ್ಮ ಗುಂಪಿನಲ್ಲಿ ಯಾರಿಗಾದರೂ ಆಹಾರ ಅಲರ್ಜಿ ಅಥವಾ ವಿಶೇಷ ಆಹಾರ ಪಥ್ಯಗಳಿದ್ದರೆ ವಾಸ್ತವ್ಯಕ್ಕೆ ಮುನ್ನ ಆತಿಥೇಯರಿಗೆ ತಿಳಿಸಿ.'
      ].join('\n')
    }
  },
  {
    page: 'policies',
    key: 'damage-liability',
    icon: 'AlertTriangle',
    displayOrder: 7,
    isVisible: true,
    isSample: true,
    title: {
      en: 'Damage & Liability',
      kn: 'ಹಾನಿ ಮತ್ತು ಹೊಣೆಗಾರಿಕೆ'
    },
    content: {
      en: [
        'Guests are requested to take good care of rooms, furniture, linen, fixtures, and outdoor spaces throughout their stay.',
        '- Any accidental breakage or property damage should be reported promptly to the host; repair or replacement costs for damage beyond normal wear and tear may be billed to the guest.',
        '- Guests are responsible for their personal belongings and valuables; the homestay is not liable for loss or damage to unattended personal items or vehicles.'
      ].join('\n'),
      kn: [
        'ಅತಿಥಿಗಳು ತಮ್ಮ ವಾಸ್ತವ್ಯದ ಸಮಯದಲ್ಲಿ ಕೊಠಡಿಗಳು, ಪೀಠೋಪಕರಣಗಳು, ಬಟ್ಟೆಗಳು ಮತ್ತು ಹೊರಾಂಗಣ ಸ್ಥಳಗಳನ್ನು ಜಾಗರೂಕತೆಯಿಂದ ಬಳಸುವಂತೆ ವಿನಂತಿಸಲಾಗಿದೆ.',
        '- ಆಕಸ್ಮಿಕ ಹಾನಿ ಅಥವಾ ಒಡೆಯುವಿಕೆ ಸಂಭವಿಸಿದಲ್ಲಿ ತಕ್ಷಣ ಆತಿಥೇಯರಿಗೆ ತಿಳಿಸಬೇಕು; ಸಾಮಾನ್ಯ ಬಳಕೆಗಿಂತ ಹೆಚ್ಚಿನ ಹಾನಿಗೆ ದುರಸ್ತಿ ಅಥವಾ ಬದಲಾವಣೆ ವೆಚ್ಚವನ್ನು ಅತಿಥಿಗಳಿಂದ ಭರಿಸಬೇಕಾಗಬಹುದು.',
        '- ಅತಿಥಿಗಳು ತಮ್ಮ ವೈಯಕ್ತಿಕ ವಸ್ತುಗಳು ಮತ್ತು ಬೆಲೆಬಾಳುವ ವಸ್ತುಗಳಿಗೆ ತಾವೇ ಜವಾಬ್ದಾರರಾಗಿರುತ್ತಾರೆ.'
      ].join('\n')
    }
  },
  {
    page: 'policies',
    key: 'force-majeure',
    icon: 'CloudRain',
    displayOrder: 8,
    isVisible: true,
    isSample: true,
    title: {
      en: 'Force Majeure',
      kn: 'ಅನಿವಾರ್ಯ ಸಂದರ್ಭಗಳು (ಫೋರ್ಸ್ ಮೇಜ್ಯೂರ್)'
    },
    content: {
      en: [
        'Neither the host nor the guest shall be held liable for failure or delay in fulfilling a reservation caused by events reasonably beyond control, including severe weather, heavy rain, landslides, road closures, power or utility outages, public emergencies, or government advisories.',
        '- If such events prevent the homestay from hosting your stay safely on the booked dates, we will work with you either to reschedule to alternate available dates or process a refund in line with the host-cancellation rule in our Refund Policy.'
      ].join('\n'),
      kn: [
        'ಭಾರೀ ಮಳೆ, ಪ್ರತಿಕೂಲ ಹವಾಮಾನ, ಭೂಕುಸಿತ, ರಸ್ತೆ ಬಂದ್, ವಿದ್ಯುತ್ ಅಡಚಣೆ, ಸಾರ್ವಜನಿಕ ತುರ್ತು ಪರಿಸ್ಥಿತಿ ಅಥವಾ ಸರ್ಕಾರಿ ಆದೇಶಗಳಂತಹ ನಿಯಂತ್ರಣಕ್ಕೆ ಮೀರಿದ ಕಾರಣಗಳಿಂದ ಬುಕಿಂಗ್ ಪೂರೈಸಲು ಸಾಧ್ಯವಾಗದಿದ್ದರೆ ಆತಿಥೇಯರು ಅಥವಾ ಅತಿಥಿಗಳು ಹೊಣೆಗಾರರಾಗಿರುವುದಿಲ್ಲ.',
        '- ಇಂತಹ ಸಂದರ್ಭಗಳಲ್ಲಿ ನಿಮ್ಮ ವಾಸ್ತವ್ಯವನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ನಡೆಸಲು ಸಾಧ್ಯವಾಗದಿದ್ದರೆ, ಲಭ್ಯವಿರುವ ಬೇರೆ ದಿನಾಂಕಗಳಿಗೆ ಬದಲಾಯಿಸಲು ಅಥವಾ ನಮ್ಮ ಮರುಪಾವತಿ ನೀತಿಯ ಪ್ರಕಾರ ಮರುಪಾವತಿ ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ನಾವು ಸಹಕರಿಸುತ್ತೇವೆ.'
      ].join('\n')
    }
  },
  {
    page: 'policies',
    key: 'changes-to-terms',
    icon: 'RefreshCw',
    displayOrder: 9,
    isVisible: true,
    isSample: true,
    title: {
      en: 'Changes to These Terms',
      kn: 'ಈ ನಿಯಮಗಳಲ್ಲಿ ಬದಲಾವಣೆಗಳು'
    },
    content: {
      en: [
        'Marichin Homestay may update these policies and house rules from time to time to reflect operational updates or statutory requirements.',
        '- The "Last updated" date shown at the top of this page reflects the latest revision.',
        '- Confirmed bookings continue to be governed by the cancellation and booking rules shown at the time of reservation.'
      ].join('\n'),
      kn: [
        'ಕಾರ್ಯಾಚರಣೆಯ ನವೀಕರಣಗಳು ಅಥವಾ ಕಾನೂನುಬದ್ಧ ಅಗತ್ಯಗಳಿಗೆ ಅನುಗುಣವಾಗಿ ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇ ಈ ನಿಯಮಗಳನ್ನು ಕಾಲಕಾಲಕ್ಕೆ ನವೀಕರಿಸಬಹುದು.',
        '- ಈ ಪುಟದ ಮೇಲ್ಭಾಗದಲ್ಲಿ ತೋರಿಸಿರುವ "ಕೊನೆಯದಾಗಿ ನವೀಕರಿಸಿದ" ದಿನಾಂಕವು ಇತ್ತೀಚಿನ ಪರಿಷ್ಕರಣೆಯನ್ನು ಸೂಚಿಸುತ್ತದೆ.',
        '- ದೃಢೀಕೃತ ಬುಕಿಂಗ್‌ಗಳು ಬುಕಿಂಗ್ ಸಮಯದಲ್ಲಿ ಪ್ರದರ್ಶಿಸಲಾದ ರದ್ದತಿ ಮತ್ತು ಬುಕಿಂಗ್ ನಿಯಮಗಳಿಗೆ ಒಳಪಟ್ಟಿರುತ್ತವೆ.'
      ].join('\n')
    }
  },
  {
    page: 'policies',
    key: 'contact',
    icon: 'PhoneCall',
    displayOrder: 10,
    isVisible: true,
    isSample: true,
    title: {
      en: 'Contact',
      kn: 'ಸಂಪರ್ಕಿಸಿ'
    },
    content: {
      en: [
        'For questions regarding any homestay rule, arrival planning, or an existing reservation, please contact the host directly using the verified contact options listed in the "Questions? Contact us" strip below or on our Contact page.',
        '- Always include your Booking Code when reaching out about an active booking.'
      ].join('\n'),
      kn: [
        'ಯಾವುದೇ ಹೋಂಸ್ಟೇ ನಿಯಮ, ಆಗಮನದ ಯೋಜನೆ ಅಥವಾ ನಿಮ್ಮ ಬುಕಿಂಗ್ ಕುರಿತ ಪ್ರಶ್ನೆಗಳಿಗೆ ಕೆಳಗಿನ "ಪ್ರಶ್ನೆಗಳಿವೆಯೇ? ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ" ವಿಭಾಗದಲ್ಲಿ ಅಥವಾ ನಮ್ಮ ಸಂಪರ್ಕ ಪುಟದಲ್ಲಿ ನೀಡಿರುವ ಅಧಿಕೃತ ಸಂಪರ್ಕ ವಿವರಗಳ ಮೂಲಕ ಆತಿಥೇಯರನ್ನು ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಿ.',
        '- ದೃಢೀಕೃತ ಬುಕಿಂಗ್ ಕುರಿತು ಸಂಪರ್ಕಿಸುವಾಗ ದಯವಿಟ್ಟು ನಿಮ್ಮ ಬುಕಿಂಗ್ ಕೋಡ್ ಅನ್ನು ನಮೂದಿಸಿ.'
      ].join('\n')
    }
  },

  // ===========================================================================
  // /refund-policy — Editable Narrative Sections
  // ===========================================================================
  {
    page: 'refund',
    key: 'how-refunds-paid',
    icon: 'CreditCard',
    displayOrder: 1,
    isVisible: true,
    isSample: true,
    title: {
      en: 'How Refunds Are Paid',
      kn: 'ಮರುಪಾವತಿಯನ್ನು ಹೇಗೆ ಪಾವತಿಸಲಾಗುತ್ತದೆ'
    },
    content: {
      en: [
        'All approved refunds for online advance payments are processed directly back to the original payment method used at checkout through Razorpay (such as UPI, card, or net banking).',
        '- We do not issue online refunds in cash or to third-party accounts unless required due to a failed settlement.'
      ].join('\n'),
      kn: [
        'ಆನ್‌ಲೈನ್ ಮುಂಗಡ ಪಾವತಿಗಳಿಗಾಗಿ ಅನುಮೋದಿಸಲಾದ ಎಲ್ಲಾ ಮರುಪಾವತಿಗಳನ್ನು ರೇಜರ್‌ಪೇ (Razorpay) ಮೂಲಕ ಚೆಕ್‌ಔಟ್‌ನಲ್ಲಿ ಬಳಸಿದ ಮೂಲ ಪಾವತಿ ವಿಧಾನಕ್ಕೆ (UPI, ಕಾರ್ಡ್ ಅಥವಾ ನೆಟ್ ಬ್ಯಾಂಕಿಂಗ್) ನೇರವಾಗಿ ಹಿಂತಿರುಗಿಸಲಾಗುತ್ತದೆ.',
        '- ಆನ್‌ಲೈನ್ ಮರುಪಾವತಿಗಳನ್ನು ನಗದು ರೂಪದಲ್ಲಿ ಅಥವಾ ಮೂರನೇ ವ್ಯಕ್ತಿಯ ಖಾತೆಗಳಿಗೆ ನೀಡಲಾಗುವುದಿಲ್ಲ.'
      ].join('\n')
    }
  },
  {
    page: 'refund',
    key: 'what-is-non-refundable',
    icon: 'ShieldAlert',
    displayOrder: 2,
    isVisible: true,
    isSample: true,
    title: {
      en: 'Non-Refundable Portions & Fees',
      kn: 'ಮರುಪಾವತಿಸಲಾಗದ ಮೊತ್ತ ಮತ್ತು ಶುಲ್ಕಗಳು'
    },
    content: {
      en: [
        'Amounts forfeited under the applicable cancellation tier above, no-show charges, or unused nights from an early departure are non-refundable.',
        '- Where an optional gateway fee note applies, any non-recoverable payment gateway fee is noted clearly on this page.'
      ].join('\n'),
      kn: [
        'ಮೇಲಿನ ರದ್ದತಿ ನಿಯಮಗಳ ಅಡಿಯಲ್ಲಿ ಕಡಿತಗೊಳಿಸಲಾಗುವ ಮೊತ್ತ, ಹಾಜರಾಗದ ಶುಲ್ಕ ಅಥವಾ ಬೇಗ ನಿರ್ಗಮನದ ಬಳಕೆಯಾಗದ ರಾತ್ರಿಗಳ ಮೊತ್ತವು ಮರುಪಾವತಿಗೆ ಅರ್ಹವಾಗಿರುವುದಿಲ್ಲ.',
        '- ಪಾವತಿ ಗೇಟ್‌ವೇ ಶುಲ್ಕದ ಕುರಿತ ಯಾವುದೇ ಟಿಪ್ಪಣಿ ಅನ್ವಯವಾದರೆ ಅದನ್ನು ಈ ಪುಟದಲ್ಲಿ ಸ್ಪಷ್ಟವಾಗಿ ನಮೂದಿಸಲಾಗಿರುತ್ತದೆ.'
      ].join('\n')
    }
  },

  // ===========================================================================
  // /privacy — Privacy Policy (5 sections)
  // ===========================================================================
  {
    page: 'privacy',
    key: 'data-collected',
    icon: 'Database',
    displayOrder: 1,
    isVisible: true,
    isSample: true,
    title: {
      en: 'What Data We Collect',
      kn: 'ನಾವು ಸಂಗ್ರಹಿಸುವ ಮಾಹಿತಿ'
    },
    content: {
      en: [
        'When you enquire about a stay or complete a booking with Marichin Homestay, we collect only the information needed to handle your reservation:',
        '- Contact details: full name, phone number, and email address.',
        '- Booking details: selected room or Full Home option, check-in and check-out dates, guest count, special requests, and payment status/transaction reference.',
        '- Check-in identification: details from your government-issued photo ID collected upon arrival as required for homestay guest registers.',
        '- Reviews or enquiries you voluntarily submit through our website forms.'
      ].join('\n'),
      kn: [
        'ನೀವು ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇನಲ್ಲಿ ವಿಚಾರಣೆ ಮಾಡಿದಾಗ ಅಥವಾ ಬುಕಿಂಗ್ ಪೂರ್ಣಗೊಳಿಸಿದಾಗ, ನಿಮ್ಮ ಕಾಯ್ದಿರಿಸುವಿಕೆಯನ್ನು ನಿರ್ವಹಿಸಲು ಅಗತ್ಯವಿರುವ ಮಾಹಿತಿಯನ್ನು ಮಾತ್ರ ನಾವು ಸಂಗ್ರಹಿಸುತ್ತೇವೆ:',
        '- ಸಂಪರ್ಕ ವಿವರಗಳು: ಪೂರ್ಣ ಹೆಸರು, ಫೋನ್ ಸಂಖ್ಯೆ ಮತ್ತು ಇಮೇಲ್ ವಿಳಾಸ.',
        '- ಬುಕಿಂಗ್ ವಿವರಗಳು: ಆಯ್ಕೆ ಮಾಡಿದ ಕೊಠಡಿ ಅಥವಾ ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ, ಚೆಕ್-ಇನ್ ಮತ್ತು ಚೆಕ್-ಔಟ್ ದಿನಾಂಕಗಳು, ಅತಿಥಿಗಳ ಸಂಖ್ಯೆ, ವಿಶೇಷ ವಿನಂತಿಗಳು ಮತ್ತು ಪಾವತಿ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ.',
        '- ಚೆಕ್-ಇನ್ ಗುರುತಿನ ವಿವರಗಳು: ಸ್ಥಳೀಯ ಹೋಂಸ್ಟೇ ನೋಂದಣಿಗಾಗಿ ಆಗಮನದ ಸಮಯದಲ್ಲಿ ಪರಿಶೀಲಿಸುವ ಸರ್ಕಾರಿ ಫೋಟೋ ಗುರುತಿನ ಚೀಟಿಯ ವಿವರಗಳು.',
        '- ವೆಬ್‌ಸೈಟ್ ಫಾರ್ಮ್‌ಗಳ ಮೂಲಕ ನೀವು ಸ್ವಯಂಪ್ರೇರಿತವಾಗಿ ಸಲ್ಲಿಸುವ ವಿಮರ್ಶೆಗಳು ಅಥವಾ ವಿಚಾರಣೆಗಳು.'
      ].join('\n')
    }
  },
  {
    page: 'privacy',
    key: 'why-collected',
    icon: 'ShieldCheck',
    displayOrder: 2,
    isVisible: true,
    isSample: true,
    title: {
      en: 'Why We Collect Your Information',
      kn: 'ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ನಾವು ಏಕೆ ಸಂಗ್ರಹಿಸುತ್ತೇವೆ'
    },
    content: {
      en: [
        'Your personal details are used strictly for hospitality and booking operations:',
        '- Confirming reservations, issuing your digital check-in pass and QR reference, and communicating stay details.',
        '- Coordinating arrival timings, meals, date modifications, or refund requests.',
        '- Maintaining statutory guest check-in records and accounting documentation.',
        '- We do not sell, rent, or trade guest personal information to third-party marketers.'
      ].join('\n'),
      kn: [
        'ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ವಿವರಗಳನ್ನು ಆತಿಥ್ಯ ಮತ್ತು ಬುಕಿಂಗ್ ಸೇವೆಗಳಿಗಾಗಿ ಮಾತ್ರ ಬಳಸಲಾಗುತ್ತದೆ:',
        '- ಕಾಯ್ದಿರಿಸುವಿಕೆಯನ್ನು ದೃಢೀಕರಿಸಲು, ನಿಮ್ಮ ಡಿಜಿಟಲ್ ಚೆಕ್-ಇನ್ ಪಾಸ್ ನೀಡಲು ಮತ್ತು ವಾಸ್ತವ್ಯದ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಲು.',
        '- ಆಗಮನದ ಸಮಯ, ಭೋಜನ, ದಿನಾಂಕ ಬದಲಾವಣೆ ಅಥವಾ ಮರುಪಾವತಿ ವಿನಂತಿಗಳನ್ನು ಸಂಯೋಜಿಸಲು.',
        '- ಕಾನೂನುಬದ್ಧ ಅತಿಥಿ ದಾಖಲೆಗಳು ಮತ್ತು ಲೆಕ್ಕಪತ್ರ ದಾಖಲೆಗಳನ್ನು ನಿರ್ವಹಿಸಲು.',
        '- ನಾವು ಅತಿಥಿಗಳ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿಯನ್ನು ಮಾರಾಟ ಮಾಡುವುದಿಲ್ಲ ಅಥವಾ ಮೂರನೇ ವ್ಯಕ್ತಿಯ ಮಾರುಕಟ್ಟೆದಾರರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳುವುದಿಲ್ಲ.'
      ].join('\n')
    }
  },
  {
    page: 'privacy',
    key: 'processors',
    icon: 'Lock',
    displayOrder: 3,
    isVisible: true,
    isSample: true,
    title: {
      en: 'Who Processes Your Data',
      kn: 'ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ಯಾರು ಸಂಸ್ಕರಿಸುತ್ತಾರೆ'
    },
    content: {
      en: [
        'To operate our booking and communication workflows reliably, limited data is processed through trusted service providers:',
        '- Razorpay: processes online advance payments, payment verification, and refunds securely. Card or UPI credentials are entered directly on Razorpay checkout and are not stored by the homestay.',
        '- Email & Messaging Providers: your email address and phone number are used to send reservation confirmations, pass links, and updates via configured SMTP email and WhatsApp messaging channels.',
        '- Website Hosting & Database Infrastructure: stores booking records and enquiries required to manage your stay.'
      ].join('\n'),
      kn: [
        'ನಮ್ಮ ಬುಕಿಂಗ್ ಮತ್ತು ಸಂವಹನ ಸೇವೆಗಳನ್ನು ವಿಶ್ವಾಸಾರ್ಹವಾಗಿ ನಿರ್ವಹಿಸಲು, ಸೀಮಿತ ಮಾಹಿತಿಯನ್ನು ಸುರಕ್ಷಿತ ಸೇವಾ ಪೂರೈಕೆದಾರರ ಮೂಲಕ ಸಂಸ್ಕರಿಸಲಾಗುತ್ತದೆ:',
        '- ರೇಜರ್‌ಪೇ (Razorpay): ಆನ್‌ಲೈನ್ ಮುಂಗಡ ಪಾವತಿಗಳು ಮತ್ತು ಮರುಪಾವತಿಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಸಂಸ್ಕರಿಸುತ್ತದೆ. ಕಾರ್ಡ್ ಅಥವಾ UPI ವಿವರಗಳನ್ನು ಹೋಂಸ್ಟೇ ಸಂಗ್ರಹಿಸುವುದಿಲ್ಲ.',
        '- ಇಮೇಲ್ ಮತ್ತು ಮೆಸೇಜಿಂಗ್ ಪೂರೈಕೆದಾರರು: ಬುಕಿಂಗ್ ದೃಢೀಕರಣಗಳು, ಪಾಸ್ ಲಿಂಕ್‌ಗಳು ಮತ್ತು ನವೀಕರಣಗಳನ್ನು ಕಳುಹಿಸಲು ನಿಮ್ಮ ಇಮೇಲ್ ಮತ್ತು ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ಬಳಸಲಾಗುತ್ತದೆ.',
        '- ವೆಬ್‌ಸೈಟ್ ಹೋಸ್ಟಿಂಗ್ ಮತ್ತು ಡೇಟಾಬೇಸ್: ನಿಮ್ಮ ವಾಸ್ತವ್ಯವನ್ನು ನಿರ್ವಹಿಸಲು ಅಗತ್ಯವಿರುವ ಬುಕಿಂಗ್ ದಾಖಲೆಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಇರಿಸುತ್ತದೆ.'
      ].join('\n')
    }
  },
  {
    page: 'privacy',
    key: 'retention',
    icon: 'Clock',
    displayOrder: 4,
    isVisible: true,
    isSample: true,
    title: {
      en: 'How Long Data Is Kept',
      kn: 'ಮಾಹಿತಿಯನ್ನು ಎಷ್ಟು ಕಾಲ ಇರಿಸಲಾಗುತ್ತದೆ'
    },
    content: {
      en: [
        'We retain booking, payment reference, and check-in records only for as long as needed to deliver your stay, handle post-stay queries or refunds, and comply with applicable hospitality and tax/accounting record-keeping requirements.',
        '- General enquiries that do not convert to bookings may be removed periodically once resolved.'
      ].join('\n'),
      kn: [
        'ನಿಮ್ಮ ವಾಸ್ತವ್ಯದ ಸೇವೆಯನ್ನು ನೀಡಲು, ಮರುಪಾವತಿ ಅಥವಾ ವಾಸ್ತವ್ಯದ ನಂತರದ ಪ್ರಶ್ನೆಗಳನ್ನು ನಿರ್ವಹಿಸಲು ಮತ್ತು ಅನ್ವಯವಾಗುವ ಕಾನೂನು/ಲೆಕ್ಕಪತ್ರ ನಿಯಮಗಳನ್ನು ಪಾಲಿಸಲು ಅಗತ್ಯವಿರುವಷ್ಟು ಕಾಲ ಮಾತ್ರ ಬುಕಿಂಗ್ ಮತ್ತು ಪಾವತಿ ದಾಖಲೆಗಳನ್ನು ಉಳಿಸಿಕೊಳ್ಳಲಾಗುತ್ತದೆ.',
        '- ಬುಕಿಂಗ್ ಆಗದ ಸಾಮಾನ್ಯ ವಿಚಾರಣೆಗಳನ್ನು ಇತ್ಯರ್ಥವಾದ ನಂತರ ನಿಯತಕಾಲಿಕವಾಗಿ ಅಳಿಸಬಹುದು.'
      ].join('\n')
    }
  },
  {
    page: 'privacy',
    key: 'rights-deletion',
    icon: 'UserCheck',
    displayOrder: 5,
    isVisible: true,
    isSample: true,
    title: {
      en: 'Correction & Deletion Requests',
      kn: 'ತಿದ್ದುಪಡಿ ಮತ್ತು ಅಳಿಸುವಿಕೆ ವಿನಂತಿಗಳು'
    },
    content: {
      en: [
        'You may request access to, correction of, or deletion of your personal contact details stored with us (except where records must be retained by law for tax or guest registration compliance).',
        '- To make a privacy request, please contact the host using the verified email or phone details shown on this website and include your Booking Code or the email/phone used during booking.'
      ].join('\n'),
      kn: [
        'ನಮ್ಮಲ್ಲಿ ಸಂಗ್ರಹಿಸಿರುವ ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಸಂಪರ್ಕ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಲು, ತಿದ್ದುಪಡಿ ಮಾಡಲು ಅಥವಾ ಅಳಿಸಲು ನೀವು ವಿನಂತಿಸಬಹುದು (ತೆರಿಗೆ ಅಥವಾ ಅತಿಥಿ ನೋಂದಣಿ ನಿಯಮಗಳ ಅಡಿಯಲ್ಲಿ ಕಾನೂನುಬದ್ಧವಾಗಿ ಇರಿಸಿಕೊಳ್ಳಬೇಕಾದ ದಾಖಲೆಗಳನ್ನು ಹೊರತುಪಡಿಸಿ).',
        '- ಗೌಪ್ಯತಾ ವಿನಂತಿಗಾಗಿ, ಈ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ನೀಡಿರುವ ಅಧಿಕೃತ ಇಮೇಲ್ ಅಥವಾ ಫೋನ್ ಮೂಲಕ ಆತಿಥೇಯರನ್ನು ಸಂಪರ್ಕಿಸಿ ಮತ್ತು ನಿಮ್ಮ ಬುಕಿಂಗ್ ಕೋಡ್ ಅಥವಾ ಬಳಸಿದ ಇಮೇಲ್/ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ತಿಳಿಸಿ.'
      ].join('\n')
    }
  }
];


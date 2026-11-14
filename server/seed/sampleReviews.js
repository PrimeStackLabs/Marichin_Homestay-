/**
 * Canonical sample guest reviews for Marichin Homestay.
 * 4 approved sample reviews (displayed publicly on Home & /reviews)
 * + 1 pending sample review (visible in Admin -> Reviews -> Pending to test Approve/Hide/Delete).
 * Keep copy factual and aligned with confirmed homestay rooms and amenities.
 */
export const SAMPLE_REVIEWS = [
  {
    guestName: 'Ananya & Karthik Rao',
    location: 'Bengaluru, Karnataka',
    rating: 5,
    stayedIn: 'Suite Room',
    stayDate: 'Oct 2026',
    text: 'We stayed in the Suite Room with our kids and loved waking up to fresh greenery right outside the balcony. The room was spacious and spotless, the morning breakfast was comforting, and the estate walk was the calmest part of our weekend.',
    avatar: '',
    status: 'approved',
    createdAt: new Date('2026-10-18T09:30:00.000Z')
  },
  {
    guestName: 'Prashanth Nair',
    location: 'Mysuru, Karnataka',
    rating: 5,
    stayedIn: 'Standard Room',
    stayDate: 'Oct 2026',
    text: 'Peaceful stay amidst coffee plantations near Kushalnagar. Our balcony-facing Standard Room was well maintained with reliable Wi-Fi and convenient parking. Evening campfire time and warm host hospitality made the trip memorable.',
    avatar: '',
    status: 'approved',
    createdAt: new Date('2026-10-10T11:15:00.000Z')
  },
  {
    guestName: 'Deepak Sharma & Family',
    location: 'Hyderabad, Telangana',
    rating: 5,
    stayedIn: 'Full Home (all 5 rooms)',
    stayDate: 'Sep 2026',
    text: 'Booked all 5 rooms for an extended family gathering. Having the entire homestay gave our group great privacy. Everyone enjoyed the morning breakfast, indoor and outdoor games, and relaxed conversations by the campfire.',
    avatar: '',
    status: 'approved',
    createdAt: new Date('2026-09-26T14:20:00.000Z')
  },
  {
    guestName: 'Meera Krishnan',
    location: 'Chennai, Tamil Nadu',
    rating: 4,
    stayedIn: 'Single Room',
    stayDate: 'Sep 2026',
    text: 'Simple, clean, and quiet accommodation for two. The homestay is tucked in a calm coffee-growing village a short drive from Kushalnagar. Warm breakfast before heading out for sightseeing was a lovely touch.',
    avatar: '',
    status: 'approved',
    createdAt: new Date('2026-09-14T08:45:00.000Z')
  },
  {
    guestName: 'Rohan Deshmukh',
    location: 'Pune, Maharashtra',
    rating: 5,
    stayedIn: 'Standard Room',
    stayDate: 'Oct 2026',
    text: 'Quiet surroundings away from busy town traffic, clean rooms with balcony seating, and attentive hosts throughout our two-night stay. Looking forward to visiting again.',
    avatar: '',
    status: 'pending',
    createdAt: new Date('2026-10-22T10:00:00.000Z')
  }
];


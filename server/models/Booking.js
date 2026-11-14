import mongoose from 'mongoose';
import crypto from 'crypto';

const bookingPricingSchema = new mongoose.Schema(
  {
    baseAmount: {
      type: Number,
      required: true,
      min: 0
    },
    extraGuestCharge: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    who: {
      type: String,
      default: 'system'
    },
    when: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const guestCountSchema = new mongoose.Schema(
  {
    adults: {
      type: Number,
      default: 2,
      min: 1
    },
    children: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: false }
);

const bookingLineSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    roomName: {
      type: String,
      required: true
    },
    roomSlug: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const refundSchema = new mongoose.Schema(
  {
    refundId: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    amountPaise: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      default: 'processed'
    },
    reason: {
      type: String,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    passToken: {
      type: String,
      trim: true
    },
    bookingType: {
      type: String,
      enum: ['room', 'full_home'],
      default: 'room'
    },
    // Room reference (Required for room bookings, optional for full_home)
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: function () {
        return this.bookingType !== 'full_home';
      }
    },
    roomName: {
      type: String,
      required: true,
      default: ''
    },
    roomSlug: {
      type: String,
      required: true,
      default: ''
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      default: 1,
      validate: {
        validator: function (v) {
          if (this.bookingType === 'full_home') return v >= 1;
          return v === 1;
        },
        message: 'Room bookings must have quantity 1.'
      }
    },
    // One line per room type with quantity equal to that type's totalUnits for full_home,
    // or one line with quantity 1 for single room bookings.
    lines: [bookingLineSchema],
    guestName: {
      type: String,
      required: [true, 'Guest name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true
    },
    checkIn: {
      type: Date,
      required: [true, 'Check-in date is required']
    },
    checkOut: {
      type: Date,
      required: [true, 'Check-out date is required']
    },
    // Array of plain calendar day strings (YYYY-MM-DD, the nights occupied)
    nights: [
      {
        type: String,
        match: [/^\d{4}-\d{2}-\d{2}$/, 'Night date must be in YYYY-MM-DD format']
      }
    ],
    guestCount: {
      type: guestCountSchema,
      default: () => ({ adults: 2, children: 0 })
    },
    adults: {
      type: Number,
      default: 2,
      min: 1
    },
    children: {
      type: Number,
      default: 0,
      min: 0
    },
    specialRequests: {
      type: String,
      trim: true,
      default: 'None'
    },
    pricing: {
      type: bookingPricingSchema,
      required: true
    },
    advanceOption: {
      type: Number,
      enum: [20, 50, 100],
      default: 20
    },
    advancePaid: {
      type: Number,
      required: true,
      min: 0
    },
    balanceDue: {
      type: Number,
      required: true,
      min: 0
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded', 'failed'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      default: 'UPI'
    },
    transactionId: {
      type: String,
      default: ''
    },
    razorpayOrderId: {
      type: String,
      default: '',
      index: true
    },
    razorpayPaymentId: {
      type: String,
      default: '',
      index: true
    },
    razorpaySignature: {
      type: String,
      default: ''
    },
    razorpayPaymentMethod: {
      type: String,
      default: ''
    },
    amountPaidPaise: {
      type: Number,
      default: 0
    },
    paidAt: {
      type: Date,
      default: null
    },
    refunds: [refundSchema],
    status: {
      type: String,
      enum: [
        'payment_pending',
        'paid_awaiting_confirmation',
        'confirmed',
        'rejected',
        'cancelled',
        'expired',
        'checked_in',
        'checked_out'
      ],
      default: 'payment_pending'
    },
    holdExpiresAt: {
      type: Date,
      default: null
    },
    statusHistory: [statusHistorySchema],
    promoCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
    },
    source: {
      type: String,
      enum: ['website', 'admin', 'whatsapp', 'phone'],
      default: 'website'
    },
    adminNotes: {
      type: String,
      default: ''
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    dateChangeRequested: {
      type: Boolean,
      default: false,
      index: true
    },
    dateChangeReason: {
      type: String,
      default: ''
    },
    dateChangeRequestedAt: {
      type: Date,
      default: null
    },
    refundDue: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Pre-save hook to sync guestCount, adults, children, and legacy status strings
bookingSchema.pre('save', function (next) {
  // Ensure unguessable pass token exists
  if (!this.passToken) {
    this.passToken = crypto.randomBytes(24).toString('hex');
  }

  // Ensure quantity is strictly 1 for room bookings
  if (this.bookingType === 'room') {
    this.quantity = 1;
  }

  // Default roomName and roomSlug for full_home
  if (this.bookingType === 'full_home') {
    if (!this.roomName) this.roomName = 'Full Home (All 5 Rooms)';
    if (!this.roomSlug) this.roomSlug = 'full-home';
  }

  // Sync guestCount with adults/children
  if (this.guestCount) {
    if (this.adults === undefined || this.adults === null) this.adults = this.guestCount.adults || 2;
    if (this.children === undefined || this.children === null) this.children = this.guestCount.children || 0;
  } else {
    this.guestCount = {
      adults: this.adults || 2,
      children: this.children || 0
    };
  }

  // Map legacy status strings if any
  const statusMap = {
    pending: 'payment_pending',
    Pending: 'payment_pending',
    Confirmed: 'confirmed',
    Cancelled: 'cancelled',
    Rejected: 'rejected',
    Expired: 'expired'
  };
  if (statusMap[this.status]) {
    this.status = statusMap[this.status];
  }

  next();
});

// Indexes for fast lookup and collision-proof checking
bookingSchema.index({ nights: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ holdExpiresAt: 1 });
bookingSchema.index({ checkIn: 1, checkOut: 1 });
bookingSchema.index({ room: 1 });
bookingSchema.index({ bookingType: 1 });
bookingSchema.index({ email: 1 });
bookingSchema.index({ phone: 1 });
bookingSchema.index({ passToken: 1 }, { unique: true, sparse: true });

bookingSchema.virtual('id').get(function () {
  return this.bookingCode || this._id.toString();
});
bookingSchema.virtual('nightsCount').get(function () {
  return Array.isArray(this.nights) ? this.nights.length : 1;
});
bookingSchema.virtual('totalAmount').get(function () {
  return this.pricing?.total || 0;
});
bookingSchema.virtual('baseTotal').get(function () {
  return this.pricing?.baseAmount || 0;
});
bookingSchema.virtual('gstTax').get(function () {
  return this.pricing?.taxAmount || 0;
});
bookingSchema.virtual('discount').get(function () {
  return this.pricing?.discount || 0;
});

// Virtual compatibility for rooms reader
bookingSchema.virtual('rooms').get(function () {
  if (this.lines && this.lines.length > 0) {
    return this.lines;
  }
  return [
    {
      room: this.room,
      roomName: this.roomName,
      roomSlug: this.roomSlug,
      quantity: this.quantity || 1,
      pricePerNight: this.pricePerNight
    }
  ];
});

export const Booking = mongoose.model('Booking', bookingSchema);

import mongoose from 'mongoose';

const roomImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    maxAdults: {
      type: Number,
      default: 2,
      min: 1
    },
    maxChildren: {
      type: Number,
      default: 1,
      min: 0
    },
    maxGuests: {
      type: Number,
      required: true,
      default: 2,
      min: 1
    },
    sizeSqft: {
      type: Number,
      default: null
    },
    bedLayout: {
      type: String,
      default: ''
    },
    view: {
      type: String,
      default: ''
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Price per night is required'],
      min: 0
    },
    weekendPrice: {
      type: Number,
      min: 0
    },
    amenities: [
      {
        type: String,
        trim: true
      }
    ],
    image: {
      type: String,
      default: ''
    },
    images: [roomImageSchema],
    isActive: {
      type: Boolean,
      default: true
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    totalUnits: {
      type: Number,
      default: 1,
      min: 1
    },
    hasBalcony: {
      type: Boolean,
      default: true
    },
    mealsIncluded: {
      type: String,
      default: 'Morning breakfast'
    },
    tag: {
      type: String,
      default: ''
    },
    isRealPhoto: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

roomSchema.index({ isActive: 1 });
roomSchema.index({ displayOrder: 1 });

// Ensure image string and images array stay in sync
roomSchema.pre('save', function (next) {
  if (this.image && (!this.images || this.images.length === 0)) {
    this.images = [{ url: this.image, alt: this.name || 'Room Photo' }];
    this.isRealPhoto = true;
  } else if (Array.isArray(this.images) && this.images.length > 0 && !this.image) {
    this.image = typeof this.images[0] === 'string' ? this.images[0] : (this.images[0].url || '');
  }
  next();
});

// Virtual compatibility fields for frontend
roomSchema.virtual('id').get(function () {
  return this.slug || this._id.toString();
});
roomSchema.virtual('price').get(function () {
  return this.pricePerNight;
});
roomSchema.virtual('capacity').get(function () {
  return this.maxGuests;
});
roomSchema.virtual('bed').get(function () {
  return this.bedLayout || '';
});
roomSchema.virtual('size').get(function () {
  return (this.sizeSqft && this.sizeSqft > 0) ? `${this.sizeSqft} sq.ft` : '';
});

export const Room = mongoose.model('Room', roomSchema);

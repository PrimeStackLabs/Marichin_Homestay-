import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Package title is required'],
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    inclusions: [
      {
        type: String,
        trim: true
      }
    ],
    durationLabel: {
      type: String,
      default: '2 Nights / 3 Days'
    },
    regularPrice: {
      type: Number,
      default: null,
      min: 0
    },
    offerPrice: {
      type: Number,
      default: null,
      min: 0
    },
    price: {
      type: Number,
      default: null,
      min: 0,
      get: function (val) {
        if (val !== null && val !== undefined) return val;
        return this.offerPrice ?? null;
      }
    },
    discount: {
      type: String,
      default: null
    },
    isSample: {
      type: Boolean,
      default: false
    },
    idealFor: {
      type: String,
      default: 'Couples & Families'
    },
    image: {
      type: String,
      default: '/images/realimage/real1.jpeg'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    tag: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
  }
);

packageSchema.index({ isActive: 1 });
packageSchema.index({ displayOrder: 1 });

packageSchema.pre('save', function (next) {
  if (this.price === null || this.price === undefined) {
    if (this.offerPrice !== null && this.offerPrice !== undefined) {
      this.price = this.offerPrice;
    }
  }
  if (this.offerPrice === null || this.offerPrice === undefined) {
    if (this.price !== null && this.price !== undefined) {
      this.offerPrice = this.price;
    }
  }
  next();
});

packageSchema.virtual('id').get(function () {
  return this.slug || this._id.toString();
});
packageSchema.virtual('name').get(function () {
  return this.title;
});
packageSchema.virtual('features').get(function () {
  return this.inclusions;
});
packageSchema.virtual('originalPrice').get(function () {
  return this.regularPrice;
});
packageSchema.virtual('duration').get(function () {
  return this.durationLabel;
});

export const Package = mongoose.model('Package', packageSchema);

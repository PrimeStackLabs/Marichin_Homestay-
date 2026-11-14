import mongoose from 'mongoose';

const promoSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Promo code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['percent', 'flat'],
      default: 'percent'
    },
    value: {
      type: Number,
      required: [true, 'Promo value is required'],
      min: 0
    },
    minNights: {
      type: Number,
      default: 1,
      min: 1
    },
    validFrom: {
      type: Date,
      default: Date.now
    },
    validTo: {
      type: Date
    },
    usageLimit: {
      type: Number,
      default: null
    },
    usedCount: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

promoSchema.index({ isActive: 1 });

promoSchema.virtual('discountPercent').get(function () {
  return this.type === 'percent' ? this.value : 0;
});
promoSchema.virtual('discountAmount').get(function () {
  return this.type === 'flat' ? this.value : 0;
});

export const Promo = mongoose.model('Promo', promoSchema);

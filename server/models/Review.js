import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    guestName: {
      type: String,
      required: [true, 'Guest name is required'],
      trim: true
    },
    location: {
      type: String,
      default: 'Karnataka, India',
      trim: true
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
      default: 5
    },
    text: {
      type: String,
      required: [true, 'Review text is required'],
      trim: true
    },
    stayDate: {
      type: String,
      default: ''
    },
    stayedIn: {
      type: String,
      default: 'Standard Room'
    },
    avatar: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'hidden'],
      default: 'pending'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index({ status: 1 });
reviewSchema.index({ createdAt: -1 });

reviewSchema.virtual('id').get(function () {
  return this._id.toString();
});
reviewSchema.virtual('city').get(function () {
  return this.location;
});
reviewSchema.virtual('review').get(function () {
  return this.text;
});
reviewSchema.virtual('verified').get(function () {
  return this.status === 'approved';
});
reviewSchema.virtual('date').get(function () {
  return this.stayDate || (this.createdAt ? new Date(this.createdAt).toLocaleDateString() : 'Recent');
});

export const Review = mongoose.model('Review', reviewSchema);


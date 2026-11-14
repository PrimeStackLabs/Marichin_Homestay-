import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Experience title is required'],
      trim: true
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      default: ''
    },
    season: {
      type: String,
      default: ''
    },
    durationLabel: {
      type: String,
      default: ''
    },
    distanceLabel: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: '/images/realimage/real5.jpeg'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    inclusions: [
      {
        type: String,
        trim: true
      }
    ],
    badge: {
      type: String,
      default: ''
    },
    timing: {
      type: String,
      default: ''
    },
    highlights: [
      {
        type: String,
        trim: true
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

experienceSchema.index({ isActive: 1 });
experienceSchema.index({ displayOrder: 1 });

experienceSchema.virtual('id').get(function () {
  return this.slug || this._id.toString();
});
experienceSchema.virtual('duration').get(function () {
  return this.durationLabel;
});
experienceSchema.virtual('distance').get(function () {
  return this.distanceLabel;
});

export const Experience = mongoose.model('Experience', experienceSchema);


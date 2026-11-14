import mongoose from 'mongoose';

const galleryImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true
    },
    alt: {
      type: String,
      default: 'Marichin Homestay Gallery'
    },
    category: {
      type: String,
      enum: ['estate', 'rooms', 'dining', 'guests', 'cottages', 'nights', 'nature'],
      default: 'estate'
    },
    title: {
      type: String,
      default: ''
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    isVisible: {
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

galleryImageSchema.index({ category: 1 });
galleryImageSchema.index({ isVisible: 1 });
galleryImageSchema.index({ displayOrder: 1 });

galleryImageSchema.virtual('id').get(function () {
  return this._id.toString();
});
galleryImageSchema.virtual('src').get(function () {
  return this.url;
});

export const GalleryImage = mongoose.model('GalleryImage', galleryImageSchema);


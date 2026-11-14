import mongoose from 'mongoose';

const policySectionSchema = new mongoose.Schema(
  {
    page: {
      type: String,
      enum: ['policies', 'refund', 'privacy'],
      required: [true, 'Policy page identifier is required'],
      index: true
    },
    key: {
      type: String,
      required: [true, 'Section key is required'],
      trim: true
    },
    title: {
      en: {
        type: String,
        required: [true, 'English section heading is required'],
        trim: true
      },
      kn: {
        type: String,
        default: '',
        trim: true
      }
    },
    content: {
      en: {
        type: String,
        required: [true, 'English section content is required'],
        trim: true
      },
      kn: {
        type: String,
        default: '',
        trim: true
      }
    },
    icon: {
      type: String,
      default: 'FileText',
      trim: true
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    isVisible: {
      type: Boolean,
      default: true
    },
    isSample: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

policySectionSchema.index({ page: 1, key: 1 }, { unique: true });
policySectionSchema.index({ page: 1, displayOrder: 1, createdAt: 1 });

export const PolicySection = mongoose.model('PolicySection', policySectionSchema);


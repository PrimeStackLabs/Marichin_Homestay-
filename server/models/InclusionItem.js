import mongoose from 'mongoose';

const inclusionItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['include', 'exclude'],
      required: [true, 'Inclusion item type (include/exclude) is required'],
      index: true
    },
    title: {
      en: {
        type: String,
        required: [true, 'English title is required'],
        trim: true
      },
      kn: {
        type: String,
        default: '',
        trim: true
      }
    },
    note: {
      en: {
        type: String,
        default: '',
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
      default: 'CheckCircle2',
      trim: true
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    isActive: {
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

inclusionItemSchema.index({ type: 1, displayOrder: 1, createdAt: 1 });

export const InclusionItem = mongoose.model('InclusionItem', inclusionItemSchema);


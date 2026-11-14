import mongoose from 'mongoose';

const safetyContactSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['hospital', 'police', 'pharmacy', 'other'],
      default: 'hospital',
      index: true
    },
    name: {
      en: {
        type: String,
        required: [true, 'Contact name is required'],
        trim: true
      },
      kn: {
        type: String,
        default: '',
        trim: true
      }
    },
    phone: {
      type: String,
      default: '',
      trim: true
    },
    distance: {
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
    notes: {
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
    timestamps: true
  }
);

safetyContactSchema.index({ displayOrder: 1, createdAt: 1 });

export const SafetyContact = mongoose.model('SafetyContact', safetyContactSchema);


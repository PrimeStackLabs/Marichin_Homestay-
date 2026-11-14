import mongoose from 'mongoose';

const localizedStringSchema = new mongoose.Schema(
  {
    en: { type: String, default: '' },
    kn: { type: String, default: '' }
  },
  { _id: false }
);

const timingItemSchema = new mongoose.Schema(
  {
    meal: localizedStringSchema,
    time: localizedStringSchema,
    included: localizedStringSchema,
    displayOrder: { type: Number, default: 0 }
  },
  { _id: true }
);

const diningContentSchema = new mongoose.Schema(
  {
    hero: {
      badge: localizedStringSchema,
      title: localizedStringSchema,
      description: localizedStringSchema,
      tags: [localizedStringSchema]
    },
    timings: {
      heading: localizedStringSchema,
      subtitle: localizedStringSchema,
      description: localizedStringSchema,
      items: [timingItemSchema]
    },
    auxiliaryKitchen: {
      badge: localizedStringSchema,
      heading: localizedStringSchema,
      text: localizedStringSchema,
      buttonLabel: localizedStringSchema
    },
    menuSection: {
      badge: localizedStringSchema,
      heading: localizedStringSchema,
      description: localizedStringSchema
    }
  },
  {
    timestamps: true
  }
);

export const DiningContent = mongoose.model('DiningContent', diningContentSchema);


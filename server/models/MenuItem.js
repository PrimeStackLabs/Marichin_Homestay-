import mongoose from 'mongoose';

const menuCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true
    },
    nameKn: {
      type: String,
      default: '',
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    subtitle: {
      type: String,
      default: ''
    },
    subtitleKn: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    descriptionKn: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: 'CookingPot'
    },
    displayOrder: {
      type: Number,
      default: 0
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

menuCategorySchema.virtual('id').get(function () {
  return this.slug || this._id.toString();
});
menuCategorySchema.virtual('category').get(function () {
  return this.name;
});

const menuItemSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Category slug or name is required'],
      trim: true
    },
    categoryRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuCategory'
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true
    },
    nameKn: {
      type: String,
      default: '',
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    descriptionKn: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      default: null,
      min: 0
    },
    isIllustrative: {
      type: Boolean,
      default: true
    },
    isVeg: {
      type: Boolean,
      default: true
    },
    badge: {
      type: String,
      default: ''
    },
    badgeKn: {
      type: String,
      default: ''
    },
    alias: {
      type: String,
      default: ''
    },
    aliasKn: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    displayOrder: {
      type: Number,
      default: 0
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

menuItemSchema.index({ category: 1 });
menuItemSchema.index({ isActive: 1 });
menuItemSchema.index({ displayOrder: 1 });

menuItemSchema.virtual('id').get(function () {
  return this._id.toString();
});
menuItemSchema.virtual('desc').get(function () {
  return this.description;
});
menuItemSchema.virtual('tag').get(function () {
  return this.badge;
});
menuItemSchema.virtual('nonVeg').get(function () {
  return !this.isVeg;
});

export const MenuCategory = mongoose.model('MenuCategory', menuCategorySchema);
export const MenuItem = mongoose.model('MenuItem', menuItemSchema);


import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: {
      type: String,
      default: 'System / Admin'
    },
    userRole: {
      type: String,
      default: 'admin'
    },
    action: {
      type: String,
      required: true
    },
    entityType: {
      type: String,
      required: true,
      enum: ['Booking', 'Room', 'SiteSettings', 'Promo', 'Review', 'Enquiry', 'MenuItem', 'MenuCategory', 'DiningContent', 'Package', 'Experience', 'Gallery', 'User', 'InclusionItem']
    },
    entityId: {
      type: String,
      default: ''
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

activityLogSchema.index({ entityType: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);


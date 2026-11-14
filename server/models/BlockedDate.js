import mongoose from 'mongoose';

const blockedDateSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.Mixed, // ObjectId string or "all"
      required: true,
      default: 'all'
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      default: 'Maintenance or personal hold',
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

blockedDateSchema.index({ room: 1, startDate: 1, endDate: 1 });

// Helper virtuals for frontend compatibility
blockedDateSchema.virtual('id').get(function () {
  return this._id.toString();
});
blockedDateSchema.virtual('roomId').get(function () {
  return this.room;
});
blockedDateSchema.virtual('date').get(function () {
  return this.startDate ? this.startDate.toISOString().split('T')[0] : '';
});

export const BlockedDate = mongoose.model('BlockedDate', blockedDateSchema);


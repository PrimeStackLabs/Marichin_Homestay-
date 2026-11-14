import mongoose from 'mongoose';

const roomNightSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room reference is required'],
      index: true
    },
    date: {
      type: String,
      required: [true, 'Calendar night date string (YYYY-MM-DD) is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be a plain calendar day in YYYY-MM-DD format'],
      index: true
    },
    booked: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Booked unit count cannot be negative']
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound unique index ensuring one record per room per calendar night
roomNightSchema.index({ room: 1, date: 1 }, { unique: true });

export const RoomNight = mongoose.model('RoomNight', roomNightSchema);


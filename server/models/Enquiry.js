import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new'
    },
    adminNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

enquirySchema.index({ status: 1 });
enquirySchema.index({ createdAt: -1 });

enquirySchema.virtual('id').get(function () {
  return this._id.toString();
});
enquirySchema.virtual('date').get(function () {
  return this.createdAt ? this.createdAt.toISOString().split('T')[0] : '';
});

export const Enquiry = mongoose.model('Enquiry', enquirySchema);


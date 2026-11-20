import mongoose from 'mongoose';

const blessingSchema = new mongoose.Schema(
  {
    guestName: {
      type: String,
      required: [true, 'Guest name is required.'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters.']
    },
    firstName: {
      type: String,
      trim: true,
      default: ''
    },
    lastName: {
      type: String,
      trim: true,
      default: ''
    },
    message: {
      type: String,
      required: [true, 'Blessing message is required.'],
      trim: true,
      maxlength: [500, 'Blessing message cannot exceed 500 characters.']
    },
    rsvpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rsvp',
      default: null,
      index: true
    },
    submissionId: {
      type: String,
      sparse: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

blessingSchema.index({ createdAt: -1 });

export const Blessing = mongoose.model('Blessing', blessingSchema, 'blessings');


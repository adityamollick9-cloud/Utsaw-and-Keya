import mongoose from 'mongoose';

const rsvpSchema = new mongoose.Schema(
  {
    submissionId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true
    },
    firstName: {
      type: String,
      required: [true, 'First name is required.'],
      trim: true,
      maxlength: [100, 'First name cannot exceed 100 characters.']
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Last name cannot exceed 100 characters.']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      match: [
        /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email address.'
      ]
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      maxlength: [30, 'Phone number cannot exceed 30 characters.']
    },
    attending: {
      type: String,
      enum: {
        values: ['yes', 'no'],
        message: 'Attendance must be either "yes" or "no".'
      },
      required: [true, 'Please indicate whether you are attending.'],
      index: true
    },
    events: {
      type: [String],
      default: [],
      enum: [
        'haldi-ceremony',
        'haldi-night-dinner',
        'holy-matrimony',
        'wedding-dinner',
        'farewell'
      ]
    },
    blessing: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Blessing cannot exceed 500 characters.']
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

rsvpSchema.virtual('fullName').get(function () {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim() || 'Guest';
});

export const Rsvp = mongoose.model('Rsvp', rsvpSchema, 'rsvps');


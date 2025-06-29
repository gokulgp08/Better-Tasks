import mongoose, { Document, Schema } from 'mongoose';

export interface ICall extends Document {
  customer: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  callType: 'inbound' | 'outbound';
  summary: string;
  duration?: number; // in seconds
  outcome?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const callSchema = new Schema<ICall>({
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required']
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  callType: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: [true, 'Call type is required']
  },
  summary: {
    type: String,
    required: [true, 'Call summary is required'],
    trim: true,
    maxlength: [1000, 'Summary cannot exceed 1000 characters']
  },
  duration: {
    type: Number,
    min: [0, 'Duration cannot be negative']
  },
  outcome: {
    type: String,
    trim: true,
    maxlength: [200, 'Outcome cannot exceed 200 characters']
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }]
}, {
  timestamps: true
});

// Indexes for performance
callSchema.index({ customer: 1, createdAt: -1 });
callSchema.index({ user: 1, createdAt: -1 });
callSchema.index({ callType: 1 });
callSchema.index({ followUpRequired: 1, followUpDate: 1 });
callSchema.index({ summary: 'text', outcome: 'text', tags: 'text' });

// Validation for follow-up date
callSchema.pre('save', function (next) {
  if (this.followUpRequired && !this.followUpDate) {
    return next(new Error('Follow-up date is required when follow-up is needed'));
  }
  next();
});

export default mongoose.model<ICall>('Call', callSchema);
import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  companyName: string;
  companyType: string;
  url?: string;
  installationDate?: Date;
  gst?: string;
  contacts: {
    name: string;
    email: string;
    phone: string;
    designation: string;
    isPrimary: boolean;
  }[];
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  notes?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  companyType: {
    type: String,
    required: [true, 'Company type is required'],
    trim: true,
    maxlength: [100, 'Company type cannot exceed 100 characters']
  },
  url: {
    type: String,
    trim: true
  },
  installationDate: {
    type: Date
  },
  gst: {
    type: String,
    trim: true,
    uppercase: true,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GST number']
  },
  contacts: [{
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      maxlength: [100, 'Contact name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    designation: {
      type: String,
      required: [true, 'Contact designation is required'],
      trim: true,
      maxlength: [100, 'Designation cannot exceed 100 characters']
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for performance
customerSchema.index({ companyName: 1 });
customerSchema.index({ companyType: 1 });
customerSchema.index({ 'contacts.email': 1 });
customerSchema.index({ createdBy: 1 });
customerSchema.index({ companyName: 'text', 'contacts.name': 'text', 'contacts.email': 'text', notes: 'text' });

// Ensure at least one contact exists
customerSchema.pre('save', function (next) {
  if (this.contacts.length === 0) {
    return next(new Error('At least one contact is required'));
  }
  
  // Ensure only one primary contact
  const primaryContacts = this.contacts.filter(contact => contact.isPrimary);
  if (primaryContacts.length === 0) {
    this.contacts[0].isPrimary = true;
  } else if (primaryContacts.length > 1) {
    // Keep only the first primary contact
    this.contacts.forEach((contact, index) => {
      if (index > 0 && contact.isPrimary) {
        contact.isPrimary = false;
      }
    });
  }
  
  next();
});

export default mongoose.model<ICustomer>('Customer', customerSchema);
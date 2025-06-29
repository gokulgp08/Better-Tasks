import mongoose, { Document, Schema } from 'mongoose';

export type ActionType = 
  // Task Actions
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'DELETE_TASK'
  | 'ADD_COMMENT'
  | 'UPLOAD_ATTACHMENT'
  // Customer Actions
  | 'CREATE_CUSTOMER'
  | 'UPDATE_CUSTOMER'
  | 'DELETE_CUSTOMER'
  // Call Actions
  | 'CREATE_CALL'
  | 'UPDATE_CALL'
  | 'DELETE_CALL'
  // User Actions
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'UPDATE_PROFILE';

export type EntityType = 'Task' | 'Customer' | 'Call' | 'User';

export interface IActivity extends Document {
  user: mongoose.Types.ObjectId;
  action: ActionType;
  entity: EntityType;
  entityId: mongoose.Types.ObjectId;
  details?: Record<string, any>;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'CREATE_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'ADD_COMMENT', 'UPLOAD_ATTACHMENT',
        'CREATE_CUSTOMER', 'UPDATE_CUSTOMER', 'DELETE_CUSTOMER',
        'CREATE_CALL', 'UPDATE_CALL', 'DELETE_CALL',
        'USER_LOGIN', 'USER_LOGOUT', 'UPDATE_PROFILE'
      ],
    },
    entity: {
      type: String,
      required: true,
      enum: ['Task', 'Customer', 'Call', 'User'],
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need createdAt
  }
);

export default mongoose.model<IActivity>('Activity', activitySchema);

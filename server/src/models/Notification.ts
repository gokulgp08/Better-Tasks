import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'NEW_TASK'
  | 'TASK_UPDATED'
  | 'COMMENT_ADDED'
  | 'TASK_DUE'
  | 'CALL_LOGGED'
  | 'TASK_REMINDER';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  message: string;
  link: string;
  isRead: boolean;
  related: {
    model: 'Task' | 'Call' | 'Customer';
    id: mongoose.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['NEW_TASK', 'TASK_UPDATED', 'COMMENT_ADDED', 'TASK_DUE', 'CALL_LOGGED'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    link: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    related: {
      model: {
        type: String,
        required: true,
        enum: ['Task', 'Call', 'Customer'],
      },
      id: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'related.model',
      },
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', notificationSchema);

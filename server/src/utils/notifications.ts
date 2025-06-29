import Notification, { INotification, NotificationType } from '../models/Notification.js';
import mongoose from 'mongoose';

interface NotificationData {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  message: string;
  link: string;
  related: {
    model: 'Task' | 'Call' | 'Customer';
    id: mongoose.Types.ObjectId;
  };
}

export const createNotification = async (data: NotificationData): Promise<INotification> => {
  try {
    const notification = new Notification(data);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification');
  }
};

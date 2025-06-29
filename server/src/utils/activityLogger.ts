import Activity, { ActionType, EntityType, IActivity } from '../models/Activity.js';
import mongoose from 'mongoose';

interface ActivityLogData {
  user: mongoose.Types.ObjectId;
  action: ActionType;
  entity: EntityType;
  entityId: mongoose.Types.ObjectId;
  details?: Record<string, any>;
}

/**
 * Logs an activity without waiting for it to complete.
 * @param data - The data for the activity to be logged.
 */
export const logActivity = (data: ActivityLogData): void => {
  // Run this in the background, don't await it
  (async () => {
    try {
      const activity = new Activity(data);
      await activity.save();
    } catch (error) {
      console.error('Failed to log activity:', error);
      // In a production app, you might want more robust error handling here,
      // like sending to a dedicated logging service (e.g., Sentry, LogRocket).
    }
  })();
};

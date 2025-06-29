import cron from 'node-cron';
import Task from '../models/Task.js';
import { createNotification } from '../utils/notifications.js';
import { ITask } from '../models/Task.js';
import { NotificationType } from '../models/Notification.js';

/**
 * Finds tasks due soon and sends reminders.
 */
const sendTaskReminders = async () => {
  console.log('Running daily task reminder job...');
  try {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    // Find tasks due in the next 24 hours that are not yet completed
    const upcomingTasks: ITask[] = await Task.find({
      dueDate: { 
        $gte: now, 
        $lt: tomorrow 
      },
      status: { $nin: ['Completed', 'Archived'] },
      isDeleted: false
    }).populate('assignedTo', 'name');

    if (upcomingTasks.length === 0) {
      console.log('No upcoming tasks to send reminders for.');
      return;
    }

    console.log(`Found ${upcomingTasks.length} upcoming tasks. Sending reminders...`);

    for (const task of upcomingTasks) {
      if (task.assignedTo && task.assignedTo._id) {
        await createNotification({
          user: task.assignedTo._id,
          type: 'TASK_REMINDER',
          message: `Reminder: The task "${task.title}" is due soon.`,
          link: `/tasks/${task._id}`,
          related: {
            model: 'Task',
            id: task._id,
          },
        });
      }
    }

    console.log('Finished sending task reminders.');
  } catch (error) {
    console.error('Error sending task reminders:', error);
  }
};

/**
 * Schedules the task reminder job to run every day at 9:00 AM.
 */
export const scheduleTaskReminders = () => {
  // Runs every day at 9:00 AM
  cron.schedule('0 9 * * *', sendTaskReminders, {
    timezone: "America/New_York" // It's good practice to set a timezone
  });

  console.log('Task reminder job scheduled to run daily at 9:00 AM.');
};

import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import Task, { ITask } from '../models/Task.js';
import User, { IUser } from '../models/User.js';
import Customer, { ICustomer } from '../models/Customer.js';
import { authenticate, authorize, AuthRequest, canAccessTask } from '../middleware/auth.js';
import upload from '../config/upload.js';
import fs from 'fs/promises';
import mongoose from 'mongoose';
import { createNotification } from '../utils/notifications.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all tasks
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      priority, 
      assignedTo, 
      customer,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query: any = {};

    // Filter by status
    if (status && typeof status === 'string') {
      query.status = status;
    }

    // Filter by priority
    if (priority && typeof priority === 'string') {
      query.priority = priority;
    }

    // Filter by assigned user
    if (assignedTo && typeof assignedTo === 'string') {
      query.assignedTo = assignedTo;
    }

    // Filter by customer
    if (customer && typeof customer === 'string') {
      query.customer = customer;
    }

    // Search functionality
    if (search && typeof search === 'string') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Role-based filtering
    if (req.user?.role === 'user') {
      // Users can only see tasks assigned to them or created by them
      query.$or = [
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ];
    }

    const sortOptions: any = {};
    sortOptions[String(sortBy)] = sortOrder === 'asc' ? 1 : -1;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('customer', 'companyName')
      .populate('createdBy', 'name email')
      .populate('comments.author', 'name')
      .sort(sortOptions)
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalTasks: total,
        hasNext: Number(page) * Number(limit) < total,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      message: 'Failed to fetch tasks',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get task by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('customer', 'companyName')
      .populate('createdBy', 'name email')
      .populate('comments.author', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check access permissions
    if (req.user?.role === 'user') {
      const hasAccess = task.assignedTo._id.toString() === req.user._id.toString() ||
                       task.createdBy._id.toString() === req.user._id.toString();
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      message: 'Failed to fetch task',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new task
router.post('/', authorize(['admin', 'manager']), [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters'),
  body('priority')
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('dueDate')
    .isISO8601()
    .withMessage('Invalid due date format'),
  body('assignedTo')
    .isMongoId()
    .withMessage('Invalid assigned user ID'),
  body('customer')
    .optional()
    .isMongoId()
    .withMessage('Invalid customer ID')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, category, priority, dueDate, assignedTo, customer } = req.body;

    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser || !assignedUser.isActive) {
      return res.status(400).json({ message: 'Invalid assigned user' });
    }

    if (customer) {
      const customerDoc = await Customer.findById(customer);
      if (!customerDoc || !customerDoc.isActive) {
        return res.status(400).json({ message: 'Invalid customer' });
      }
    }

    const task = new Task({
      title, description, category, priority, dueDate, assignedTo, customer,
      createdBy: req.user?._id
    });
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate<{ createdBy: IUser; assignedTo: IUser }>('createdBy assignedTo', 'name email')
      .populate<{ customer: ICustomer }>('customer', 'companyName');

    if (!populatedTask) {
      return res.status(404).json({ message: 'Task not found after creation' });
    }

    // Create a notification for the assigned user
    if (populatedTask.assignedTo && populatedTask.createdBy && populatedTask.createdBy._id.toString() !== populatedTask.assignedTo._id.toString()) {
      await createNotification({
        user: populatedTask.assignedTo._id,
        type: 'NEW_TASK',
        message: `You have been assigned a new task: "${populatedTask.title}" by ${populatedTask.createdBy.name}.`,
        link: `/tasks/${populatedTask._id}`,
        related: { model: 'Task', id: populatedTask._id },
      });
    }

        // Log activity
    if (req.user) {
      logActivity({
        user: req.user._id,
        action: 'CREATE_TASK',
        entity: 'Task',
        entityId: populatedTask._id,
        details: { title: populatedTask.title }
      });
    }

    res.status(201).json({ message: 'Task created successfully', task: populatedTask });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Failed to create task', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update task
router.put('/:id', authorize(['admin', 'manager']), [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'completed'])
    .withMessage('Invalid status'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid due date format'),
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid assigned user ID'),
  body('customer')
    .optional()
    .isMongoId()
    .withMessage('Invalid customer ID')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const taskId = req.params.id;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!req.user || !canAccessTask(req.user, task)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates: any = {};
    const allowedFields = ['title', 'description', 'category', 'priority', 'status', 'dueDate', 'assignedTo', 'customer'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.assignedTo) {
      const assignedUser = await User.findById(updates.assignedTo);
      if (!assignedUser || !assignedUser.isActive) {
        return res.status(400).json({ message: 'Invalid assigned user' });
      }
    }

    if (updates.customer) {
      const customerDoc = await Customer.findById(updates.customer);
      if (!customerDoc || !customerDoc.isActive) {
        return res.status(400).json({ message: 'Invalid customer' });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, updates, { new: true, runValidators: true })
      .populate<{ createdBy: IUser; assignedTo: IUser }>('createdBy assignedTo', 'name email')
      .populate<{ customer: ICustomer }>('customer', 'companyName');

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found after update' });
    }

    const notifyUser = updatedTask.assignedTo;
    if (notifyUser && notifyUser._id.toString() !== req.user?._id.toString()) {
      let notificationMessage = '';
      if (updates.assignedTo && task.assignedTo.toString() !== updates.assignedTo) {
        notificationMessage = `You have been assigned a new task: "${updatedTask.title}".`;
      } else {
        const changedFields = [];
        if (updates.status && task.status !== updates.status) changedFields.push(`status to "${updates.status}"`);
        if (updates.priority && task.priority !== updates.priority) changedFields.push(`priority to "${updates.priority}"`);
        if (updates.dueDate && new Date(task.dueDate).getTime() !== new Date(updates.dueDate).getTime()) changedFields.push(`due date`);
        if (changedFields.length > 0) {
          notificationMessage = `The task "${updatedTask.title}" has been updated: ${changedFields.join(', ')}.`;
        }
      }

      if (notificationMessage) {
        await createNotification({
          user: notifyUser._id,
          type: 'TASK_UPDATED',
          message: notificationMessage,
          link: `/tasks/${updatedTask._id}`,
          related: { model: 'Task', id: updatedTask._id },
        });
      }
    }

    // Log activity
    const changedFields = Object.keys(updates);
    if (req.user && changedFields.length > 0) {
      const previousTaskData: Record<string, any> = task.toObject();
      logActivity({
        user: req.user._id,
        action: 'UPDATE_TASK',
        entity: 'Task',
        entityId: updatedTask._id,
        details: {
          updatedFields: changedFields,
          previousValues: Object.fromEntries(
            changedFields.map(field => [field, previousTaskData[field]])
          )
        }
      });
    }

    res.json({ message: 'Task updated successfully', task: updatedTask });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Failed to update task', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Add comment to task
router.post('/:id/comments', [
  body('text')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const taskId = req.params.id;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!req.user || !canAccessTask(req.user, task)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const newComment = { text: req.body.text, author: req.user?._id, createdAt: new Date() };
    task.comments.push(newComment as any);
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate<{ createdBy: IUser; assignedTo: IUser; 'comments.author': IUser }>('createdBy assignedTo comments.author', 'name email');

    if (!populatedTask) {
      return res.status(404).json({ message: 'Task not found after adding comment' });
    }

    const authorId = req.user?._id.toString();
    const usersToNotify = new Set<string>();

    if (populatedTask.createdBy && populatedTask.createdBy._id.toString() !== authorId) {
      usersToNotify.add(populatedTask.createdBy._id.toString());
    }
    if (populatedTask.assignedTo && populatedTask.assignedTo._id.toString() !== authorId) {
      usersToNotify.add(populatedTask.assignedTo._id.toString());
    }

    for (const userId of usersToNotify) {
      await createNotification({
        user: new mongoose.Types.ObjectId(userId),
        type: 'COMMENT_ADDED',
        message: `${req.user?.name} commented on the task: "${populatedTask.title}" `,
        link: `/tasks/${populatedTask._id}`,
        related: { model: 'Task', id: populatedTask._id },
      });
    }

        // Log activity
    logActivity({
      user: authorId,
      action: 'ADD_COMMENT',
      entity: 'Task',
      entityId: populatedTask._id,
      details: { comment: newComment.text }
    });

    res.json({ message: 'Comment added successfully', task: populatedTask });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Failed to add comment', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Add attachment to a task
router.post(
  '/:id/attachments',
  upload.array('attachments', 5), // field name 'attachments', max 5 files
  async (req: AuthRequest, res: Response) => {
    try {
      const taskId = req.params.id;
      const task = await Task.findById(taskId);

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Check permissions
      if (req.user?.role === 'user') {
        const hasAccess =
          task.assignedTo.toString() === req.user._id.toString() ||
          task.createdBy.toString() === req.user._id.toString();
        if (!hasAccess) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }

      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ message: 'No files uploaded.' });
      }

      const files = req.files as Express.Multer.File[];
      const newAttachments = files.map(file => ({
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
      }));

      task.attachments.push(...newAttachments);
      await task.save();

      const populatedTask = await Task.findById(taskId)
        .populate('assignedTo', 'name email')
        .populate('customer', 'companyName')
        .populate('createdBy', 'name email')
        .populate('comments.author', 'name');

      // Log activity
      if (req.user) {
        for (const file of files) {
          logActivity({
            user: req.user._id,
            action: 'UPLOAD_ATTACHMENT',
            entity: 'Task',
            entityId: task._id,
            details: { filename: file.originalname }
          });
        }
      }

      res.json({
        message: 'Files uploaded successfully',
        task: populatedTask,
      });
    } catch (error) {
      console.error('Upload attachment error:', error);
      res.status(500).json({
        message: 'Failed to upload files',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Delete an attachment from a task
router.delete('/:taskId/attachments/:attachmentId', async (req: AuthRequest, res: Response) => {
  try {
    const { taskId, attachmentId } = req.params;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (req.user?.role === 'user') {
      const hasAccess =
        task.assignedTo.toString() === req.user._id.toString() ||
        task.createdBy.toString() === req.user._id.toString();
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const attachment = task.attachments.find(
      (att: any) => att._id.toString() === attachmentId
    );

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Remove file from server
    try {
        await fs.unlink(attachment.path);
    } catch (err) {
        console.error(`Failed to delete file ${attachment.path}:`, err);
    }

    // Remove attachment from task document
    task.attachments = task.attachments.filter(
      (att: any) => att._id.toString() !== attachmentId
    );

    await task.save();

    const populatedTask = await Task.findById(taskId)
      .populate('assignedTo', 'name email')
      .populate('customer', 'companyName')
      .populate('createdBy', 'name email')
      .populate('comments.author', 'name');

    res.json({
      message: 'Attachment deleted successfully',
      task: populatedTask,
    });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({
      message: 'Failed to delete attachment',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Update task status
router.patch('/:id/status', canAccessTask, [
  body('status').isIn(['pending', 'in-progress', 'completed']).withMessage('Invalid status')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { status } = req.body;
    const task = req.task!;

    task.status = status;
    await task.save();

    // Log activity
    if (req.user) {
      logActivity({
        user: req.user._id,
        action: 'UPDATE_TASK_STATUS',
        entity: 'Task',
        entityId: task._id,
        details: { status: task.status }
      });
    }

    res.json({ message: 'Task status updated successfully', task });

  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Failed to update task status', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Delete task
router.delete('/:id', authorize(['admin', 'manager']), async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }



    // Log activity
    if (req.user) {
      logActivity({
        user: req.user._id,
        action: 'DELETE_TASK',
        entity: 'Task',
        entityId: task._id,
        details: { title: task.title }
      });
    }

    await Task.findByIdAndDelete(taskId);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      message: 'Failed to delete task',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
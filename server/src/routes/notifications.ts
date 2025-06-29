import express, { Response } from 'express';
import Notification from '../models/Notification.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all notifications for the logged-in user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, isRead } = req.query;

    const query: any = { user: req.user?._id };

    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .populate('related.id');

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalNotifications: total,
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Get unread notification count
router.get('/unread/count', async (req: AuthRequest, res: Response) => {
  try {
    const count = await Notification.countDocuments({ user: req.user?._id, isRead: false });
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Failed to get unread notification count' });
  }
});

// Mark a notification as read
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user?._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany({ user: req.user?._id, isRead: false }, { isRead: true });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

export default router;

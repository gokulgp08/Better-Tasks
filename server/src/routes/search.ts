import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import Task from '../models/Task.js';
import Customer from '../models/Customer.js';
import Call from '../models/Call.js';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @route   GET /api/search
 * @desc    Search across different resources (tasks, customers, calls)
 * @access  Private
 * @query   q: string (search query)
 * @query   resources: string (comma-separated list, e.g., 'tasks,customers')
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { q, resources } = req.query;
    const user = req.user!;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Search query (q) is required' });
    }

    const searchPromises: Promise<any>[] = [];
    const results: { [key: string]: any[] } = {};

    const resourceTypes = resources && typeof resources === 'string' 
      ? resources.split(',') 
      : ['tasks', 'customers', 'calls'];

    // Base query for text search
    const textSearchQuery = { $text: { $search: q } };

    // --- Task Search ---
    if (resourceTypes.includes('tasks')) {
      const taskQuery = user.role === 'admin' || user.role === 'manager'
        ? textSearchQuery
        : {
            ...textSearchQuery,
            $or: [
              { createdBy: user._id },
              { assignedTo: user._id }
            ]
          };
      searchPromises.push(
        Task.find(taskQuery, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' } })
          .limit(10)
          .populate('assignedTo', 'name')
          .populate('createdBy', 'name')
          .lean()
          .then(data => { results.tasks = data; })
      );
    }

    // --- Customer Search ---
    if (resourceTypes.includes('customers')) {
      const customerQuery = user.role === 'admin' || user.role === 'manager'
        ? textSearchQuery
        : { ...textSearchQuery, createdBy: user._id };

      searchPromises.push(
        Customer.find(customerQuery, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' } })
          .limit(10)
          .populate('createdBy', 'name')
          .lean()
          .then(data => { results.customers = data; })
      );
    }

    // --- Call Search ---
    if (resourceTypes.includes('calls')) {
      const callQuery = user.role === 'admin' || user.role === 'manager'
        ? textSearchQuery
        : { ...textSearchQuery, user: user._id };

      searchPromises.push(
        Call.find(callQuery, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' } })
          .limit(10)
          .populate('user', 'name')
          .populate('customer', 'companyName')
          .lean()
          .then(data => { results.calls = data; })
      );
    }

    await Promise.all(searchPromises);

    res.json(results);

  } catch (error) {
    console.error('Search error:', error);
    if (error instanceof mongoose.Error.MongooseServerSelectionError) {
      return res.status(503).json({ message: 'Database connection error during search.' });
    }
    res.status(500).json({ 
      message: 'An error occurred during the search',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

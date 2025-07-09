import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import TaskCategory from '../models/TaskCategory.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// GET all task categories
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const categories = await TaskCategory.find().sort({ name: 1 });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch task categories' });
  }
});

// POST create a new task category
router.post('/', authorize('admin', 'manager'), [
  body('name').trim().notEmpty().withMessage('Category name is required.'),
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description } = req.body;
    const existingCategory = await TaskCategory.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existingCategory) {
      return res.status(400).json({ message: 'A category with this name already exists.' });
    }

    const newCategory = new TaskCategory({ name, description });
    await newCategory.save();
    res.status(201).json({ category: newCategory });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create task category' });
  }
});

// PUT update a task category
router.put('/:id', authorize('admin', 'manager'), [
  body('name').trim().notEmpty().withMessage('Category name is required.'),
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description } = req.body;
    const category = await TaskCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const existingCategory = await TaskCategory.findOne({ 
      name: { $regex: `^${name}$`, $options: 'i' },
      _id: { $ne: req.params.id }
    });

    if (existingCategory) {
      return res.status(400).json({ message: 'Another category with this name already exists.' });
    }

    category.name = name;
    category.description = description;
    await category.save();

    res.json({ category });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task category' });
  }
});

// DELETE a task category
router.delete('/:id', authorize('admin', 'manager'), async (req: AuthRequest, res: Response) => {
  try {
    // TODO: Before deleting, check if any tasks are using this category.
    // If so, either prevent deletion or re-assign tasks to a default category.
    const category = await TaskCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Task category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task category' });
  }
});

export default router;

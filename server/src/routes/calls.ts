import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import Call, { ICall } from '../models/Call.js';
import { logActivity } from '../utils/activityLogger.js';
import Customer from '../models/Customer.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all calls
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      callType, 
      customer,
      user,
      search,
      followUpRequired,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query: any = {};

    // Filter by call type
    if (callType && typeof callType === 'string') {
      query.callType = callType;
    }

    // Filter by customer
    if (customer && typeof customer === 'string') {
      query.customer = customer;
    }

    // Filter by user
    if (user && typeof user ===  'string') {
      query.user = user;
    }

    // Filter by follow-up requirement
    if (followUpRequired && typeof followUpRequired === 'string') {
      query.followUpRequired = followUpRequired === 'true';
    }

    // Search functionality
    if (search && typeof search === 'string') {
      query.$or = [
        { summary: { $regex: search, $options: 'i' } },
        { outcome: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Role-based filtering
    if (req.user?.role === 'user') {
      query.user = req.user._id;
    }

    const sortOptions: any = {};
    sortOptions[String(sortBy)] = sortOrder === 'asc' ? 1 : -1;

    const calls = await Call.find(query)
      .populate('customer', 'companyName companyType')
      .populate('user', 'name email')
      .sort(sortOptions)
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Call.countDocuments(query);

    res.json({
      calls,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalCalls: total,
        hasNext: Number(page) * Number(limit) < total,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Get calls error:', error);
    res.status(500).json({
      message: 'Failed to fetch calls',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get call by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const call = await Call.findById(req.params.id)
      .populate('customer', 'companyName companyType contacts')
      .populate('user', 'name email');

    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Check access permissions
    if (req.user?.role === 'user' && call.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ call });
  } catch (error) {
    console.error('Get call error:', error);
    res.status(500).json({
      message: 'Failed to fetch call',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new call
router.post('/', [
  body('customer')
    .isMongoId()
    .withMessage('Invalid customer ID'),
  body('callType')
    .isIn(['inbound', 'outbound'])
    .withMessage('Invalid call type'),
  body('summary')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Summary must be between 1 and 1000 characters'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a positive number'),
  body('outcome')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Outcome cannot exceed 200 characters'),
  body('followUpRequired')
    .optional()
    .isBoolean()
    .withMessage('Follow-up required must be a boolean'),
  body('followUpDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid follow-up date format'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      customer, 
      callType, 
      summary, 
      duration, 
      outcome, 
      followUpRequired = false, 
      followUpDate, 
      tags = [] 
    } = req.body;

    // Verify customer exists
    const customerDoc = await Customer.findById(customer);
    if (!customerDoc || !customerDoc.isActive) {
      return res.status(400).json({ message: 'Invalid customer' });
    }

    // Validate follow-up date if required
    if (followUpRequired && !followUpDate) {
      return res.status(400).json({ 
        message: 'Follow-up date is required when follow-up is needed' 
      });
    }

    const call = new Call({
      customer,
      user: req.user!._id,
      callType,
      summary,
      duration,
      outcome,
      followUpRequired,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      tags
    });

    await call.save();

    const populatedCall = await Call.findById(call._id)
      .populate('customer', 'companyName companyType')
      .populate('user', 'name email');

    // Log activity
    if (req.user && populatedCall) {
      logActivity({
        user: req.user._id,
        action: 'CREATE_CALL',
        entity: 'Call',
        entityId: populatedCall._id,
        details: { summary: populatedCall.summary }
      });
    }

    res.status(201).json({
      message: 'Call logged successfully',
      call: populatedCall
    });
  } catch (error) {
    console.error('Create call error:', error);
    res.status(500).json({
      message: 'Failed to log call',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update call
router.put('/:id', [
  body('customer')
    .optional()
    .isMongoId()
    .withMessage('Invalid customer ID'),
  body('callType')
    .optional()
    .isIn(['inbound', 'outbound'])
    .withMessage('Invalid call type'),
  body('summary')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Summary must be between 1 and 1000 characters'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a positive number'),
  body('outcome')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Outcome cannot exceed 200 characters'),
  body('followUpRequired')
    .optional()
    .isBoolean()
    .withMessage('Follow-up required must be a boolean'),
  body('followUpDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid follow-up date format'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const callId = req.params.id;
    const call = await Call.findById(callId);

    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Check permissions
    if (req.user?.role === 'user' && call.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates: any = {};
    const allowedFields = [
      'customer', 'callType', 'summary', 'duration', 
      'outcome', 'followUpRequired', 'followUpDate', 'tags'
    ];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'followUpDate') {
          updates[field] = req.body[field] ? new Date(req.body[field]) : undefined;
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    // Verify customer if being updated
    if (updates.customer) {
      const customerDoc = await Customer.findById(updates.customer);
      if (!customerDoc || !customerDoc.isActive) {
        return res.status(400).json({ message: 'Invalid customer' });
      }
    }

    // Validate follow-up logic
    if (updates.followUpRequired === true && !updates.followUpDate && !call.followUpDate) {
      return res.status(400).json({ 
        message: 'Follow-up date is required when follow-up is needed' 
      });
    }

    const updatedCall = await Call.findByIdAndUpdate(
      callId,
      updates,
      { new: true, runValidators: true }
    )
      .populate('customer', 'companyName companyType')
      .populate('user', 'name email');

    // Log activity
    const changedFields = Object.keys(updates);
    if (req.user && updatedCall && changedFields.length > 0) {
      const previousCallData: Record<string, any> = call.toObject();
      logActivity({
        user: req.user._id,
        action: 'UPDATE_CALL',
        entity: 'Call',
        entityId: updatedCall._id,
        details: {
          updatedFields: changedFields,
          previousValues: Object.fromEntries(
            changedFields.map(field => [field, previousCallData[field]])
          )
        }
      });
    }

    res.json({
      message: 'Call updated successfully',
      call: updatedCall
    });
  } catch (error) {
    console.error('Update call error:', error);
    res.status(500).json({
      message: 'Failed to update call',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete call
router.delete('/:id', authorize('admin', 'manager'), async (req: AuthRequest, res: Response) => {
  try {
    const callId = req.params.id;
    const call = await Call.findById(callId);

    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Check permissions - only admins, managers, and call creators can delete
    if (req.user?.role === 'user' && call.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Log activity
    if (req.user) {
      logActivity({
        user: req.user._id,
        action: 'DELETE_CALL',
        entity: 'Call',
        entityId: call._id,
        details: { summary: call.summary }
      });
    }

    await Call.findByIdAndDelete(callId);

    res.json({ message: 'Call deleted successfully' });
  } catch (error) {
    console.error('Delete call error:', error);
    res.status(500).json({
      message: 'Failed to delete call',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get calls by customer
router.get('/customer/:customerId', async (req: AuthRequest, res: Response) => {
  try {
    const { customerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer || !customer.isActive) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const query: any = { customer: customerId };

    // Role-based filtering
    if (req.user?.role === 'user') {
      query.user = req.user._id;
    }

    const calls = await Call.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Call.countDocuments(query);

    res.json({
      calls,
      customer: {
        _id: customer._id,
        companyName: customer.companyName,
        companyType: customer.companyType
      },
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalCalls: total,
        hasNext: Number(page) * Number(limit) < total,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Get customer calls error:', error);
    res.status(500).json({
      message: 'Failed to fetch customer calls',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
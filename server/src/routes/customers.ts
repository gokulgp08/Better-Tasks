import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import Customer, { ICustomer } from '../models/Customer.js';
import { logActivity } from '../utils/activityLogger.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all customers
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      companyType, 
      search,
      sortBy = 'companyName',
      sortOrder = 'asc'
    } = req.query;

    const query: any = { isActive: true };

    // Filter by company type
    if (companyType && typeof companyType === 'string') {
      query.companyType = { $regex: companyType, $options: 'i' };
    }

    // Search functionality
    if (search && typeof search === 'string') {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { companyType: { $regex: search, $options: 'i' } },
        { gst: { $regex: search, $options: 'i' } },
        { 'contacts.name': { $regex: search, $options: 'i' } },
        { 'contacts.email': { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions: any = {};
    sortOptions[String(sortBy)] = sortOrder === 'asc' ? 1 : -1;

    const customers = await Customer.find(query)
      .populate('createdBy', 'name email')
      .sort(sortOptions)
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalCustomers: total,
        hasNext: Number(page) * Number(limit) < total,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      message: 'Failed to fetch customers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get customer by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!customer || !customer.isActive) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ customer });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      message: 'Failed to fetch customer',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new customer
router.post('/', [
  body('companyName')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Company name must be between 1 and 200 characters'),
  body('companyType')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Company type must be between 1 and 100 characters'),
  body('gst')
    .optional()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Invalid GST format'),
  body('contacts')
    .isArray({ min: 1 })
    .withMessage('At least one contact is required'),
  body('contacts.*.name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Contact name must be between 1 and 100 characters'),
  body('contacts.*.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid contact email'),
  body('contacts.*.phone')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Invalid phone number'),
  body('contacts.*.designation')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Contact designation must be between 1 and 100 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { companyName, companyType, gst, contacts, address, notes } = req.body;

    // Check for duplicate company name
    const existingCustomer = await Customer.findOne({ 
      companyName: { $regex: `^${companyName}$`, $options: 'i' },
      isActive: true
    });

    if (existingCustomer) {
      return res.status(400).json({
        message: 'A customer with this company name already exists'
      });
    }

    const customer = new Customer({
      companyName,
      companyType,
      gst,
      contacts,
      address,
      notes,
      createdBy: req.user!._id
    });

    await customer.save();

    const populatedCustomer = await Customer.findById(customer._id)
      .populate('createdBy', 'name email');

        // Log activity
    if (req.user && populatedCustomer) {
      logActivity({
        user: req.user._id,
        action: 'CREATE_CUSTOMER',
        entity: 'Customer',
        entityId: populatedCustomer._id,
        details: { companyName: populatedCustomer.companyName }
      });
    }

    res.status(201).json({
      message: 'Customer created successfully',
      customer: populatedCustomer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      message: 'Failed to create customer',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update customer
router.put('/:id', authorize('admin', 'manager'), [
  body('companyName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Company name must be between 1 and 200 characters'),
  body('companyType')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Company type must be between 1 and 100 characters'),
  body('gst')
    .optional()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Invalid GST format'),
  body('contacts')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one contact is required'),
  body('contacts.*.name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Contact name must be between 1 and 100 characters'),
  body('contacts.*.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid contact email'),
  body('contacts.*.phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Invalid phone number'),
  body('contacts.*.designation')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Contact designation must be between 1 and 100 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const customerId = req.params.id;
    const customer = await Customer.findById(customerId);

    if (!customer || !customer.isActive) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const updates: any = {};
    const allowedFields = ['companyName', 'companyType', 'gst', 'contacts', 'address', 'notes'];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Check for duplicate company name if updating
    if (updates.companyName) {
      const existingCustomer = await Customer.findOne({ 
        companyName: { $regex: `^${updates.companyName}$`, $options: 'i' },
        _id: { $ne: customerId },
        isActive: true
      });

      if (existingCustomer) {
        return res.status(400).json({
          message: 'Another customer with this company name already exists'
        });
      }
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

        // Log activity
    const changedFields = Object.keys(updates);
    if (req.user && updatedCustomer && changedFields.length > 0) {
      const previousCustomerData: Record<string, any> = customer.toObject();
      logActivity({
        user: req.user._id,
        action: 'UPDATE_CUSTOMER',
        entity: 'Customer',
        entityId: updatedCustomer._id,
        details: {
          updatedFields: changedFields,
          previousValues: Object.fromEntries(
            changedFields.map(field => [field, previousCustomerData[field]])
          )
        }
      });
    }

    res.json({
      message: 'Customer updated successfully',
      customer: updatedCustomer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      message: 'Failed to update customer',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete customer (soft delete)
router.delete('/:id', authorize('admin', 'manager'), async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.params.id;
    
    const customer = await Customer.findByIdAndUpdate(
      customerId,
      { isActive: false },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

        // Log activity
    if (req.user) {
      logActivity({
        user: req.user._id,
        action: 'DELETE_CUSTOMER',
        entity: 'Customer',
        entityId: customer._id,
        details: { companyName: customer.companyName }
      });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      message: 'Failed to delete customer',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
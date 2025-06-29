import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Task from '../models/Task.js';
import Call from '../models/Call.js';

dotenv.config();

const seedData = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/better-tasks';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Customer.deleteMany({}),
      Task.deleteMany({}),
      Call.deleteMany({})
    ]);
    console.log('🗑️ Cleared existing data');

    // Create users
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash: 'admin123',
        role: 'admin'
      },
      {
        name: 'Manager User',
        email: 'manager@example.com',
        passwordHash: 'manager123',
        role: 'manager'
      },
      {
        name: 'Regular User',
        email: 'user@example.com',
        passwordHash: 'user123',
        role: 'user'
      },
      {
        name: 'John Smith',
        email: 'john@example.com',
        passwordHash: 'user123',
        role: 'user'
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        passwordHash: 'user123',
        role: 'user'
      }
    ]);
    console.log('👥 Created users');

    // Create customers
    const customers = await Customer.create([
      {
        companyName: 'TechCorp Solutions',
        companyType: 'Technology',
        gst: '29ABCDE1234F1Z5',
        contacts: [
          {
            name: 'Alice Brown',
            email: 'alice@techcorp.com',
            phone: '+91-9876543210',
            designation: 'CEO',
            isPrimary: true
          },
          {
            name: 'Bob Wilson',
            email: 'bob@techcorp.com',
            phone: '+91-9876543211',
            designation: 'CTO',
            isPrimary: false
          }
        ],
        address: {
          street: '123 Tech Street',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560001',
          country: 'India'
        },
        notes: 'Leading technology solutions provider',
        createdBy: users[0]._id
      },
      {
        companyName: 'Global Manufacturing Ltd',
        companyType: 'Manufacturing',
        gst: '27FGHIJ5678K2L6',
        contacts: [
          {
            name: 'Charlie Davis',
            email: 'charlie@globalmanuf.com',
            phone: '+91-9876543212',
            designation: 'Operations Manager',
            isPrimary: true
          }
        ],
        address: {
          street: '456 Industrial Area',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India'
        },
        notes: 'Large scale manufacturing company',
        createdBy: users[1]._id
      },
      {
        companyName: 'Retail Plus',
        companyType: 'Retail',
        contacts: [
          {
            name: 'Diana Evans',
            email: 'diana@retailplus.com',
            phone: '+91-9876543213',
            designation: 'Store Manager',
            isPrimary: true
          }
        ],
        address: {
          street: '789 Shopping Complex',
          city: 'Delhi',
          state: 'Delhi',
          zipCode: '110001',
          country: 'India'
        },
        notes: 'Multi-location retail chain',
        createdBy: users[0]._id
      }
    ]);
    console.log('🏢 Created customers');

    // Create tasks
    const tasks = await Task.create([
      {
        title: 'Implement new CRM features',
        description: 'Add customer management and call logging features to the existing system',
        category: 'Development',
        priority: 'high',
        status: 'in-progress',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        assignedTo: users[2]._id,
        customer: customers[0]._id,
        createdBy: users[1]._id,
        comments: [
          {
            text: 'Started working on the database schema',
            author: users[2]._id,
            createdAt: new Date()
          }
        ]
      },
      {
        title: 'Setup production deployment',
        description: 'Configure production environment and deploy the application',
        category: 'DevOps',
        priority: 'urgent',
        status: 'todo',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        assignedTo: users[3]._id,
        customer: customers[0]._id,
        createdBy: users[0]._id
      },
      {
        title: 'Customer onboarding process',
        description: 'Create documentation and process for onboarding new customers',
        category: 'Documentation',
        priority: 'medium',
        status: 'completed',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        assignedTo: users[4]._id,
        customer: customers[1]._id,
        createdBy: users[1]._id
      },
      {
        title: 'Quarterly business review',
        description: 'Prepare and conduct quarterly business review with key stakeholders',
        category: 'Business',
        priority: 'high',
        status: 'todo',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        assignedTo: users[1]._id,
        customer: customers[2]._id,
        createdBy: users[0]._id
      },
      {
        title: 'Bug fixes for mobile app',
        description: 'Fix reported issues in the mobile application',
        category: 'Bug Fix',
        priority: 'medium',
        status: 'in-progress',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        assignedTo: users[2]._id,
        createdBy: users[1]._id
      }
    ]);
    console.log('📋 Created tasks');

    // Create calls
    const calls = await Call.create([
      {
        customer: customers[0]._id,
        user: users[1]._id,
        callType: 'outbound',
        summary: 'Discussed project requirements and timeline for the new CRM features',
        duration: 1800, // 30 minutes
        outcome: 'Positive - client approved the proposal',
        followUpRequired: true,
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tags: ['project-discussion', 'requirements', 'approval']
      },
      {
        customer: customers[1]._id,
        user: users[2]._id,
        callType: 'inbound',
        summary: 'Customer reported issues with the current system performance',
        duration: 900, // 15 minutes
        outcome: 'Issue logged - needs technical investigation',
        followUpRequired: true,
        followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        tags: ['support', 'performance-issue', 'technical']
      },
      {
        customer: customers[2]._id,
        user: users[4]._id,
        callType: 'outbound',
        summary: 'Monthly check-in call to discuss business progress and upcoming needs',
        duration: 1200, // 20 minutes
        outcome: 'Satisfied with current services',
        followUpRequired: false,
        tags: ['check-in', 'relationship-management']
      },
      {
        customer: customers[0]._id,
        user: users[3]._id,
        callType: 'inbound',
        summary: 'Technical support call regarding deployment issues',
        duration: 2400, // 40 minutes
        outcome: 'Issue resolved - provided deployment guide',
        followUpRequired: false,
        tags: ['technical-support', 'deployment', 'resolved']
      }
    ]);
    console.log('📞 Created calls');

    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📋 Demo Login Credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Manager: manager@example.com / manager123');
    console.log('User: user@example.com / user123');
    console.log('\n📊 Data Summary:');
    console.log(`Users: ${users.length}`);
    console.log(`Customers: ${customers.length}`);
    console.log(`Tasks: ${tasks.length}`);
    console.log(`Calls: ${calls.length}`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seedData();
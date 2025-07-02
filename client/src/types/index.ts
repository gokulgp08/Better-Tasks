export interface CustomerContact {
  name: string;
  email: string;
  phone: string;
  designation: string;
}

export interface Customer {
  _id: string;
  companyName: string;
  companyType: string;
  gst: string;
  contacts: CustomerContact[];
  createdAt: string;
}

// Use for creating or updating a customer, where _id and createdAt are not required.
export type CustomerInput = Omit<Customer, '_id' | 'createdAt'>;

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'manager' | 'admin';
  isActive: boolean;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  assignedTo: {
    _id: string;
    name: string;
  };
  customer?: {
    _id: string;
    companyName: string;
  };
  attachments: any[];
  comments: any[];
  createdAt: string;
}

export type TaskInput = Omit<Task, '_id' | 'createdAt' | 'assignedTo' | 'customer' | 'attachments' | 'comments'> & {
  assignedTo: string; // User ID
  customer?: string; // Customer ID
};

export interface Call {
  _id: string;
  customer: {
    _id: string;
    companyName: string;
  };
  user: {
    _id: string;
    name: string;
  };
  callType: 'inbound' | 'outbound';
  summary: string;
  duration?: number;
  createdAt: string;
}

// Use for creating or updating a call.
export interface CallInput {
  customer: string; // Customer ID
  callType: 'inbound' | 'outbound';
  summary: string;
  duration?: number;
}

export interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string; // Optional link to a relevant page (e.g., a task)
}

export interface ActivityLog {
  _id: string;
  user: { name: string };
  action: 'CREATED' | 'UPDATED' | 'DELETED';
  entity: 'Task' | 'Customer' | 'Call';
  entityId: string;
  details: string;
  createdAt: string;
}


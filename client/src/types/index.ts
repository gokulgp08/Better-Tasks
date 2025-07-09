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
  url?: string;
  installationDate?: string;
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

export interface TaskCategory {
  _id: string;
  name: string;
  description?: string;
}

export interface Attachment {
  _id: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
}

export interface Comment {
  _id: string;
  author: {
    _id: string;
    name: string;
  };
  text: string;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  category: TaskCategory;
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
  attachments: Attachment[];
  comments: Comment[];
  createdAt: string;
}

export type TaskInput = Omit<Task, '_id' | 'createdAt' | 'assignedTo' | 'customer' | 'attachments' | 'comments' | 'category'> & {
  assignedTo: string; // User ID
  customer?: string; // Customer ID
  category: string; // Category ID
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


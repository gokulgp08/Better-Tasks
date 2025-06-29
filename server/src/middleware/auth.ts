import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.js';
import { ITask } from '../models/Task.js';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user not active.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. User not authenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}` 
      });
    }

    next();
  };
};

// Helper to check if user can access a resource owned by another user
export const canAccessResource = (user: IUser, resourceOwnerId: string): boolean => {
  if (!user) return false;

  // Admin and managers can access all resources
  if (user.role === 'admin' || user.role === 'manager') {
    return true;
  }

  // Users can only access their own resources
  return user._id.toString() === resourceOwnerId;
};

// Helper to check if a user can access a specific task
export const canAccessTask = (user: IUser, task: ITask): boolean => {
  if (!user) return false;

  // Admin and managers can access all tasks
  if (user.role === 'admin' || user.role === 'manager') {
    return true;
  }

  // Users can only access tasks they created or are assigned to
  const isCreator = task.createdBy.toString() === user._id.toString();
  const isAssignee = task.assignedTo.toString() === user._id.toString();

  return isCreator || isAssignee;
};
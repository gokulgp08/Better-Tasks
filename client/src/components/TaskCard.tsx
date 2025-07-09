import { Calendar, User, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: string) => void;
}

function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-danger-100 text-danger-800 border-danger-200';
      case 'high': return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success-100 text-success-800 border-success-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'todo': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {task.title}
        </h3>
        {isOverdue && (
          <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0 ml-2" />
        )}
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {task.description}
      </p>

      <div className="flex items-center gap-2 mb-4">
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
          {task.priority.toUpperCase()}
        </span>
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(task.status)}`}>
          {task.status.replace('-', ' ').toUpperCase()}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span className={isOverdue ? 'text-danger-600 font-medium' : ''}>
            Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
          </span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <User className="w-4 h-4 mr-2" />
          <span>Assigned to: {task.assignedTo.name}</span>
        </div>

        {task.customer && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Customer:</span> {task.customer.companyName}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <select
          value={task.status}
          onChange={(e) => onStatusChange?.(task._id, e.target.value)}
          className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(task._id)}
              className="text-sm text-danger-600 hover:text-danger-800 font-medium"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskCard;
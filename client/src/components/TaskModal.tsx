import React, { useState, useEffect, useRef } from 'react';
import { Task, User } from '../types';
import { usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  taskToEdit?: Task | null;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, taskToEdit }) => {
  const { user: currentUser } = useAuth();
  const [task, setTask] = useState<Partial<Task>>({});
  const [users, setUsers] = useState<User[]>([]);

  const isInitialized = useRef(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch users for the dropdown
      usersAPI.getAll()
        .then(response => {
          setUsers(response.data.users || []);
        })
        .catch(error => console.error('Error fetching users:', error));
      
      if (!isInitialized.current) {
        if (taskToEdit) {
          setTask(taskToEdit);
        } else {
          setTask({
            title: '',
            description: '',
            priority: 'medium',
            status: 'todo',
            dueDate: new Date().toISOString(),
            assignedTo: currentUser ? { _id: currentUser._id, name: currentUser.name } : undefined,
            category: 'General',
          });
        }
        isInitialized.current = true;
      }
    } else {
      // Reset on close
      setTask({});
      isInitialized.current = false;
    }
  }, [isOpen, taskToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'assignedTo') {
      const selectedUser = users.find(u => u._id === value);
      if (selectedUser) {
        setTask(prev => ({ ...prev, assignedTo: { _id: selectedUser._id, name: selectedUser.name } }));
      }
    } else if (name === 'dueDate') {
      // Ensure the date is stored in ISO format to match backend expectations
      setTask(prev => ({ ...prev, dueDate: new Date(value).toISOString() }));
    } else {
      setTask(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.title || !task.description || !task.assignedTo || !task.category) {
      alert('Please fill in all required fields: Title, Description, Category, and Assign To.');
      return;
    }
    onSave(task);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">{taskToEdit ? 'Edit Task' : 'New Task'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={task.title || ''}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              name="description"
              value={task.description || ''}
              onChange={handleChange}
              className="input-field"
              rows={4}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <input
              type="text"
              id="category"
              name="category"
              value={task.category || ''}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                id="priority"
                name="priority"
                value={task.priority || 'medium'}
                onChange={handleChange}
                className="select-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Assign To</label>
            <select
              id="assignedTo"
              name="assignedTo"
              value={typeof task.assignedTo === 'object' ? task.assignedTo?._id : task.assignedTo || ''}
              onChange={handleChange}
              className="select-field"
              required
            >
              <option value="" disabled>Select a user</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;

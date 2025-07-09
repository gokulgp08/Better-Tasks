import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Task, TaskInput, IUser as User, TaskCategory } from '../types';
import { usersAPI, taskCategoriesAPI, tasksAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Paperclip, Send, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: TaskInput) => void;
  taskToEdit?: Task | null;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, taskToEdit }) => {
  const { user: currentUser } = useAuth();
  const isReadOnly = !(currentUser?.role === 'admin' || currentUser?.role === 'manager');
  const [task, setTask] = useState<Partial<TaskInput>>({});
  const [fullTask, setFullTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [newComment, setNewComment] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [usersRes, categoriesRes] = await Promise.all([
            usersAPI.getAll(),
            taskCategoriesAPI.getAll(),
          ]);
          setUsers(usersRes.data.users || []);
          setCategories(categoriesRes.data.categories || []);

          if (taskToEdit) {
            const taskRes = await tasksAPI.getById(taskToEdit._id);
            const fetchedTask = taskRes.data.task;
            setFullTask(fetchedTask);
            setTask({
              ...fetchedTask,
              assignedTo: fetchedTask.assignedTo?._id,
              customer: fetchedTask.customer?._id,
              category: fetchedTask.category?._id,
            });
          } else {
            setFullTask(null);
            setTask({
              title: '',
              description: '',
              priority: 'medium',
              status: 'todo',
              dueDate: new Date().toISOString(),
              assignedTo: currentUser?._id,
              category: categoriesRes.data.categories.length > 0 ? categoriesRes.data.categories[0]._id : '',
            });
          }
        } catch (error) {
          console.error('Failed to fetch data for task modal:', error);
        }
      };
      fetchData();
    } else {
      setTask({});
      setFullTask(null);
      setNewComment('');
      setFile(null);
    }
  }, [isOpen, taskToEdit, currentUser]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTask(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadAttachment = async () => {
    if (!file || !fullTask) return;
    const formData = new FormData();
    formData.append('attachments', file);
    try {
      const res = await tasksAPI.uploadAttachment(fullTask._id, formData);
      setFullTask(res.data.task);
      setFile(null);
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file.');
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!fullTask) return;
    if (window.confirm('Are you sure you want to delete this attachment?')) {
      try {
        const res = await tasksAPI.deleteAttachment(fullTask._id, attachmentId);
        setFullTask(res.data.task);
      } catch (error) {
        console.error('Failed to delete attachment:', error);
        alert('Failed to delete attachment.');
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !fullTask) return;
    try {
      const res = await tasksAPI.addComment(fullTask._id, newComment);
      setFullTask(res.data.task);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!fullTask) return;
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        const res = await tasksAPI.deleteComment(fullTask._id, commentId);
        setFullTask(res.data.task);
      } catch (error) {
        console.error('Failed to delete comment:', error);
        alert('Failed to delete comment.');
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!task.title || !task.description || !task.assignedTo || !task.category) {
      alert('Please fill in all required fields.');
      return;
    }
    onSave(task as TaskInput);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-3xl p-6 bg-white rounded-lg max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-2xl font-bold">{taskToEdit ? 'Edit Task' : 'New Task'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side: Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form fields... */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <input type="text" id="title" name="title" value={task.title || ''} onChange={handleChange} className="input-field" required disabled={isReadOnly} />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea id="description" name="description" value={task.description || ''} onChange={handleChange} className="input-field" rows={4} required disabled={isReadOnly}></textarea>
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
              <select id="category" name="category" value={task.category || ''} onChange={handleChange} className="select-field" disabled={isReadOnly}>
                <option value="" disabled>Select a category</option>
                {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                <select id="priority" name="priority" value={task.priority || 'medium'} onChange={handleChange} className="select-field" disabled={isReadOnly}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <select id="status" name="status" value={task.status || 'todo'} onChange={handleChange} className="select-field" disabled={isReadOnly}>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
              <input id="dueDate" name="dueDate" type="datetime-local" value={task.dueDate ? new Date(task.dueDate).toISOString().substring(0, 16) : ''} onChange={handleChange} className="input-field" required disabled={isReadOnly} />
            </div>
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Assign To</label>
              <select id="assignedTo" name="assignedTo" value={task.assignedTo || ''} onChange={handleChange} className="select-field" required disabled={isReadOnly}>
                <option value="" disabled>Select a user</option>
                {users.map(user => <option key={user._id} value={user._id}>{user.name}</option>)}
              </select>
            </div>
                        {!isReadOnly && (
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{taskToEdit ? 'Save Changes' : 'Create Task'}</button>
              </div>
            )}
          </form>

          {/* Right side: Attachments and Comments */}
          <div className="space-y-6">
            {/* Attachments Section */}
            {fullTask && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Attachments</h3>
                <div className="space-y-2">
                  {fullTask.attachments.map(att => (
                    <div key={att._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <a href={`${API_URL}/${att.path}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate flex items-center">
                        <Paperclip className="w-4 h-4 mr-2" />
                        {att.filename}
                      </a>
                      {!isReadOnly && (
                        <button onClick={() => handleDeleteAttachment(att._id)} className="text-danger-600 hover:text-danger-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {!isReadOnly && (
                  <div className="mt-4 flex items-center gap-2">
                    <input type="file" onChange={handleFileChange} className="text-sm" />
                    <button onClick={handleUploadAttachment} disabled={!file} className="btn-secondary btn-sm">Upload</button>
                  </div>
                )}
              </div>
            )}

            {/* Comments Section */}
            {fullTask && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Comments</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {fullTask.comments.map(comment => (
                    <div key={comment._id} className="text-sm bg-gray-50 p-2 rounded-md">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold">{comment.author.name}</span>
                        <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                      {(currentUser?._id === comment.author._id || ['admin', 'manager'].includes(currentUser?.role ?? '')) && (
                        <div className="text-right">
                          <button onClick={() => handleDeleteComment(comment._id)} className="text-danger-600 hover:text-danger-800 text-xs">
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="input-field"
                  />
                  <button onClick={handleAddComment} className="btn-primary p-2">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;

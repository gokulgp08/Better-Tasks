import { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { tasksAPI } from '../services/api';
import TaskCard from '../components/TaskCard';
import { Task, TaskInput } from '../types';
import TaskModal from '../components/TaskModal';
import { useAuth } from '../contexts/AuthContext';

function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await tasksAPI.getAll();
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      const response = await tasksAPI.updateTaskStatus(taskId, status);
      setTasks(tasks.map(task => 
        task._id === taskId ? response.data.task : task
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.delete(taskId);
        setTasks(tasks.filter(task => task._id !== taskId));
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleSaveTask = async (taskData: TaskInput) => {
    try {
      if (editingTask) {
        const response = await tasksAPI.update(editingTask._id, taskData);
        setTasks(tasks.map(t => (t._id === editingTask._id ? response.data.task : t)));
      } else {
        const response = await tasksAPI.create(taskData);
        setTasks([response.data.task, ...tasks]);
      }
      setIsModalOpen(false);
      setEditingTask(null);
    } catch (error: any) {
      console.error('Error saving task:', error);
      if (error.response && error.response.data && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map((err: any) => err.msg).join('\n');
        alert(`Failed to save task:\n${errorMessages}`);
      } else {
        alert('Failed to save task. Please check the console for details.');
      }
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">Manage and track your tasks</p>
        </div>
        {user && (user.role === 'admin' || user.role === 'manager') && (
          <button onClick={() => { setEditingTask(null); setIsModalOpen(true); }} className="btn-primary flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              className="select-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              className="select-field"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onStatusChange={handleStatusChange}
              onDelete={user && (user.role === 'admin' || user.role === 'manager') ? handleDeleteTask : undefined}
              onEdit={user && (user.role === 'admin' || user.role === 'manager') ? (task) => { setEditingTask(task); setIsModalOpen(true); } : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
            <Filter className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : user && (user.role === 'admin' || user.role === 'manager') 
                ? 'Get started by creating your first task' 
                : 'No tasks assigned to you.'
            }
          </p>
          {user && (user.role === 'admin' || user.role === 'manager') && (
            <button onClick={() => { setEditingTask(null); setIsModalOpen(true); }} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </button>
          )}
        </div>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
        onSave={handleSaveTask}
        taskToEdit={editingTask}
      />
    </div>
  );
}

export default Tasks;
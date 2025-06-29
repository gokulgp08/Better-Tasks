import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tasksAPI, customersAPI, callsAPI } from '../services/api';
import { CheckSquare, Users, Phone, Calendar, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalCustomers: number;
  totalCalls: number;
  recentTasks: any[];
}

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    totalCustomers: 0,
    totalCalls: 0,
    recentTasks: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [tasksResponse, customersResponse, callsResponse] = await Promise.all([
        tasksAPI.getAll(),
        customersAPI.getAll(),
        callsAPI.getAll(),
      ]);

      const tasks = tasksResponse.data.tasks;
      const customers = customersResponse.data.customers;
      const calls = callsResponse.data.calls;

      const completedTasks = tasks.filter((task: any) => task.status === 'completed').length;
      const overdueTasks = tasks.filter((task: any) => 
        new Date(task.dueDate) < new Date() && task.status !== 'completed'
      ).length;

      setStats({
        totalTasks: tasks.length,
        completedTasks,
        overdueTasks,
        totalCustomers: customers.length,
        totalCalls: calls.length,
        recentTasks: tasks.slice(0, 5),
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: CheckSquare,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Completed Tasks',
      value: stats.completedTasks,
      icon: TrendingUp,
      color: 'bg-success-500',
      bgColor: 'bg-success-50',
    },
    {
      title: 'Overdue Tasks',
      value: stats.overdueTasks,
      icon: Calendar,
      color: 'bg-danger-500',
      bgColor: 'bg-danger-50',
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Calls',
      value: stats.totalCalls,
      icon: Phone,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
    },
  ];

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">Here's what's happening with your tasks and customers today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat) => (
          <div key={stat.title} className={`card ${stat.bgColor}`}>
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.color} bg-opacity-20`}>
                <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h3>
          <div className="space-y-3">
            {stats.recentTasks.length > 0 ? (
              stats.recentTasks.map((task) => (
                <div key={task._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-600">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    task.status === 'completed' ? 'bg-success-100 text-success-800' :
                    task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No tasks found</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors duration-200">
              <p className="font-medium text-primary-900">Create New Task</p>
              <p className="text-sm text-primary-700">Add a new task to your workflow</p>
            </button>
            <button className="w-full text-left p-3 bg-success-50 hover:bg-success-100 rounded-lg transition-colors duration-200">
              <p className="font-medium text-success-900">Add Customer</p>
              <p className="text-sm text-success-700">Register a new customer</p>
            </button>
            <button className="w-full text-left p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors duration-200">
              <p className="font-medium text-indigo-900">Log Call</p>
              <p className="text-sm text-indigo-700">Record a customer call</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
import { useState, useEffect } from 'react';
import { notificationsAPI } from '../services/api';
import { Bell, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Notification } from '../types';

function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await notificationsAPI.getAll();
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Your recent alerts and updates</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button onClick={markAllAsRead} className="btn-secondary">
            Mark All as Read
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="card space-y-4">
          {notifications.map(notification => (
            <div key={notification._id} className={`p-4 rounded-lg flex items-start space-x-4 ${notification.isRead ? 'bg-gray-50' : 'bg-primary-50'}`}>
              <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${notification.isRead ? 'bg-gray-200 text-gray-500' : 'bg-primary-100 text-primary-600'}`}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                  {notification.link ? (
                    <Link to={notification.link} className="hover:underline">{notification.message}</Link>
                  ) : (
                    notification.message
                  )}
                </p>
                <div className="text-xs text-gray-500 mt-1 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
              {!notification.isRead && (
                <button onClick={() => markAsRead(notification._id)} className="text-xs text-primary-600 hover:underline">
                  Mark as read
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
            <Bell className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No new notifications</h3>
          <p className="text-gray-600">You're all caught up!</p>
        </div>
      )}
    </div>
  );
}

export default Notifications;

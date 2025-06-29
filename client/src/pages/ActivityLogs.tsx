import React, { useState, useEffect } from 'react';
import { activityLogsAPI } from '../services/api';
import { format } from 'date-fns';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { ActivityLog } from '../types';

const iconMap: { [key: string]: React.ElementType } = {
  CREATED: Plus,
  UPDATED: Edit,
  DELETED: Trash2,
};

function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const response = await activityLogsAPI.getAll();
        setLogs(response.data.logs);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
        <p className="text-gray-600 mt-1">A timeline of all actions taken in the workspace.</p>
      </div>

      {logs.length > 0 ? (
        <div className="flow-root">
          <ul className="-mb-8">
            {logs.map((log, logIdx) => {
              const Icon = iconMap[log.action] || Edit;
              return (
                <li key={log._id}>
                  <div className="relative pb-8">
                    {logIdx !== logs.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                          <Icon className="h-5 w-5 text-gray-500" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium text-gray-900">{log.user.name}</span> {log.details}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime={log.createdAt}>{format(new Date(log.createdAt), 'MMM dd, yyyy, h:mm a')}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <div className="card text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No activities found</h3>
          <p className="text-gray-600">System activities will appear here.</p>
        </div>
      )}
    </div>
  );
}

export default ActivityLogs;

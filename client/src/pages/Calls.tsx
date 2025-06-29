import { useState, useEffect } from 'react';
import { Plus, Search, Phone, Clock, User } from 'lucide-react';
import { callsAPI } from '../services/api';
import { format } from 'date-fns';
import { Call, CallInput } from '../types';
import CallModal from '../components/CallModal';

function Calls() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [callTypeFilter, setCallTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCall, setEditingCall] = useState<Call | null>(null);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      const response = await callsAPI.getAll();
      setCalls(response.data.calls);
    } catch (error) {
      console.error('Error loading calls:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCall = async (callData: CallInput) => {
    try {
      if (editingCall) {
        const response = await callsAPI.update(editingCall._id, callData);
        setCalls(calls.map(c => c._id === editingCall._id ? response.data.call : c));
      } else {
        const response = await callsAPI.create(callData);
        setCalls([response.data.call, ...calls]);
      }
      setIsModalOpen(false);
      setEditingCall(null);
    } catch (error: any) {
      console.error('Error saving call:', error);
      if (error.response?.data?.errors) {
        const errorMsg = error.response.data.errors.map((e: any) => e.msg).join(', ');
        alert(`Validation failed: ${errorMsg}`);
      } else if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      }
    }
  };

  const handleDeleteCall = async (callId: string) => {
    if (window.confirm('Are you sure you want to delete this call log?')) {
      try {
        await callsAPI.delete(callId);
        setCalls(calls.filter(c => c._id !== callId));
      } catch (error) {
        console.error('Error deleting call:', error);
      }
    }
  };

  const filteredCalls = calls.filter(call => {
    const matchesSearch = 
      call.customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = callTypeFilter === 'all' || call.callType === callTypeFilter;
    
    return matchesSearch && matchesType;
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
          <h1 className="text-2xl font-bold text-gray-900">Call Logs</h1>
          <p className="text-gray-600">Track and manage customer calls</p>
        </div>
        <button onClick={() => { setEditingCall(null); setIsModalOpen(true); }} className="btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Log Call
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search calls..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="select-field"
            value={callTypeFilter}
            onChange={(e) => setCallTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </select>
        </div>
      </div>

      {/* Calls List */}
      {filteredCalls.length > 0 ? (
        <div className="space-y-4">
          {filteredCalls.map((call) => (
            <div key={call._id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-full ${
                    call.callType === 'inbound' 
                      ? 'bg-success-100 text-success-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    <Phone className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {call.customer.companyName}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        call.callType === 'inbound'
                          ? 'bg-success-100 text-success-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {call.callType.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{call.summary}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        <span>{call.user.name}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{format(new Date(call.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                      {call.duration && (
                        <div className="flex items-center">
                          <span>Duration: {Math.floor(call.duration / 60)}m {call.duration % 60}s</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button onClick={() => { setEditingCall(call); setIsModalOpen(true); }} className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteCall(call._id)} className="text-sm text-danger-600 hover:text-danger-800 font-medium">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
            <Phone className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No calls found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || callTypeFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by logging your first call'
            }
          </p>
          <button onClick={() => { setEditingCall(null); setIsModalOpen(true); }} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Log Call
          </button>
        </div>
      )}

      <CallModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCall(null); }}
        onSave={handleSaveCall}
        callToEdit={editingCall}
      />
    </div>
  );
}

export default Calls;
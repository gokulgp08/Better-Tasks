import React, { useState, useEffect } from 'react';
import { CallInput, Customer } from '../types';
import { customersAPI } from '../services/api';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (call: CallInput) => void;
  callToEdit?: {
    _id: string;
    customer: { _id: string };
    callType: 'inbound' | 'outbound';
    summary: string;
    duration?: number;
  } | null;
}

const CallModal: React.FC<CallModalProps> = ({ isOpen, onClose, onSave, callToEdit }) => {
  const emptyCall: CallInput = {
    customer: '',
    callType: 'outbound',
    summary: '',
    duration: 0,
  };

  const [call, setCall] = useState<CallInput>(emptyCall);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (isOpen) {
      customersAPI.getAll().then(response => {
        setCustomers(response.data.customers);
      });

      if (callToEdit) {
        setCall({
          customer: callToEdit.customer._id,
          callType: callToEdit.callType,
          summary: callToEdit.summary,
          duration: callToEdit.duration || 0,
        });
      } else {
        setCall(emptyCall);
      }
    }
  }, [callToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCall({ ...call, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(call);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6">{callToEdit ? 'Edit Call Log' : 'Log New Call'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="customer" className="block text-sm font-medium text-gray-700">Customer</label>
            <select id="customer" name="customer" value={call.customer} onChange={handleChange} className="select-field" required>
              <option value="" disabled>Select a customer</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>{c.companyName}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="callType" className="block text-sm font-medium text-gray-700">Call Type</label>
            <select id="callType" name="callType" value={call.callType} onChange={handleChange} className="select-field" required>
              <option value="outbound">Outbound</option>
              <option value="inbound">Inbound</option>
            </select>
          </div>

          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700">Summary</label>
            <textarea id="summary" name="summary" value={call.summary} onChange={handleChange} className="input-field min-h-[100px]" required />
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duration (in seconds)</label>
            <input type="number" id="duration" name="duration" value={call.duration} onChange={handleChange} className="input-field" />
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {callToEdit ? 'Save Changes' : 'Log Call'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CallModal;

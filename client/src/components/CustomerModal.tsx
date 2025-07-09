import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Customer, CustomerInput } from '../types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: CustomerInput) => void;
  customerToEdit?: Customer | null;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onSave, customerToEdit }) => {
  const emptyCustomer: CustomerInput = {
    companyName: '',
    companyType: '',
    gst: '',
    url: '',
    installationDate: '',
    contacts: [{ name: '', email: '', phone: '', designation: '' }],
  };

  const [customer, setCustomer] = useState<CustomerInput>(customerToEdit || emptyCustomer);

  useEffect(() => {
    if (customerToEdit) {
      const installationDate = customerToEdit.installationDate
        ? new Date(customerToEdit.installationDate).toISOString().split('T')[0]
        : '';
      setCustomer({ ...customerToEdit, installationDate });
    } else {
      setCustomer(emptyCustomer);
    }
  }, [customerToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCustomer({ ...customer, [name]: value });
  };

  const handleContactChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedContacts = [...customer.contacts];
    updatedContacts[index] = { ...updatedContacts[index], [name]: value };
    setCustomer({ ...customer, contacts: updatedContacts });
  };

  const addContact = () => {
    setCustomer({
      ...customer,
      contacts: [...customer.contacts, { name: '', email: '', phone: '', designation: '' }],
    });
  };

  const removeContact = (index: number) => {
    const updatedContacts = customer.contacts.filter((_, i) => i !== index);
    setCustomer({ ...customer, contacts: updatedContacts });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(customer);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{customerToEdit ? 'Edit Customer' : 'New Customer'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name</label>
              <input type="text" id="companyName" name="companyName" value={customer.companyName} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label htmlFor="companyType" className="block text-sm font-medium text-gray-700">Company Type</label>
              <input type="text" id="companyType" name="companyType" value={customer.companyType} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label htmlFor="gst" className="block text-sm font-medium text-gray-700">GST Number</label>
              <input type="text" id="gst" name="gst" value={customer.gst || ''} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700">Website URL</label>
              <input type="url" id="url" name="url" value={customer.url || ''} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label htmlFor="installationDate" className="block text-sm font-medium text-gray-700">Installation Date</label>
              <input type="date" id="installationDate" name="installationDate" value={customer.installationDate || ''} onChange={handleChange} className="input-field" />
            </div>
          </div>

          {/* Contacts Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contacts</h3>
            <div className="space-y-4">
              {customer.contacts.map((contact, index) => (
                <div key={index} className="p-4 border rounded-md relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="name" placeholder="Name" value={contact.name} onChange={(e) => handleContactChange(index, e)} className="input-field" required />
                    <input type="email" name="email" placeholder="Email" value={contact.email} onChange={(e) => handleContactChange(index, e)} className="input-field" required />
                    <input type="text" name="phone" placeholder="Phone" value={contact.phone} onChange={(e) => handleContactChange(index, e)} className="input-field" />
                    <input type="text" name="designation" placeholder="Designation" value={contact.designation} onChange={(e) => handleContactChange(index, e)} className="input-field" />
                  </div>
                  {customer.contacts.length > 1 && (
                    <button type="button" onClick={() => removeContact(index)} className="absolute top-2 right-2 text-gray-400 hover:text-danger-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addContact} className="mt-4 flex items-center text-sm font-medium text-primary-600 hover:text-primary-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {customerToEdit ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;

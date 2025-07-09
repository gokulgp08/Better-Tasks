import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Building2, Phone, Mail } from 'lucide-react';
import { customersAPI } from '../services/api';
import CustomerModal from '../components/CustomerModal';
import { Customer, CustomerInput } from '../types';

function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customersAPI.getAll();
      setCustomers(response.data.customers);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCustomer = async (customerData: CustomerInput) => {
    try {
      if (editingCustomer) {
        const response = await customersAPI.update(editingCustomer._id, customerData);
        setCustomers(customers.map(c => c._id === editingCustomer._id ? response.data.customer : c));
      } else {
        const response = await customersAPI.create(customerData);
        setCustomers([response.data.customer, ...customers]);
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
    } catch (error: any) {
      console.error('Error saving customer:', error);
      if (error.response?.data?.errors) {
        const errorMsg = error.response.data.errors.map((e: any) => e.msg).join(', ');
        alert(`Validation failed: ${errorMsg}`);
      } else if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      }
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        await customersAPI.delete(customerId);
        setCustomers(customers.filter(c => c._id !== customerId));
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.companyType.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }} className="btn-primary flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search customers..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div key={customer._id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {customer.companyName}
                    </h3>
                    <p className="text-sm text-gray-600">{customer.companyType}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">GST:</span>
                  <span className="ml-2 text-gray-600">{customer.gst || 'Not provided'}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Contacts:</span>
                  <span className="ml-2 text-gray-600">{customer.contacts.length}</span>
                </div>
                {customer.url && (
                  <div className="text-sm truncate">
                    <span className="font-medium text-gray-700">URL:</span>
                    <a href={customer.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary-600 hover:underline">
                      {customer.url}
                    </a>
                  </div>
                )}
                {customer.installationDate && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Installed:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(customer.installationDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {customer.contacts.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Primary Contact</h4>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">{customer.contacts[0].name}</span>
                      <span className="ml-2 text-gray-500">({customer.contacts[0].designation})</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      <span>{customer.contacts[0].email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{customer.contacts[0].phone}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <span className="text-xs text-gray-500">
                  Added {new Date(customer.createdAt).toLocaleDateString()}
                </span>
                <div className="flex space-x-2">
                  <button className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                    View
                  </button>
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <>
                      <button onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }} className="text-sm text-gray-600 hover:text-gray-800 font-medium">
                        Edit
                      </button>
                      <button onClick={() => handleDeleteCustomer(customer._id)} className="text-sm text-danger-600 hover:text-danger-800 font-medium">
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
            <Building2 className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Get started by adding your first customer'
            }
          </p>
          {user?.role === 'admin' && (
            <button onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </button>
          )}
        </div>
      )}

      <CustomerModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCustomer(null); }}
        onSave={handleSaveCustomer}
        customerToEdit={editingCustomer}
      />
    </div>
  );
}

export default Customers;
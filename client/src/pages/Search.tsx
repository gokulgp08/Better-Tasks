import React, { useState } from 'react';
import { searchAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { Task, Customer, Call } from '../types';
import { Search as SearchIcon, Briefcase, Users, Phone } from 'lucide-react';

interface SearchResults {
  tasks: Task[];
  customers: Customer[];
  calls: Call[];
}

function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await searchAPI.search(query);
      setResults(response.data);
    } catch (error) {
      console.error('Error performing search:', error);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Search</h1>
        <p className="text-gray-600 mt-1">Find anything across your workspace.</p>
      </div>

      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-grow">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for tasks, customers, calls..."
            className="input-field pl-10 w-full"
          />
        </div>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {results && !isLoading && (
        <div className="space-y-6">
          {/* Tasks */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center"><Briefcase className="w-5 h-5 mr-3 text-primary-600"/>Tasks ({results.tasks.length})</h2>
            {results.tasks.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {results.tasks.map(task => (
                  <li key={task._id} className="py-3">
                    <Link to={`/tasks`} className="text-primary-600 hover:underline font-medium">{task.title}</Link>
                    <p className="text-sm text-gray-500">{task.description}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-gray-500">No tasks found.</p>}
          </div>

          {/* Customers */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center"><Users className="w-5 h-5 mr-3 text-primary-600"/>Customers ({results.customers.length})</h2>
            {results.customers.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {results.customers.map(customer => (
                  <li key={customer._id} className="py-3">
                    <Link to={`/customers`} className="text-primary-600 hover:underline font-medium">{customer.companyName}</Link>
                    <p className="text-sm text-gray-500">{customer.companyType}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-gray-500">No customers found.</p>}
          </div>

          {/* Calls */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center"><Phone className="w-5 h-5 mr-3 text-primary-600"/>Calls ({results.calls.length})</h2>
            {results.calls.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {results.calls.map(call => (
                  <li key={call._id} className="py-3">
                    <Link to={`/calls`} className="text-primary-600 hover:underline font-medium">Call with {call.customer.companyName}</Link>
                    <p className="text-sm text-gray-500">{call.summary}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-gray-500">No calls found.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default Search;

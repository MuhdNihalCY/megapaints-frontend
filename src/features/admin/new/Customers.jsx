import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Loader2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import CustomerForm from '../components/CustomerForm';

const Customers = () => {
  const { getAdminServices, getUserServices } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      // Customers use user API service
      const userServices = getUserServices();
      const response = await userServices.user.getCustomers({ limit: 100 });
      if (response.status === 'success') {
        setCustomers(response.data.customers || []);
      } else {
        setError(response.message || 'Failed to fetch customers');
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError(err.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      const userServices = getUserServices();
      const response = await userServices.user.deleteCustomer(customerId);
      if (response.status === 'success') {
        await fetchCustomers();
      } else {
        alert(response.message || 'Failed to delete customer');
      }
    } catch (err) {
      console.error('Failed to delete customer:', err);
      alert('Failed to delete customer');
    }
  };

  const handleFormSuccess = () => {
    fetchCustomers();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
        <button
          onClick={handleAdd}
          className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Customer
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                      Email
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                      Phone
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                      Company
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-3 sm:px-6 py-12 text-center">
                        <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                        <p className="text-gray-500 dark:text-gray-400">Loading customers...</p>
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-3 sm:px-6 py-12 text-center">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No customers found</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                          Get started by adding a new customer
                        </p>
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr key={customer._id || customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          <span className="truncate block max-w-[80px]">{customer._id?.toString().slice(-8) || customer.id}</span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          <span className="truncate block max-w-[120px] sm:max-w-none">{customer.name}</span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden md:table-cell">
                          <span className="truncate block max-w-[200px]">{customer.email}</span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                          {customer.phone || '-'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                          <span className="truncate block max-w-[150px]">{customer.company || '-'}</span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-1 sm:space-x-2">
                            <button
                              onClick={() => handleEdit(customer)}
                              className="inline-flex items-center px-2 sm:px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 sm:mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(customer._id || customer.id)}
                              className="inline-flex items-center px-2 sm:px-3 py-1.5 border border-red-300 dark:border-red-600 rounded-lg bg-white dark:bg-gray-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 sm:mr-1" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onClose={() => {
            setShowForm(false);
            setEditingCustomer(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default Customers;

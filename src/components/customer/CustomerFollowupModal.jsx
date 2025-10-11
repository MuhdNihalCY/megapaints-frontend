/**
 * CustomerFollowupModal Component
 * General customer follow-up management modal for use across the application
 * Provides CRUD operations for customer follow-ups
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Search, Plus, Edit2, Trash2, Calendar, Clock, User, 
  Phone, Mail, MapPin, AlertCircle, Save, CheckCircle
} from 'lucide-react';
import api from '../../utils/api';

const CustomerFollowupModal = ({ isOpen, onClose, user, mode = 'manage' }) => {
  const [followups, setFollowups] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingFollowup, setEditingFollowup] = useState(null);
  const [newFollowup, setNewFollowup] = useState({
    customer_id: '',
    followup_type: 'call',
    subject: '',
    description: '',
    followup_date: '',
    status: 'scheduled',
    priority: 'medium',
    assigned_to: user?.id || '',
    outcome: '',
    next_followup_date: '',
    tags: [],
    attachments: []
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load followups and customers
  useEffect(() => {
    if (isOpen) {
      loadFollowups();
      loadCustomers();
    }
  }, [isOpen]);

  const loadFollowups = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        ...(searchQuery ? { search: searchQuery } : {})
      };
      
      const response = await api.get('/customer-followups', { params });
      setFollowups(response.data.followups || []);
    } catch (err) {
      console.error('Failed to load followups:', err);
      setError('Failed to load followups');
      setFollowups([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
      setCustomers([]);
    }
  };

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(loadFollowups, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleCreateFollowup = async () => {
    if (!newFollowup.customer_id || !newFollowup.subject.trim() || !newFollowup.followup_date) {
      setCreateError('Customer, subject, and follow-up date are required');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const response = await api.post('/customer-followups', newFollowup);
      console.log('✅ Follow-up created:', response.data);
      
      // Reset form
      setNewFollowup({
        customer_id: '',
        followup_type: 'call',
        subject: '',
        description: '',
        followup_date: '',
        status: 'scheduled',
        priority: 'medium',
        assigned_to: user?.id || '',
        outcome: '',
        next_followup_date: '',
        tags: [],
        attachments: []
      });
      
      setShowCreateForm(false);
      loadFollowups(); // Reload followups
    } catch (err) {
      console.error('Failed to create follow-up:', err);
      setCreateError(err.response?.data?.message || 'Failed to create follow-up');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateFollowup = async () => {
    if (!editingFollowup) return;

    setUpdating(true);
    setUpdateError(null);

    try {
      const response = await api.put(`/customer-followups/${editingFollowup._id}`, editingFollowup);
      console.log('✅ Follow-up updated:', response.data);
      
      setShowEditForm(false);
      setEditingFollowup(null);
      loadFollowups(); // Reload followups
    } catch (err) {
      console.error('Failed to update follow-up:', err);
      setUpdateError(err.response?.data?.message || 'Failed to update follow-up');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteFollowup = async (followupId) => {
    try {
      await api.delete(`/customer-followups/${followupId}`);
      console.log('✅ Follow-up deleted:', followupId);
      
      setDeleteConfirm(null);
      loadFollowups(); // Reload followups
    } catch (err) {
      console.error('Failed to delete follow-up:', err);
      setError('Failed to delete follow-up');
    }
  };

  const handleEditFollowup = (followup) => {
    setEditingFollowup({ ...followup });
    setShowEditForm(true);
  };

  const getFollowupTypeIcon = (type) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'meeting': return <User className="w-4 h-4" />;
      case 'visit': return <MapPin className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Customer Follow-ups
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Search and Actions */}
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search follow-ups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Follow-up
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Follow-ups List */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {followups.map((followup) => (
                  <div
                    key={followup._id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          {getFollowupTypeIcon(followup.followup_type)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {followup.subject}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{followup.customer_id?.name || 'Unknown Customer'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(followup.followup_date).toLocaleDateString()}</span>
                            </div>
                            {followup.assigned_to && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{followup.assigned_to?.first_name || followup.assigned_to?.username}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(followup.priority)}`}>
                          {followup.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(followup.status)}`}>
                          {followup.status}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditFollowup(followup)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                            title="Edit Follow-up"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(followup)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Delete Follow-up"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {followups.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No follow-ups found</p>
                    <p className="text-sm">Create your first follow-up to get started</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Create Follow-up Form */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Create New Follow-up
                    </h3>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Customer *
                        </label>
                        <select
                          value={newFollowup.customer_id}
                          onChange={(e) => setNewFollowup({ ...newFollowup, customer_id: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Select Customer</option>
                          {customers.map((customer) => (
                            <option key={customer._id} value={customer._id}>
                              {customer.name} {customer.company && `(${customer.company})`}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Follow-up Type
                        </label>
                        <select
                          value={newFollowup.followup_type}
                          onChange={(e) => setNewFollowup({ ...newFollowup, followup_type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="call">Call</option>
                          <option value="email">Email</option>
                          <option value="meeting">Meeting</option>
                          <option value="visit">Visit</option>
                          <option value="quote">Quote</option>
                          <option value="proposal">Proposal</option>
                          <option value="follow_up">Follow-up</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Subject *
                        </label>
                        <input
                          type="text"
                          value={newFollowup.subject}
                          onChange={(e) => setNewFollowup({ ...newFollowup, subject: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Follow-up subject"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Follow-up Date *
                        </label>
                        <input
                          type="datetime-local"
                          value={newFollowup.followup_date}
                          onChange={(e) => setNewFollowup({ ...newFollowup, followup_date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Priority
                        </label>
                        <select
                          value={newFollowup.priority}
                          onChange={(e) => setNewFollowup({ ...newFollowup, priority: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Status
                        </label>
                        <select
                          value={newFollowup.status}
                          onChange={(e) => setNewFollowup({ ...newFollowup, status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="rescheduled">Rescheduled</option>
                          <option value="no_answer">No Answer</option>
                          <option value="busy">Busy</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={newFollowup.description}
                        onChange={(e) => setNewFollowup({ ...newFollowup, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Follow-up description"
                      />
                    </div>

                    {createError && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span>{createError}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateFollowup}
                        disabled={creating}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {creating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Creating...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Create Follow-up</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delete Confirmation */}
          <AnimatePresence>
            {deleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Delete Follow-up
                    </h3>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Are you sure you want to delete <strong>{deleteConfirm.subject}</strong>? 
                    This action cannot be undone.
                  </p>
                  
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteFollowup(deleteConfirm._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CustomerFollowupModal;

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'creator' | 'analyst';
  credits: number;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  image?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'creator' as 'creator' | 'analyst',
    credits: 0,
  });
  
  const [submitting, setSubmitting] = useState(false);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter, pagination.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        toast.error(data.error || 'Failed to fetch users');
      }
    } catch (error) {
      toast.error('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  // CREATE USER
  
  // UPDATE USER
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setSubmitting(true);
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('User updated successfully');
        setShowEditModal(false);
        setSelectedUser(null);
        resetForm();
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Error updating user');
    } finally {
      setSubmitting(false);
    }
  };

  // SUSPEND/ACTIVATE USER
  const handleToggleStatus = async () => {
    if (!selectedUser) return;

    const action = selectedUser.emailVerified ? 'suspend' : 'activate';
    setSubmitting(true);
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          action,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`User ${action}d successfully`);
        setShowSuspendModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        toast.error(data.error || `Failed to ${action} user`);
      }
    } catch (error) {
      toast.error(`Error ${action}ing user`);
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE USER
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/admin/users?id=${selectedUser.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('User deleted successfully');
        setShowDeleteModal(false);
        setSelectedUser(null);
        
        if (users.length === 1 && pagination.page > 1) {
          setPagination(prev => ({ ...prev, page: prev.page - 1 }));
        } else {
          fetchUsers();
        }
      } else {
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Error deleting user');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'creator',
      credits: 0,
    });
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      credits: user.credits,
    });
    setShowEditModal(true);
  };

  const openSuspendModal = (user: User) => {
    setSelectedUser(user);
    setShowSuspendModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusBadge = (verified: boolean) => {
    return verified ? (
      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium whitespace-nowrap">
        Active
      </span>
    ) : (
      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium whitespace-nowrap">
        Suspended
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    return role === 'creator' ? (
      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium whitespace-nowrap">
        Creator
      </span>
    ) : (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium whitespace-nowrap">
        Analyst
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">Manage creator and analyst users</p>
          </div>
          {/* <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 whitespace-nowrap"
          >
            + Add New User
          </button> */}
          <Link
  href="/dashboard/admin/users/create"
  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 whitespace-nowrap inline-flex items-center"
>
  + Add New User
</Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 min-w-[120px]"
            >
              <option value="">All Roles</option>
              <option value="creator">Creator</option>
              <option value="analyst">Analyst</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 min-w-[120px]"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            {(search || roleFilter || statusFilter) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Users Table with Horizontal Scroll */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <span className="ml-3">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium">{user.credits}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.emailVerified)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2 min-w-[240px]">
                          {/* EDIT BUTTON */}
                          <button
                            onClick={() => openEditModal(user)}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium min-w-[60px] transition-colors"
                          >
                            Edit
                          </button>
                          
                          {/* SUSPEND/ACTIVATE BUTTON */}
                          <button
                            onClick={() => openSuspendModal(user)}
                            className={`px-3 py-1.5 text-white rounded-md text-sm font-medium min-w-[70px] transition-colors ${
                              user.emailVerified 
                                ? 'bg-yellow-600 hover:bg-yellow-700' 
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {user.emailVerified ? 'Suspend' : 'Activate'}
                          </button>
                          
                          {/* DELETE BUTTON */}
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium min-w-[60px] transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ADD USER MODAL */}
       

        {/* EDIT USER MODAL */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit User</h2>
              <form onSubmit={handleUpdateUser}>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Name"
                    required
                    className="w-full px-3 py-2 border rounded"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    className="w-full px-3 py-2 border rounded"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <select
                    className="w-full px-3 py-2 border rounded"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'creator' | 'analyst' })}
                  >
                    <option value="creator">Creator</option>
                    <option value="analyst">Analyst</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Credits"
                    min="0"
                    className="w-full px-3 py-2 border rounded"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUSPEND MODAL */}
        {showSuspendModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {selectedUser.emailVerified ? 'Suspend User' : 'Activate User'}
              </h2>
              <p className="text-gray-600 mb-6">
                {selectedUser.emailVerified
                  ? `Are you sure you want to suspend ${selectedUser.name}?`
                  : `Are you sure you want to activate ${selectedUser.name}?`
                }
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleToggleStatus}
                  disabled={submitting}
                  className={`px-4 py-2 text-white rounded ${
                    selectedUser.emailVerified 
                      ? 'bg-yellow-600 hover:bg-yellow-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  } disabled:opacity-50`}
                >
                  {submitting 
                    ? (selectedUser.emailVerified ? 'Suspending...' : 'Activating...')
                    : (selectedUser.emailVerified ? 'Suspend' : 'Activate')
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE MODAL */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-red-600 mb-4">Delete User</h2>
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete <span className="font-semibold">{selectedUser.name}</span>?
              </p>
              <p className="text-sm text-red-600 mb-6">
                This action cannot be undone. All user data will be permanently removed.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
  role: string;
  createdAt: Date;
}

interface ToolPricing {
  id: number;
  tool_name: string;
  credits_required: number;
}

interface Transaction {
  id: number;
  userId: string;
  amount: number;
  type: string;
  description: string;
  remainingCredits: number;
  createdAt: Date;
  userName?: string;
  userEmail?: string;
}

export default function AdminCreditUpdatePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [tools, setTools] = useState<ToolPricing[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDescription, setCreditDescription] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showToolModal, setShowToolModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolPricing | null>(null);
  const [toolCredits, setToolCredits] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkDescription, setBulkDescription] = useState('');
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/credits/update?type=all');
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
        setTools(data.tools || []);
        setTransactions(data.recentTransactions || []);
      } else {
        toast.error(data.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserCredits = async () => {
    if (!selectedUser) return;
    
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount === 0) {
      toast.error('Please enter a valid amount (non-zero)');
      return;
    }

    try {
      const response = await fetch('/api/admin/credits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-user-credits',
          userId: selectedUser.id,
          amount,
          description: creditDescription || `Admin ${amount > 0 ? 'added' : 'deducted'} ${Math.abs(amount)} credits`
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        // Update local state
        setUsers(users.map(u => 
          u.id === selectedUser.id ? { ...u, credits: data.user.credits } : u
        ));
        setShowUserModal(false);
        setCreditAmount('');
        setCreditDescription('');
        setSelectedUser(null);
        // Refresh transactions
        fetchData();
      } else {
        toast.error(data.error || 'Failed to update credits');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Error updating credits');
    }
  };

  const handleUpdateToolPricing = async () => {
    if (!selectedTool) return;
    
    const credits = parseInt(toolCredits);
    if (isNaN(credits) || credits < 1) {
      toast.error('Please enter a valid credit amount (minimum 1)');
      return;
    }

    try {
      const response = await fetch('/api/admin/credits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-tool-pricing',
          toolName: selectedTool.tool_name,
          creditsRequired: credits
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        // Update local state
        setTools(tools.map(t => 
          t.tool_name === selectedTool.tool_name ? { ...t, credits_required: credits } : t
        ));
        setShowToolModal(false);
        setToolCredits('');
        setSelectedTool(null);
      } else {
        toast.error(data.error || 'Failed to update tool pricing');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Error updating tool pricing');
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    const amount = parseInt(bulkAmount);
    if (isNaN(amount) || amount === 0) {
      toast.error('Please enter a valid amount (non-zero)');
      return;
    }

    try {
      const response = await fetch('/api/admin/credits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk-update-credits',
          userIds: selectedUsers,
          amount,
          description: bulkDescription || `Bulk ${amount > 0 ? 'addition' : 'deduction'} of ${Math.abs(amount)} credits`
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setSelectedUsers([]);
        setBulkAmount('');
        setBulkDescription('');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to bulk update');
      }
    } catch (error) {
      console.error('Bulk update error:', error);
      toast.error('Error performing bulk update');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const formatToolName = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading credit update panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Credit Update Panel</h1>
          <p className="text-gray-600 mt-2">Update user credits and tool pricing</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              User Credits
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'tools'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Tool Pricing
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'transactions'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Transaction History
            </button>
          </nav>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-gray-900">{users.length}</p>
            <p className="text-sm text-gray-500 mt-2">Across all roles</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Credits Issued</h3>
            <p className="text-3xl font-bold text-gray-900">
              {users.reduce((sum, u) => sum + (u.credits || 0), 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-2">System-wide balance</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Average Credits</h3>
            <p className="text-3xl font-bold text-gray-900">
              {users.length > 0 ? Math.round(users.reduce((sum, u) => sum + (u.credits || 0), 0) / users.length) : 0}
            </p>
            <p className="text-sm text-gray-500 mt-2">Per user average</p>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <>
            {/* Bulk Update Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Bulk Credit Update</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selected Users: {selectedUsers.length}
                  </label>
                  <button
                    onClick={selectAllUsers}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All Visible'}
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={bulkAmount}
                    onChange={(e) => setBulkAmount(e.target.value)}
                    placeholder="+/- credits"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={bulkDescription}
                    onChange={(e) => setBulkDescription(e.target.value)}
                    placeholder="Reason for update"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <button
                    onClick={handleBulkUpdate}
                    disabled={selectedUsers.length === 0 || !bulkAmount}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                  >
                    Apply to Selected
                  </button>
                </div>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">User Credits</h2>
              
              {/* Filters */}
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="creator">Creator</option>
                  <option value="analyst">Analyst</option>
                </select>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 w-10">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={selectAllUsers}
                          className="rounded"
                        />
                      </th>
                      <th className="text-left py-2 text-sm font-medium text-gray-500">User</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-500">Role</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-500">Credits</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="py-3">
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'creator' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="text-right py-3 font-medium">{user.credits}</td>
                        <td className="text-right py-3">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setCreditAmount('');
                              setCreditDescription('');
                              setShowUserModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'tools' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Tool Pricing Management</h2>
            <div className="space-y-4">
              {tools.map((tool) => (
                <div key={tool.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <h3 className="font-medium capitalize">{formatToolName(tool.tool_name)}</h3>
                    <p className="text-sm text-gray-500">Current price: {tool.credits_required} credits</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTool(tool);
                      setToolCredits(tool.credits_required.toString());
                      setShowToolModal(true);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Edit Pricing
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 text-sm font-medium text-gray-500">User</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Type</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Description</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Amount</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Balance</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-gray-50">
                      <td className="py-3">
                        <div>
                          <div className="font-medium">{tx.userName || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{tx.userEmail}</div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          tx.type === 'purchase' ? 'bg-green-100 text-green-800' :
                          tx.type === 'bonus' ? 'bg-blue-100 text-blue-800' :
                          tx.type === 'refund' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 text-sm">{tx.description}</td>
                      <td className={`text-right py-3 font-medium ${
                        tx.type === 'purchase' || tx.type === 'bonus' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.type === 'purchase' || tx.type === 'bonus' ? '+' : '-'}{tx.amount}
                      </td>
                      <td className="text-right py-3 font-medium">{tx.remainingCredits}</td>
                      <td className="text-right py-3 text-sm text-gray-500">
                        {formatDate(tx.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Credit Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Adjust Credits</h2>
                
                <div className="mb-4">
                  <div className="font-medium">{selectedUser.name}</div>
                  <div className="text-sm text-gray-600">{selectedUser.email}</div>
                  <div className="mt-2 p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Current Balance:</span>
                    <span className="ml-2 text-lg font-bold text-purple-600">{selectedUser.credits}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credit Amount (+/-)
                  </label>
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="Enter positive or negative number"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={creditDescription}
                    onChange={(e) => setCreditDescription(e.target.value)}
                    placeholder="Reason for adjustment"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateUserCredits}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Update Credits
                  </button>
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      setSelectedUser(null);
                      setCreditAmount('');
                      setCreditDescription('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tool Pricing Modal */}
        {showToolModal && selectedTool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Edit Tool Pricing</h2>
                
                <div className="mb-4">
                  <div className="font-medium capitalize">{formatToolName(selectedTool.tool_name)}</div>
                  <div className="text-sm text-gray-600 mt-1">Current: {selectedTool.credits_required} credits</div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Credit Amount
                  </label>
                  <input
                    type="number"
                    value={toolCredits}
                    onChange={(e) => setToolCredits(e.target.value)}
                    min="1"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateToolPricing}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Update Pricing
                  </button>
                  <button
                    onClick={() => {
                      setShowToolModal(false);
                      setSelectedTool(null);
                      setToolCredits('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  FiSearch, 
  FiFilter, 
  FiToggleLeft, 
  FiToggleRight, 
  FiSave,
  FiX,
  FiCheck,
  FiClock,
  FiUser,
  FiTool,
  FiGlobe,
  FiSettings,
  FiRefreshCw,
  FiAlertCircle
} from 'react-icons/fi';

// Define types for better type safety
interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  credits: number | null;
  createdAt?: Date;
}

interface Tool {
  tool_name: string;
  credits_required: number;
  global_enabled: boolean | null;
}

interface UserPermission {
  toolName: string;
  enabled: boolean | null;
  isCustom: boolean;
}

interface UserWithPermissions extends User {
  toolPermissions?: UserPermission[];
}

interface RecentChange {
  id: number;
  userId: string;
  userName: string | null;
  userEmail: string;
  toolName: string;
  isEnabled: boolean;
  updatedBy: string | null;
  updatedAt: string;
}

interface Summary {
  totalUsers: number;
  totalTools: number;
  totalCustomPermissions: number;
  enabledCustomPermissions: number;
  disabledCustomPermissions: number;
  toolsWithGlobalDisabled: number;
}

export default function ToolPermissionsPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [recentChanges, setRecentChanges] = useState<RecentChange[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalUsers: 0,
    totalTools: 0,
    totalCustomPermissions: 0,
    enabledCustomPermissions: 0,
    disabledCustomPermissions: 0,
    toolsWithGlobalDisabled: 0
  });

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterTool, setFilterTool] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkTool, setBulkTool] = useState('');
  const [bulkAction, setBulkAction] = useState<'enable' | 'disable'>('enable');
  const [activeTab, setActiveTab] = useState<'users' | 'tools' | 'changes'>('users');
  const [error, setError] = useState<string | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [togglingTool, setTogglingTool] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Fetching permissions data...');
      const response = await fetch('/api/admin/tools/permissions?type=all');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📥 Received data:', data);

      if (data.success) {
        // Log the first user's permissions to see structure
        if (data.users && data.users.length > 0) {
          console.log('👤 Sample user permissions:', {
            userId: data.users[0].id,
            email: data.users[0].email,
            toolPermissions: data.users[0].toolPermissions
          });
        }

        // Ensure users array exists and has toolPermissions
        const safeUsers = (data.users || []).map((user: any) => ({
          ...user,
          toolPermissions: user.toolPermissions || [] // Default to empty array if missing
        }));
        
        setUsers(safeUsers);
        setTools(data.tools || []);
        setRecentChanges(data.recentChanges || []);
        setSummary(data.summary || {
          totalUsers: 0,
          totalTools: 0,
          totalCustomPermissions: 0,
          enabledCustomPermissions: 0,
          disabledCustomPermissions: 0,
          toolsWithGlobalDisabled: 0
        });
        
        console.log('✅ State updated with', safeUsers.length, 'users');
      } else {
        toast.error(data.error || 'Failed to fetch permissions data');
        setError(data.error || 'Failed to fetch permissions data');
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error loading permissions';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserTool = async (userId: string, toolName: string, currentStatus: boolean | null) => {
    console.log('🔧 Toggle clicked:', { userId, toolName, currentStatus, newStatus: !currentStatus });
    
    // Set loading state for this specific button
    setTogglingUserId(userId);
    setTogglingTool(toolName);
    
    try {
      const response = await fetch('/api/admin/tools/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-user-tool',
          userId,
          toolName,
          enabled: !currentStatus,
          updatedBy: 'admin'
        })
      });

      const data = await response.json();
      console.log('📥 Toggle response:', { status: response.status, data });

      if (response.ok && data.success) {
        toast.success(data.message);
        console.log('✅ Toggle successful, refreshing data...');
        
        // Update local state immediately for better UX
        setUsers(prevUsers => 
          prevUsers.map(user => {
            if (user.id === userId) {
              return {
                ...user,
                toolPermissions: user.toolPermissions?.map(perm => 
                  perm.toolName === toolName 
                    ? { ...perm, enabled: !currentStatus }
                    : perm
                )
              };
            }
            return user;
          })
        );
        
        // Still refresh from server to ensure consistency
        await fetchData();
        console.log('🔄 Data refreshed');
      } else {
        console.error('❌ Toggle failed:', data.error);
        toast.error(data.error || 'Failed to toggle tool');
      }
    } catch (error) {
      console.error('💥 Toggle error:', error);
      toast.error('Error updating permission');
    } finally {
      setTogglingUserId(null);
      setTogglingTool(null);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    if (!bulkTool) {
      toast.error('Please select a tool');
      return;
    }

    try {
      const response = await fetch('/api/admin/tools/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk-toggle-tool',
          userIds: selectedUsers,
          toolName: bulkTool,
          enabled: bulkAction === 'enable',
          updatedBy: 'admin'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message);
        setSelectedUsers([]);
        setShowBulkModal(false);
        await fetchData();
      } else {
        toast.error(data.error || 'Bulk update failed');
      }
    } catch (error) {
      console.error('Bulk update error:', error);
      toast.error('Error performing bulk update');
    }
  };

  const handleDisableAllTools = async (userId: string) => {
    if (!confirm('Are you sure you want to disable ALL tools for this user?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/tools/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disable-all-tools',
          userId,
          updatedBy: 'admin'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message);
        await fetchData();
      } else {
        toast.error(data.error || 'Failed to disable tools');
      }
    } catch (error) {
      console.error('Disable all error:', error);
      toast.error('Error disabling tools');
    }
  };

  const handleEnableAllTools = async (userId: string) => {
    if (!confirm('Are you sure you want to enable ALL tools for this user? This will revert to global settings.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/tools/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enable-all-tools',
          userId,
          updatedBy: 'admin'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message);
        await fetchData();
      } else {
        toast.error(data.error || 'Failed to enable tools');
      }
    } catch (error) {
      console.error('Enable all error:', error);
      toast.error('Error enabling tools');
    }
  };

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

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Safe filtering with optional chaining
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    if (filterTool !== 'all' && filterTool !== 'enabled' && filterTool !== 'disabled') {
      // Filter by specific tool
      const toolPerm = user.toolPermissions?.find(p => p.toolName === filterTool);
      return matchesSearch && matchesRole && toolPerm?.enabled === true;
    }
    
    if (filterTool === 'enabled') {
      // Users with at least one enabled tool
      const hasEnabled = user.toolPermissions?.some(p => p.enabled === true);
      return matchesSearch && matchesRole && hasEnabled;
    }
    
    if (filterTool === 'disabled') {
      // Users with all tools disabled
      const allDisabled = user.toolPermissions?.every(p => p.enabled === false);
      return matchesSearch && matchesRole && allDisabled;
    }
    
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tool permissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex justify-center items-center">
        <div className="text-center max-w-md">
          <FiAlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Tools Permissions</h1>
            <p className="text-gray-600 mt-2">Enable or disable AI tools for specific users</p>
          </div>
          <button
            onClick={fetchData}
            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Refresh data"
          >
            <FiRefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalUsers}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiUser className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Tools</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalTools}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FiTool className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Custom Permissions</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalCustomPermissions}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiSettings className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-green-600">Enabled: {summary.enabledCustomPermissions}</span>
              <span className="text-red-600">Disabled: {summary.disabledCustomPermissions}</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Globally Disabled</p>
                <p className="text-2xl font-bold text-gray-900">{summary.toolsWithGlobalDisabled}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FiGlobe className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiUser className="w-4 h-4" />
              Users & Permissions
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'tools'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiTool className="w-4 h-4" />
              Tools Overview
            </button>
            <button
              onClick={() => setActiveTab('changes')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'changes'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiClock className="w-4 h-4" />
              Recent Changes
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <>
            {/* Bulk Actions Bar */}
            <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  Selected: {selectedUsers.length} users
                </span>
                {selectedUsers.length > 0 && (
                  <>
                    <button
                      onClick={() => {
                        setBulkTool('');
                        setBulkAction('enable');
                        setShowBulkModal(true);
                      }}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                    >
                      Bulk Update
                    </button>
                    <button
                      onClick={selectAllUsers}
                      className="text-sm text-gray-600 hover:text-purple-600"
                    >
                      {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </>
                )}
              </div>
              
              {/* Filters */}
              <div className="flex gap-3">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 w-64"
                  />
                </div>
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
                <select
                  value={filterTool}
                  onChange={(e) => setFilterTool(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Tools</option>
                  <option value="enabled">Has Enabled Tools</option>
                  <option value="disabled">All Tools Disabled</option>
                  {tools.map(tool => (
                    <option key={tool.tool_name} value={tool.tool_name}>
                      {formatToolName(tool.tool_name)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={selectAllUsers}
                          className="rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credits
                      </th>
                      {tools.map(tool => (
                        <th key={tool.tool_name} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex flex-col items-center">
                            <span>{formatToolName(tool.tool_name)}</span>
                            {!tool.global_enabled && (
                              <span className="text-xs text-yellow-600 mt-1">(Global Off)</span>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{user.name || 'Unnamed'}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'creator' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium">{user.credits ?? 0}</td>
                        
                        {tools.map(tool => {
                          // Safely access toolPermissions with optional chaining
                          const permission = user.toolPermissions?.find(p => p.toolName === tool.tool_name);
                          const isEnabled = permission?.enabled ?? tool.global_enabled ?? true;
                          const isToggling = togglingUserId === user.id && togglingTool === tool.tool_name;
                          
                          return (
                            <td key={tool.tool_name} className="px-4 py-4 text-center">
                              <button
                                onClick={() => toggleUserTool(user.id, tool.tool_name, isEnabled)}
                                disabled={isToggling}
                                className={`p-2 rounded-lg transition-colors ${
                                  isToggling ? 'opacity-50 cursor-wait' : ''
                                } ${
                                  isEnabled 
                                    ? 'text-green-600 hover:bg-green-50' 
                                    : 'text-red-600 hover:bg-red-50'
                                }`}
                                title={`${isEnabled ? 'Disable' : 'Enable'} ${formatToolName(tool.tool_name)}`}
                              >
                                {isEnabled ? (
                                  <FiToggleRight className="w-6 h-6" />
                                ) : (
                                  <FiToggleLeft className="w-6 h-6" />
                                )}
                              </button>
                              {permission?.isCustom && (
                                <span className="block text-xs text-gray-400 mt-1">Custom</span>
                              )}
                            </td>
                          );
                        })}
                        
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleDisableAllTools(user.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Disable all tools"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEnableAllTools(user.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Enable all tools (revert to global)"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          </div>
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
            <h2 className="text-lg font-semibold mb-4">Tools Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map(tool => {
                // Safely calculate users with access
                const usersWithAccess = users.filter(u => {
                  const perm = u.toolPermissions?.find(p => p.toolName === tool.tool_name);
                  return perm ? perm.enabled : tool.global_enabled ?? true;
                }).length;
                
                const customOverrides = users.filter(u => 
                  u.toolPermissions?.some(p => p.toolName === tool.tool_name)
                ).length;

                return (
                  <div key={tool.tool_name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium capitalize">{formatToolName(tool.tool_name)}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        tool.global_enabled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {tool.global_enabled ? 'Global On' : 'Global Off'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Credits: {tool.credits_required}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Users with access:</span>
                        <span className="font-medium">{usersWithAccess}/{users.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Custom overrides:</span>
                        <span className="font-medium">{customOverrides}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: users.length > 0 ? `${(usersWithAccess / users.length) * 100}%` : '0%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'changes' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Permission Changes</h2>
            <div className="space-y-3">
              {recentChanges.length > 0 ? (
                recentChanges.map(change => (
                  <div key={change.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        change.isEnabled ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {change.isEnabled ? (
                          <FiToggleRight className={`w-5 h-5 text-green-600`} />
                        ) : (
                          <FiToggleLeft className={`w-5 h-5 text-red-600`} />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {change.userName || 'Unknown'} 
                          <span className="text-sm text-gray-500 ml-2">({change.userEmail})</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">{formatToolName(change.toolName)}</span>
                          <span className="text-gray-400 mx-2">•</span>
                          <span className="text-gray-600">By: {change.updatedBy || 'admin'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(change.updatedAt)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No recent changes
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bulk Update Modal */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Bulk Update Permissions</h2>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Selected Users: <span className="font-medium">{selectedUsers.length}</span>
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Tool
                  </label>
                  <select
                    value={bulkTool}
                    onChange={(e) => setBulkTool(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Choose a tool...</option>
                    {tools.map(tool => (
                      <option key={tool.tool_name} value={tool.tool_name}>
                        {formatToolName(tool.tool_name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="enable"
                        checked={bulkAction === 'enable'}
                        onChange={(e) => setBulkAction(e.target.value as 'enable')}
                        className="mr-2"
                      />
                      Enable
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="disable"
                        checked={bulkAction === 'disable'}
                        onChange={(e) => setBulkAction(e.target.value as 'disable')}
                        className="mr-2"
                      />
                      Disable
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleBulkUpdate}
                    disabled={!bulkTool}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply to {selectedUsers.length} Users
                  </button>
                  <button
                    onClick={() => {
                      setShowBulkModal(false);
                      setBulkTool('');
                      setBulkAction('enable');
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
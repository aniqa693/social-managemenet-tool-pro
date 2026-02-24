'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface CreditStats {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  overall: {
    totalCreditsIssued: number;
    totalCreditsUsed: number;
    totalPurchases: number;
    totalTransactions: number;
    averageUsagePerUser: number;
    activeUsers: number;
  };
  userCredits: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    currentCredits: number;
    totalCreditsUsed: number;
    lastActivity: string;
    toolUsage: {
      captions: number;
      titles: number;
      videoScripts: number;
      thumbnails: number;
      socialPosts: number;
      enhancedPosts: number;
    };
  }>;
  toolUsage: Array<{
    toolName: string;
    usageCount: number;
    totalCreditsUsed: number;
    uniqueUsers: number;
  }>;
  dailyTrend: Array<{
    date: string;
    purchases: number;
    usage: number;
    transactions: number;
  }>;
  contentStats: {
    captions: number;
    titles: number;
    videoScripts: number;
    thumbnails: number;
    socialPosts: number;
    enhancedPosts: number;
  };
  toolPricing: Array<{
    id: number;
    tool_name: string;
    credits_required: number;
  }>;
}

export default function AdminCreditsPage() {
  const [stats, setStats] = useState<CreditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        period,
      });

      const response = await fetch(`/api/admin/credits?${params}`);
      const data = await response.json();

      if (response.ok) {
        setStats(data);
        console.log('Stats loaded:', data);
      } else {
        toast.error(data.error || 'Failed to fetch credit statistics');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Error fetching credit statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user: any) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  // Format tool name for display
  const formatToolName = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Calculate tool usage with credits for a specific user
  const calculateUserToolCredits = (user: any) => {
    if (!stats || !user) return [];
    
    return Object.entries(user.toolUsage).map(([tool, count]) => {
      const pricing = stats.toolPricing.find(p => p.tool_name === tool);
      const creditsPerUse = pricing?.credits_required || 0;
      const totalCredits = Number(count) * creditsPerUse;
      
      return {
        tool,
        count: Number(count),
        creditsPerUse,
        totalCredits,
        formattedName: formatToolName(tool)
      };
    }).filter(item => item.count > 0);
  };

  // Chart configurations
  const usageTrendChart = {
    labels: stats?.dailyTrend.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) || [],
    datasets: [
      {
        label: 'Credits Used',
        data: stats?.dailyTrend.map(d => d.usage) || [],
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Credits Purchased',
        data: stats?.dailyTrend.map(d => d.purchases) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const toolUsageChart = {
    labels: stats?.toolUsage.map(t => formatToolName(t.toolName)) || [],
    datasets: [
      {
        label: 'Credits Used',
        data: stats?.toolUsage.map(t => t.totalCreditsUsed) || [],
        backgroundColor: [
          'rgba(139, 92, 246, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
      },
    ],
  };

  const contentDistributionChart = {
    labels: ['Captions', 'Titles', 'Video Scripts', 'Thumbnails', 'Social Posts', 'Enhanced Posts'],
    datasets: [
      {
        data: stats ? [
          stats.contentStats.captions,
          stats.contentStats.titles,
          stats.contentStats.videoScripts,
          stats.contentStats.thumbnails,
          stats.contentStats.socialPosts,
          stats.contentStats.enhancedPosts,
        ] : [],
        backgroundColor: [
          'rgba(139, 92, 246, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading credit analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Credit Usage Analytics</h1>
          <p className="text-gray-600 mt-2">Monitor credit consumption and user activity</p>
        </div>

        {/* Period Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4 flex-wrap items-center">
            <label className="text-sm font-medium text-gray-700">Time Period:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 min-w-[150px]"
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
            
            {stats && (
              <span className="text-sm text-gray-500 ml-auto">
                {new Date(stats.dateRange.start).toLocaleDateString()} - {new Date(stats.dateRange.end).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {!stats ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No data available</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Credits Issued</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.overall.totalCreditsIssued.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-2">Across all users</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Credits Used</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.overall.totalCreditsUsed.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-2">
                  {stats.overall.totalCreditsIssued > 0 
                    ? ((stats.overall.totalCreditsUsed / stats.overall.totalCreditsIssued) * 100).toFixed(1) 
                    : 0}% utilization
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Active Users</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.overall.activeUsers}</p>
                <p className="text-sm text-gray-500 mt-2">Used credits this period</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Usage Per User</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.overall.averageUsagePerUser.toFixed(1)}</p>
                <p className="text-sm text-gray-500 mt-2">credits per active user</p>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Daily Trend Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Daily Credit Activity</h2>
                {stats.dailyTrend.length > 0 ? (
                  <div className="h-80">
                    <Line data={usageTrendChart} options={chartOptions} />
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    No daily trend data available
                  </div>
                )}
              </div>

              {/* Tool Usage Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Credits by Tool</h2>
                {stats.toolUsage.length > 0 ? (
                  <div className="h-80">
                    <Bar data={toolUsageChart} options={chartOptions} />
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    No tool usage data available
                  </div>
                )}
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Content Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Content Generated by Type</h2>
                {Object.values(stats.contentStats).some(v => v > 0) ? (
                  <div className="h-80">
                    <Doughnut data={contentDistributionChart} options={chartOptions} />
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    No content generated yet
                  </div>
                )}
              </div>

              {/* Top Users Table - Clickable rows */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Top Credit Users</h2>
                {stats.userCredits.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 text-sm font-medium text-gray-500">User</th>
                          <th className="text-right py-2 text-sm font-medium text-gray-500">Current</th>
                          <th className="text-right py-2 text-sm font-medium text-gray-500">Used</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.userCredits.slice(0, 5).map((user) => (
                          <tr 
                            key={user.userId} 
                            onClick={() => handleUserClick(user)}
                            className="border-b hover:bg-purple-50 cursor-pointer transition-colors"
                          >
                            <td className="py-3">
                              <div>
                                <div className="font-medium text-gray-900">{user.userName}</div>
                                <div className="text-sm text-gray-500">{user.userEmail}</div>
                              </div>
                            </td>
                            <td className="text-right py-3">
                              <span className={`font-medium ${
                                user.currentCredits > 100 ? 'text-green-600' : 
                                user.currentCredits > 0 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {user.currentCredits}
                              </span>
                            </td>
                            <td className="text-right py-3 font-medium text-purple-600">
                              {user.totalCreditsUsed}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-gray-400 mt-2 text-center">Click on any user to view detailed analytics</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No users found</p>
                )}
              </div>
            </div>

            {/* Tool Pricing Table */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Tool Pricing & Usage</h2>
              {stats.toolUsage.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 text-sm font-medium text-gray-500">Tool Name</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-500">Credits Required</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-500">Usage Count</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-500">Total Credits</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-500">Unique Users</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.toolUsage.map((tool) => {
                        const pricing = stats.toolPricing.find(p => p.tool_name === tool.toolName);
                        return (
                          <tr key={tool.toolName} className="border-b hover:bg-gray-50">
                            <td className="py-3 font-medium capitalize">
                              {formatToolName(tool.toolName)}
                            </td>
                            <td className="py-3">
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                                {pricing?.credits_required || 0} credits
                              </span>
                            </td>
                            <td className="py-3">{tool.usageCount}</td>
                            <td className="py-3 font-medium">{tool.totalCreditsUsed}</td>
                            <td className="py-3">{tool.uniqueUsers}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No tool usage data available</p>
              )}
            </div>

            {/* User Details Modal - Full dashboard format for selected user */}
            {showUserModal && selectedUser && stats && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
                  
                  {/* Modal Header with User Info */}
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedUser.userName}</h2>
                      <p className="text-gray-600">{selectedUser.userEmail}</p>
                    </div>
                    <button
                      onClick={closeUserModal}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-6">
                    {/* User-specific KPI Cards - Same format as main dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg shadow p-6 border border-purple-100">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Current Credits</h3>
                        <p className="text-3xl font-bold text-purple-600">{selectedUser.currentCredits}</p>
                        <p className="text-sm text-gray-500 mt-2">Available balance</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow p-6 border border-blue-100">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Credits Used (This Period)</h3>
                        <p className="text-3xl font-bold text-blue-600">{selectedUser.totalCreditsUsed}</p>
                        <p className="text-sm text-gray-500 mt-2">{period} period</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow p-6 border border-green-100">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Last Activity</h3>
                        <p className="text-2xl font-bold text-green-600">
                          {new Date(selectedUser.lastActivity).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          {new Date(selectedUser.lastActivity).toLocaleTimeString()}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-white rounded-lg shadow p-6 border border-amber-100">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Avg. Daily Usage</h3>
                        <p className="text-3xl font-bold text-amber-600">
                          {stats.dailyTrend.length > 0 
                            ? Math.round(selectedUser.totalCreditsUsed / stats.dailyTrend.length) 
                            : 0}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">credits per day</p>
                      </div>
                    </div>

                    {/* User's Tool Usage Chart - Same format as main tool usage chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                      {/* Tool Usage Bar Chart for this user */}
                      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <h2 className="text-lg font-semibold mb-4">Credits Used by Tool</h2>
                        {calculateUserToolCredits(selectedUser).length > 0 ? (
                          <div className="h-80">
                            <Bar 
                              data={{
                                labels: calculateUserToolCredits(selectedUser).map(item => item.formattedName),
                                datasets: [{
                                  label: 'Credits Used',
                                  data: calculateUserToolCredits(selectedUser).map(item => item.totalCredits),
                                  backgroundColor: [
                                    'rgba(139, 92, 246, 0.8)',
                                    'rgba(59, 130, 246, 0.8)',
                                    'rgba(236, 72, 153, 0.8)',
                                    'rgba(245, 158, 11, 0.8)',
                                    'rgba(16, 185, 129, 0.8)',
                                    'rgba(239, 68, 68, 0.8)',
                                  ],
                                }]
                              }} 
                              options={chartOptions} 
                            />
                          </div>
                        ) : (
                          <div className="h-80 flex items-center justify-center text-gray-500">
                            No tool usage data available
                          </div>
                        )}
                      </div>

                      {/* Usage Distribution Doughnut Chart */}
                      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <h2 className="text-lg font-semibold mb-4">Usage Distribution</h2>
                        {calculateUserToolCredits(selectedUser).length > 0 ? (
                          <div className="h-80">
                            <Doughnut 
                              data={{
                                labels: calculateUserToolCredits(selectedUser).map(item => item.formattedName),
                                datasets: [{
                                  data: calculateUserToolCredits(selectedUser).map(item => item.totalCredits),
                                  backgroundColor: [
                                    'rgba(139, 92, 246, 0.8)',
                                    'rgba(59, 130, 246, 0.8)',
                                    'rgba(236, 72, 153, 0.8)',
                                    'rgba(245, 158, 11, 0.8)',
                                    'rgba(16, 185, 129, 0.8)',
                                    'rgba(239, 68, 68, 0.8)',
                                  ],
                                }]
                              }} 
                              options={chartOptions} 
                            />
                          </div>
                        ) : (
                          <div className="h-80 flex items-center justify-center text-gray-500">
                            No usage data available
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detailed Tool Usage Table - Same format as main tool pricing table */}
                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-8">
                      <h2 className="text-lg font-semibold mb-4">Detailed Tool Usage</h2>
                      {calculateUserToolCredits(selectedUser).length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead>
                              <tr className="border-b bg-gray-50">
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tool</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Usage Count</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Credits Per Use</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Total Credits</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">% of Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {calculateUserToolCredits(selectedUser).map((item) => (
                                <tr key={item.tool} className="border-b hover:bg-gray-50">
                                  <td className="py-3 px-4 font-medium">{item.formattedName}</td>
                                  <td className="text-right py-3 px-4">{item.count}</td>
                                  <td className="text-right py-3 px-4">
                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                                      {item.creditsPerUse}
                                    </span>
                                  </td>
                                  <td className="text-right py-3 px-4 font-semibold text-purple-600">
                                    {item.totalCredits}
                                  </td>
                                  <td className="text-right py-3 px-4">
                                    {selectedUser.totalCreditsUsed > 0 ? (
                                      <span className="text-gray-600">
                                        {((item.totalCredits / selectedUser.totalCreditsUsed) * 100).toFixed(1)}%
                                      </span>
                                    ) : '-'}
                                  </td>
                                </tr>
                              ))}
                              
                              {/* Total row */}
                              <tr className="bg-gray-100 font-semibold">
                                <td colSpan={3} className="text-right py-3 px-4">Total:</td>
                                <td className="text-right py-3 px-4 text-purple-600">
                                  {selectedUser.totalCreditsUsed}
                                </td>
                                <td className="text-right py-3 px-4">100%</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No tool usage data available for this user
                        </div>
                      )}
                    </div>

                    {/* Usage Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                      {Object.entries(selectedUser.toolUsage).map(([tool, count]) => {
                        if (Number(count) === 0) return null;
                        const pricing = stats.toolPricing.find(p => p.tool_name === tool);
                        return (
                          <div key={tool} className="bg-gray-50 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                            <div className="text-sm text-gray-600 mb-1">{formatToolName(tool)}</div>
                            <div className="text-2xl font-bold text-purple-600">{String(count)}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {Number(count) * (pricing?.credits_required || 0)} credits
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Close button */}
                    <div className="flex justify-end mt-6">
                      <button
                        onClick={closeUserModal}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
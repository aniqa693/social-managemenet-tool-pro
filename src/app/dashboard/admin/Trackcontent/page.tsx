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

interface ContentItem {
  id: number;
  userInput?: string;
  content?: any;
  userEmail: string;
  userId: string;
  createdOn: string;
  contentType: string;
  [key: string]: any;
}

interface UserActivity {
  id: string;
  name: string;
  email: string;
  role: string;
  credits: number;
  activity: {
    captions: number;
    titles: number;
    videoScripts: number;
    thumbnails: number;
    socialPosts: number;
    enhancedPosts: number;
    total: number;
  };
}

interface ContentOverview {
  summary: {
    totalContent: number;
    totalActiveUsers: number;
    averagePerUser: number;
  };
  byType: Array<{
    type: string;
    count: number;
    uniqueUsers: number;
  }>;
}

interface TrendData {
  date: string;
  captions: number;
  titles: number;
  videoScripts: number;
  thumbnails: number;
  socialPosts: number;
  enhancedPosts: number;
  total: number;
}

export default function AdminContentActivityPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [useCustomDates, setUseCustomDates] = useState(false);
  
  const [overview, setOverview] = useState<ContentOverview | null>(null);
  const [users, setUsers] = useState<UserActivity[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [platformDistribution, setPlatformDistribution] = useState<any[]>([]);
  const [enhancementDistribution, setEnhancementDistribution] = useState<any[]>([]);
  
  const [selectedUser, setSelectedUser] = useState<UserActivity | null>(null);
  const [userContent, setUserContent] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [contentFilter, setContentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, [period, startDate, endDate, useCustomDates]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      let url = '/api/admin/content/activity?type=all';
      if (useCustomDates && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      } else {
        url += `&period=${period}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setOverview(data.overview);
        setUsers(data.topUsers || []);
        setTrends(data.trends?.daily || []);
        setRecentContent(data.recent?.content || []);
        setPlatformDistribution(data.trends?.platforms || []);
        setEnhancementDistribution(data.trends?.enhancements || []);
      } else {
        toast.error(data.error || 'Failed to fetch content activity');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Error fetching content activity');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserContent = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/content/activity?type=users&userId=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setUserContent(data);
        setShowUserModal(true);
      } else {
        toast.error(data.error || 'Failed to fetch user content');
      }
    } catch (error) {
      console.error('Error fetching user content:', error);
      toast.error('Error fetching user content');
    }
  };

  const handleDeleteContent = async (contentType: string, contentId: number) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const response = await fetch('/api/admin/content/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          contentType,
          contentId
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Content deleted successfully');
        fetchData();
        if (showContentModal) {
          setShowContentModal(false);
        }
      } else {
        toast.error(data.error || 'Failed to delete content');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Error deleting content');
    }
  };

  const handleExportData = async () => {
    try {
      let url = '/api/admin/content/activity?type=export&format=csv';
      if (useCustomDates && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      } else {
        url += `&period=${period}`;
      }
      url += `&contentType=${contentFilter}`;

      window.open(url, '_blank');
      toast.success('Export started');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error exporting data');
    }
  };

  const formatContentType = (type: string) => {
    return type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Chart configurations
  const contentTrendChart = {
    labels: trends.map(t => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Total Content',
        data: trends.map(t => t.total),
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ],
  };

  const contentByTypeChart = {
    labels: overview?.byType.map(t => formatContentType(t.type)) || [],
    datasets: [
      {
        label: 'Content Count',
        data: overview?.byType.map(t => t.count) || [],
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

  const platformChart = {
    labels: platformDistribution.map(p => p.platform),
    datasets: [
      {
        data: platformDistribution.map(p => p.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
      },
    ],
  };

  const enhancementChart = {
    labels: enhancementDistribution.map(e => e.type),
    datasets: [
      {
        data: enhancementDistribution.map(e => e.count),
        backgroundColor: [
          'rgba(139, 92, 246, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(245, 158, 11, 0.8)',
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
          <p className="mt-4 text-gray-600">Loading content activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Activity</h1>
          <p className="text-gray-600 mt-2">Monitor content generation across all tools</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="customDates"
                checked={useCustomDates}
                onChange={(e) => setUseCustomDates(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="customDates" className="text-sm font-medium text-gray-700">
                Custom Date Range
              </label>
            </div>

            {!useCustomDates ? (
              <>
                <label className="text-sm font-medium text-gray-700">Period:</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="day">Last 24 Hours</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                </select>
              </>
            ) : (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <span>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </>
            )}

            <button
              onClick={handleExportData}
              className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-4">
            {['overview', 'trends', 'users', 'content'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && overview && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Content</h3>
                <p className="text-3xl font-bold text-gray-900">{overview.summary.totalContent.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-2">Generated this period</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Active Users</h3>
                <p className="text-3xl font-bold text-gray-900">{overview.summary.totalActiveUsers}</p>
                <p className="text-sm text-gray-500 mt-2">Created content</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Average Per User</h3>
                <p className="text-3xl font-bold text-gray-900">{overview.summary.averagePerUser}</p>
                <p className="text-sm text-gray-500 mt-2">Content pieces per user</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Content by Type</h2>
                <div className="h-80">
                  <Bar data={contentByTypeChart} options={chartOptions} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Platform Distribution</h2>
                {platformDistribution.length > 0 ? (
                  <div className="h-80">
                    <Doughnut data={platformChart} options={chartOptions} />
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    No platform data available
                  </div>
                )}
              </div>
            </div>

            {/* Content Type Table */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Content Type Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 text-sm font-medium text-gray-500">Content Type</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500">Count</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500">Unique Users</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500">Avg Per User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.byType.map((type) => (
                      <tr key={type.type} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium capitalize">
                          {formatContentType(type.type)}
                        </td>
                        <td className="text-right py-3">{type.count}</td>
                        <td className="text-right py-3">{type.uniqueUsers}</td>
                        <td className="text-right py-3">
                          {type.uniqueUsers > 0 ? (type.count / type.uniqueUsers).toFixed(1) : 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Content Generation Trend</h2>
              {trends.length > 0 ? (
                <div className="h-96">
                  <Line data={contentTrendChart} options={chartOptions} />
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center text-gray-500">
                  No trend data available
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Platform Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Social Media Platform Usage</h2>
                {platformDistribution.length > 0 ? (
                  <div className="h-80">
                    <Bar 
                      data={{
                        labels: platformDistribution.map(p => p.platform),
                        datasets: [{
                          label: 'Posts',
                          data: platformDistribution.map(p => p.count),
                          backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        }]
                      }} 
                      options={chartOptions} 
                    />
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    No platform data available
                  </div>
                )}
              </div>

              {/* Enhancement Types */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Image Enhancement Types</h2>
                {enhancementDistribution.length > 0 ? (
                  <div className="h-80">
                    <Bar 
                      data={{
                        labels: enhancementDistribution.map(e => e.type),
                        datasets: [{
                          label: 'Enhancements',
                          data: enhancementDistribution.map(e => e.count),
                          backgroundColor: 'rgba(139, 92, 246, 0.8)',
                        }]
                      }} 
                      options={chartOptions} 
                    />
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    No enhancement data available
                  </div>
                )}
              </div>
            </div>

            {/* Daily Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Daily Breakdown</h2>
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b">
                      <th className="text-left py-3 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500">Captions</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500">Titles</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500">Scripts</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500">Thumbnails</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500">Social</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500">Enhanced</th>
                      <th className="text-right py-3 text-sm font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.map((day) => (
                      <tr key={day.date} className="border-b hover:bg-gray-50">
                        <td className="py-2">{new Date(day.date).toLocaleDateString()}</td>
                        <td className="text-right py-2">{day.captions}</td>
                        <td className="text-right py-2">{day.titles}</td>
                        <td className="text-right py-2">{day.videoScripts}</td>
                        <td className="text-right py-2">{day.thumbnails}</td>
                        <td className="text-right py-2">{day.socialPosts}</td>
                        <td className="text-right py-2">{day.enhancedPosts}</td>
                        <td className="text-right py-2 font-medium">{day.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Top Content Creators</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 text-sm font-medium text-gray-500">User</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Captions</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Titles</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Scripts</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Thumbnails</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Social</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Enhanced</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Total</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter(u => 
                      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.email.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="text-right py-3">{user.activity.captions}</td>
                        <td className="text-right py-3">{user.activity.titles}</td>
                        <td className="text-right py-3">{user.activity.videoScripts}</td>
                        <td className="text-right py-3">{user.activity.thumbnails}</td>
                        <td className="text-right py-3">{user.activity.socialPosts}</td>
                        <td className="text-right py-3">{user.activity.enhancedPosts}</td>
                        <td className="text-right py-3 font-medium text-purple-600">{user.activity.total}</td>
                        <td className="text-right py-3">
                          <button
                            onClick={() => fetchUserContent(user.id)}
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Content</h2>
              <div className="flex gap-2">
                <select
                  value={contentFilter}
                  onChange={(e) => setContentFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Types</option>
                  <option value="captions">Captions</option>
                  <option value="titles">Titles</option>
                  <option value="videoScripts">Video Scripts</option>
                  <option value="thumbnails">Thumbnails</option>
                  <option value="socialPosts">Social Posts</option>
                  <option value="enhancedPosts">Enhanced Posts</option>
                </select>
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Type</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500">User</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Content Preview</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Created</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentContent
                    .filter(item => 
                      (contentFilter === 'all' || item.contentType === contentFilter) &&
                      (item.userInput?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map((item) => (
                      <tr key={`${item.contentType}-${item.id}`} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs capitalize">
                            {formatContentType(item.contentType)}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="text-sm">
                            <div className="font-medium">{item.userEmail}</div>
                            {item.userId && <div className="text-xs text-gray-500">ID: {item.userId}</div>}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="max-w-xs truncate text-sm">
                            {item.userInput || JSON.stringify(item.content) || 'No preview'}
                          </div>
                        </td>
                        <td className="py-3 text-sm text-gray-600">
                          {formatDate(item.createdOn)}
                        </td>
                        <td className="text-right py-3">
                          <button
                            onClick={() => {
                              setSelectedContent(item);
                              setShowContentModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium mr-3"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteContent(item.contentType, item.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Content Modal */}
        {showUserModal && userContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{userContent.user?.name}</h2>
                  <p className="text-gray-600">{userContent.user?.email}</p>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                  {Object.entries(userContent.summary?.byType || {}).map(([type, count]) => (
                    <div key={type} className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600 mb-1 capitalize">{formatContentType(type)}</div>
                      <div className="text-2xl font-bold text-purple-600">{String(count)}</div>
                    </div>
                  ))}
                </div>

                {/* Content by Type */}
                {Object.entries(userContent.activity || {}).map(([type, items]: [string, any]) => 
                  items && items.length > 0 && (
                    <div key={type} className="mb-8">
                      <h3 className="text-lg font-semibold mb-4 capitalize">{formatContentType(type)}</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 text-sm font-medium text-gray-500">ID</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-500">Content</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-500">Details</th>
                              <th className="text-left py-2 text-sm font-medium text-gray-500">Created</th>
                              <th className="text-right py-2 text-sm font-medium text-gray-500">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item: any) => (
                              <tr key={item.id} className="border-b hover:bg-gray-50">
                                <td className="py-2 text-sm">{item.id}</td>
                                <td className="py-2">
                                  <div className="max-w-xs truncate">
                                    {item.userInput || JSON.stringify(item.content) || '-'}
                                  </div>
                                </td>
                                <td className="py-2 text-sm">
                                  {item.plateform && <div>Platform: {item.plateform}</div>}
                                  {item.tone && <div>Tone: {item.tone}</div>}
                                  {item.videoType && <div>Type: {item.videoType}</div>}
                                  {item.platform && <div>Platform: {item.platform}</div>}
                                  {item.enhancementType && <div>Enhancement: {item.enhancementType}</div>}
                                </td>
                                <td className="py-2 text-sm">{formatDate(item.createdOn)}</td>
                                <td className="text-right py-2">
                                  <button
                                    onClick={() => handleDeleteContent(type, item.id)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Detail Modal */}
        {showContentModal && selectedContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold">Content Details</h2>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs capitalize">
                      {formatContentType(selectedContent.contentType)}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowContentModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">User</label>
                    <p className="mt-1">{selectedContent.userEmail}</p>
                    {selectedContent.userId && (
                      <p className="text-sm text-gray-500">User ID: {selectedContent.userId}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Created On</label>
                    <p className="mt-1">{formatDate(selectedContent.createdOn)}</p>
                  </div>

                  {selectedContent.userInput && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">User Input</label>
                      <p className="mt-1 p-3 bg-gray-50 rounded">{selectedContent.userInput}</p>
                    </div>
                  )}

                  {selectedContent.content && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Generated Content</label>
                      <pre className="mt-1 p-3 bg-gray-50 rounded overflow-auto max-h-60">
                        {JSON.stringify(selectedContent.content, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Type-specific fields */}
                  {selectedContent.plateform && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Platform</label>
                      <p className="mt-1">{selectedContent.plateform}</p>
                    </div>
                  )}

                  {selectedContent.tone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tone</label>
                      <p className="mt-1">{selectedContent.tone}</p>
                    </div>
                  )}

                  {selectedContent.videoType && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Video Type</label>
                      <p className="mt-1">{selectedContent.videoType}</p>
                    </div>
                  )}

                  {selectedContent.thumbnailURL && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Thumbnail URL</label>
                      <p className="mt-1 break-all">{selectedContent.thumbnailURL}</p>
                    </div>
                  )}

                  {selectedContent.postUrl && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Post URL</label>
                      <p className="mt-1 break-all">{selectedContent.postUrl}</p>
                    </div>
                  )}

                  {selectedContent.enhancedImageUrl && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Enhanced Image URL</label>
                      <p className="mt-1 break-all">{selectedContent.enhancedImageUrl}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowContentModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteContent(selectedContent.contentType, selectedContent.id);
                      setShowContentModal(false);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete Content
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
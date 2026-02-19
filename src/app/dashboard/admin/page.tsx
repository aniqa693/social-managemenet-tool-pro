'use client';

import { Card } from '@/components/ui/card';
import { Users, Settings, Activity } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Admin Quick Actions Banner */}
      <div className="bg-linear-to-r from-purple-900/10 to-blue-900/10 border border-purple-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, Admin!</h1>
            <p className="text-gray-600 mt-1">Manage your platform efficiently</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">System Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="text-2xl font-bold mt-1">1,234</div>
          <div className="text-xs text-green-600">↑ 12% this month</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm text-gray-500">Active Creators</div>
          <div className="text-2xl font-bold mt-1">456</div>
          <div className="text-xs text-green-600">↑ 8% this month</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm text-gray-500">Content Items</div>
          <div className="text-2xl font-bold mt-1">3,789</div>
          <div className="text-xs text-green-600">↑ 15% this month</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm text-gray-500">Revenue</div>
          <div className="text-2xl font-bold mt-1">$12.4K</div>
          <div className="text-xs text-green-600">↑ 5% this month</div>
        </div>
      </div>

      {/* Additional Admin Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-purple-600" />
            Recent Platform Activity
          </h3>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">New user registered</p>
                  <p className="text-sm text-gray-500">2 minutes ago</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">New</span>
              </div>
            ))}
          </div>
        </Card>

        {/* System Health */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2 text-purple-600" />
            System Health
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Server Load</span>
                <span className="font-medium">45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Database</span>
                <span className="font-medium">78%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Storage</span>
                <span className="font-medium">32%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '32%' }}></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* User Management Preview */}
      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-purple-600" />
          Recent Users
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">John Doe</td>
                  <td className="py-3 px-4">Creator</td>
                  <td className="py-3 px-4">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Active</span>
                  </td>
                  <td className="py-3 px-4">2024-01-15</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
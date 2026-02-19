'use client';

import { Calendar, PenTool, BarChart } from 'lucide-react';
import Link from 'next/link';

export default function CreatorDashboard() {
  return (
    <div className="space-y-6">
      {/* Creator Welcome Banner */}
      <div className="from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Creator Dashboard</h1>
            <p className="text-gray-600 mt-1">Create, schedule, and manage your content</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:block bg-white border border-pink-200 rounded-lg px-4 py-2">
              <div className="text-xs text-gray-500">Credits Available</div>
              <div className="font-bold text-pink-600">1,245</div>
            </div>
            <Link
              href="/creator/create"
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
            >
              Create Post
            </Link>
          </div>
        </div>
      </div>

      {/* AI Tools Quick Access */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Content Tools</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'Generate Caption', icon: '✨', color: 'bg-blue-100 text-blue-600', href: '/creator/ai-content/captions' },
            { title: 'Create Hashtags', icon: '#️⃣', color: 'bg-green-100 text-green-600', href: '/creator/ai-content/hashtags' },
            { title: 'Video Script', icon: '🎬', color: 'bg-purple-100 text-purple-600', href: '/creator/ai-content/scripts' },
            { title: 'Thumbnail', icon: '🖼️', color: 'bg-orange-100 text-orange-600', href: '/creator/ai-visual/thumbnail' },
          ].map((tool, index) => (
            <Link
              key={index}
              href={tool.href}
              className={`${tool.color} p-4 rounded-xl hover:opacity-90 transition-opacity text-center`}
            >
              <div className="text-2xl mb-2">{tool.icon}</div>
              <div className="font-medium">{tool.title}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduled Posts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Posts</h3>
          <div className="space-y-3">
            {[
              { platform: 'Instagram', time: 'Today, 2:00 PM', status: 'Scheduled', color: 'bg-gradient-to-r from-pink-500 to-rose-500' },
              { platform: 'Facebook', time: 'Tomorrow, 10:00 AM', status: 'Pending', color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
              { platform: 'YouTube', time: 'Dec 30, 5:00 PM', status: 'Draft', color: 'bg-gradient-to-r from-red-500 to-red-600' },
            ].map((post, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg ${post.color}`}></div>
                  <div>
                    <div className="font-medium text-gray-900">{post.platform}</div>
                    <div className="text-sm text-gray-500">{post.time}</div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  post.status === 'Scheduled' ? 'bg-green-100 text-green-800' :
                  post.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {post.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Performance</h3>
          <div className="space-y-4">
            {[
              { title: 'Best Performing', platform: 'Instagram', engagement: '15.2K' },
              { title: 'Highest Reach', platform: 'Facebook', engagement: '28.4K' },
              { title: 'Most Shared', platform: 'Twitter', engagement: '4.8K' },
            ].map((content, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{content.title}</div>
                  <div className="text-sm text-gray-500">{content.platform}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{content.engagement}</div>
                  <div className="text-xs text-green-600">↑ 12%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
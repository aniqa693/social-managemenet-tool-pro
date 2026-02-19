'use client';

import { PieChart, BarChart, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function AnalystDashboard() {
  return (
    <div className="space-y-6">
      {/* Analyst Welcome Banner */}
      <div className="from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Track performance and gain insights</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/analyst/reports/generate"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              Generate Report
            </Link>
            <Link
              href="/analyst/export"
              className="px-4 py-2 border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors text-sm font-medium"
            >
              Export Data
            </Link>
          </div>
        </div>
      </div>

      {/* Real-time Data Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Live Data Stream
          </h3>
          <div className="space-y-3">
            {[
              { metric: 'Engagement Rate', value: '4.2%', change: '+0.3%', color: 'text-green-600' },
              { metric: 'Impressions', value: '1.2M', change: '+50K', color: 'text-blue-600' },
              { metric: 'Click-through', value: '3.1%', change: '+0.2%', color: 'text-purple-600' },
              { metric: 'Conversion', value: '2.4%', change: '+0.1%', color: 'text-orange-600' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <span className="font-medium text-gray-700">{item.metric}</span>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{item.value}</div>
                  <div className={`text-xs ${item.color}`}>{item.change}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/analyst/audience"
              className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-center"
            >
              <div className="text-blue-600 font-medium">Audience Analysis</div>
              <div className="text-xs text-gray-600 mt-1">Demographics & insights</div>
            </Link>
            <Link
              href="/analyst/top-content"
              className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-center"
            >
              <div className="text-green-600 font-medium">Top Content</div>
              <div className="text-xs text-gray-600 mt-1">Best performing posts</div>
            </Link>
            <Link
              href="/analyst/patterns"
              className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-center"
            >
              <div className="text-purple-600 font-medium">Patterns</div>
              <div className="text-xs text-gray-600 mt-1">Engagement trends</div>
            </Link>
            <Link
              href="/analyst/export"
              className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-center"
            >
              <div className="text-orange-600 font-medium">Export</div>
              <div className="text-xs text-gray-600 mt-1">PDF/CSV reports</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
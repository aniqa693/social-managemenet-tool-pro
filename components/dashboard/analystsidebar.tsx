"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Target,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const analystNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard/analyst",  // Changed from /analyst/dashboard
    icon: LayoutDashboard,
  },
  {
    title: "Analytics Dashboard",
    href: "/dashboard/analyst/analytics",  // Changed from /analyst/analytics
    icon: BarChart3,
    subItems: [
      { title: "Engagement Metrics", href: "/dashboard/analyst/analytics/engagement" },
      { title: "Impressions", href: "/dashboard/analyst/analytics/impressions" },
      { title: "Views Analysis", href: "/dashboard/analyst/analytics/views" },
      { title: "Platform Comparison", href: "/dashboard/analyst/analytics/comparison" },
    ],
  },
  {
    title: "AI Insights",
    href: "/dashboard/analyst/insights",  // Changed from /analyst/insights
    icon: TrendingUp,
    subItems: [
      { title: "Top Performing Posts", href: "/dashboard/analyst/insights/top-posts" },
      { title: "Engagement Patterns", href: "/dashboard/analyst/insights/patterns" },
      { title: "Growth Recommendations", href: "/dashboard/analyst/insights/recommendations" },
    ],
  },
  {
    title: "Reports",
    href: "/dashboard/analyst/reports",  // Changed from /analyst/reports
    icon: FileText,
    subItems: [
      { title: "Generate Report", href: "/dashboard/analyst/reports/generate" },
      { title: "Export Reports", href: "/dashboard/analyst/reports/export" },
      { title: "Report History", href: "/dashboard/analyst/reports/history" },
    ],
  },
  {
    title: "Audience Analysis",
    href: "/dashboard/analyst/audience",  // Changed from /analyst/audience
    icon: Users,
    subItems: [
      { title: "Demographics", href: "/dashboard/analyst/audience/demographics" },
      { title: "Location Analysis", href: "/dashboard/analyst/audience/location" },
      { title: "Interest Groups", href: "/dashboard/analyst/audience/interests" },
      { title: "Time Analysis", href: "/dashboard/analyst/audience/time" },
      { title: "Device Analysis", href: "/dashboard/analyst/audience/devices" },
    ],
  },
  {
    title: "Content Approval",
    href: "/dashboard/analyst/approval",  // Changed from /analyst/approval
    icon: Target,
    subItems: [
      { title: "Pending Reviews", href: "/dashboard/analyst/approval/pending" },
      { title: "Approved Content", href: "/dashboard/analyst/approval/approved" },
      { title: "Feedback Sent", href: "/dashboard/analyst/approval/feedback" },
    ],
  },
  {
    title: "Notifications",
    href: "/dashboard/analyst/notifications",  // Changed from /analyst/notifications
    icon: Bell,
  },
  {
    title: "Real-time Alerts",
    href: "/dashboard/analyst/alerts",  // Changed from /analyst/alerts
    icon: AlertCircle,
  },
  {
    title: "Settings",
    href: "/dashboard/analyst/settings",  // Changed from /analyst/settings
    icon: Settings,
  },
];

interface AnalystSidebarProps {
  className?: string;
  onLogout?: () => void;
}

export default function AnalystSidebar({ className, onLogout }: AnalystSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleItem = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-linear-to-b from-emerald-50 to-green-50 border-r border-emerald-200 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-emerald-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-linear-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Analytics Hub</h2>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-linear-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center mx-auto">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
          >
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <Link
          href="/"
          className={cn(
            "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all hover:bg-emerald-50 text-gray-700 hover:text-emerald-700",
            isCollapsed && "justify-center"
          )}
        >
          <Home className="w-5 h-5" />
          {!isCollapsed && <span>Home</span>}
        </Link>

        {analystNavItems.map((item) => {
          const Icon = item.icon;
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isItemActive = isActive(item.href) || (hasSubItems && item.subItems?.some(sub => isActive(sub.href)));
          const isExpanded = expandedItems.includes(item.title);

          return (
            <div key={item.title}>
              {hasSubItems ? (
                <button
                  onClick={() => toggleItem(item.title)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all text-gray-700 hover:bg-emerald-50 hover:text-emerald-700",
                    isItemActive && "bg-linear-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-500 text-emerald-700",
                    isCollapsed && "justify-center"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </div>
                  {hasSubItems && !isCollapsed && (
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 transition-transform",
                        isExpanded && "rotate-90"
                      )}
                    />
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all text-gray-700 hover:bg-emerald-50 hover:text-emerald-700",
                    isItemActive && "bg-linear-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-500 text-emerald-700",
                    isCollapsed && "justify-center"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </div>
                </Link>
              )}

              {hasSubItems && isExpanded && !isCollapsed && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.subItems?.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-all hover:bg-emerald-50 text-gray-600 hover:text-emerald-600",
                        isActive(subItem.href) && "bg-emerald-50 text-emerald-600 font-medium"
                      )}
                    >
                      <span>•</span>
                      <span>{subItem.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Quick Stats */}
      {/* {!isCollapsed && (
        <div className="p-4 mx-4 mb-4 bg-white rounded-xl border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Today's Analysis</span>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              Live
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Posts Analyzed</span>
              <span className="font-semibold text-emerald-600">156</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Insights Generated</span>
              <span className="font-semibold text-emerald-600">23</span>
            </div>
          </div>
        </div>
      )} */}

      {/* Footer */}
      <div className="p-4 border-t border-emerald-200">
        {onLogout && (
          <Button
            onClick={onLogout}
            variant="ghost"
            className={cn(
              "w-full text-gray-500 hover:text-emerald-600 hover:bg-emerald-50",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Logout</span>}
          </Button>
        )}
      </div>
    </div>
  );
}
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  FileText,
  Bell,
  CreditCard,
  Eye,
  Shield,
  UserCog,
  TrendingUp,
  Activity,
  Package,
  Globe,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    title: "User Management",
    href: "/dashboard/admin/users",
    icon: Users,
    subItems: [
      { title: "All Users", href: "/dashboard/admin/users" },
      { title: "Create User", href: "/dashboard/admin/users/create" },
      { title: "Role Management", href: "/dashboard/admin/users/roles" },
      { title: "Suspended Users", href: "/dashboard/admin/users/suspended" },
    ],
  },
  {
    title: "Global Analytics",
    href: "/dashboard/admin/analytics",
    icon: BarChart3,
    subItems: [
      { title: "Platform Performance", href: "/dashboard/admin/analytics/platform" },
      { title: "Content Activity", href: "/dashboard/admin/analytics/content" },
      { title: "Revenue Analytics", href: "/dashboard/admin/analytics/revenue" },
    ],
  },
  {
    title: "AI Tools Management",
    href: "/dashboard/admin/ai-tools",
    icon: Activity,
  },
  {
    title: "Credit Management",
    href: "/dashboard/admin/credits",
    icon: CreditCard,
    subItems: [
      { title: "Credit Usage", href: "/dashboard/admin/credits/usage" },
      { title: "Update Credits", href: "/dashboard/admin/credits/update" },
      { title: "Billing History", href: "/dashboard/admin/credits/billing" },
    ],
  },
  {
    title: "Content Oversight",
    href: "/dashboard/admin/content",
    icon: Eye,
    subItems: [
      { title: "Pending Approvals", href: "/dashboard/admin/content/pending" },
      { title: "Published Content", href: "/dashboard/admin/content/published" },
      { title: "Rejected Content", href: "/dashboard/admin/content/rejected" },
    ],
  },
  {
    title: "Notifications",
    href: "/dashboard/admin/notifications",
    icon: Bell,
  },
  {
    title: "Subscription Plans",
    href: "/dashboard/admin/subscriptions",
    icon: Package,
    subItems: [
      { title: "Plan Management", href: "/dashboard/admin/subscriptions/plans" },
      { title: "Credit Limits", href: "/dashboard/admin/subscriptions/limits" },
      { title: "Stripe Integration", href: "/dashboard/admin/subscriptions/stripe" },
    ],
  },
  {
    title: "System Settings",
    href: "/dashboard/admin/settings",
    icon: Settings,
  },
];

interface AdminSidebarProps {
  className?: string;
  onLogout?: () => void;
}

export default function AdminSidebar({ className, onLogout }: AdminSidebarProps) {
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
        "flex flex-col h-full bg-linear-to-b from-gray-900 to-black text-white border-r border-gray-800 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-linear-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold">Admin Panel</h2>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-linear-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <Shield className="w-5 h-5" />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
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
            "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all hover:bg-gray-800",
            isCollapsed && "justify-center"
          )}
        >
          <Home className="w-5 h-5" />
          {!isCollapsed && <span>Home</span>}
        </Link>

        {adminNavItems.map((item) => {
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
                    "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all hover:bg-gray-800",
                    isItemActive && "bg-linear-to-r from-purple-900/30 to-blue-900/30 border-l-4 border-purple-500",
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
                    "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all hover:bg-gray-800",
                    isItemActive && "bg-linear-to-r from-purple-900/30 to-blue-900/30 border-l-4 border-purple-500",
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
                        "flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-all hover:bg-gray-800",
                        isActive(subItem.href) && "bg-gray-800 text-purple-300"
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

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        {onLogout && (
          <Button
            onClick={onLogout}
            variant="ghost"
            className={cn(
              "w-full text-gray-400 hover:text-white hover:bg-gray-800",
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
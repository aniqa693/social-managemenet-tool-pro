"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PenSquare,
  Image,
  Video,
  Calendar,
  BarChart3,
  Sparkles,
  Hash,
  Type,
  Zap,
  TrendingUp,
  Brain,
  Palette,
  Upload,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  CreditCard,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const creatorNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard/creator",
    icon: LayoutDashboard,
  },
  {
    title: "Schedule & Publish",
    href: "/dashboard/creator/schedule",
    icon: Calendar,
    subItems: [
      { title: "Schedule Posts", href: "/dashboard/creator/schedule/new" },
      { title: "Display schedule Posts", href: "/dashboard/creator/schedule/edit" },
      { title: "Display all post", href: "/dashboard/creator/schedule/platforms" },
    ],
  },
  {
    title: "Content Approval",
    href: "/dashboard/creator/approval",
    icon: FileText,
    subItems: [
      { title: "Submit for Approval", href: "/dashboard/creator/approval/submit" },
      { title: "Approval History", href: "/dashboard/creator/approval/history" },
    ],
  },
  {
    title: "AI Content Studio",
    href: "/dashboard/creator",
    icon: Sparkles,
    subItems: [
      { title: "Generate Captions", href: "/dashboard/creator/captions" },
      { title: "Generate Hashtags", href: "/dashboard/creator/hashtags" },
      { title: "Video Titles", href: "/dashboard/creator/titles" },
      { title: "Video Scripts", href: "/dashboard/creator/scripts" },
      { title: "Keyword Generation", href: "/dashboard/creator/keywords" },
      { title: "Content History", href: "/dashboard/creator/history" },
    ],
  },
  {
    title: "AI Visual Studio",
    href: "/dashboard/creator",
    icon: Palette,
    subItems: [
      { title: "Post Generator", href: "/dashboard/creator/visaul/post" },
      { title: "Thumbnail Generator", href: "/dashboard/creator/visaul/thumbnails" },
      { title: "Post Enhancer", href: "/dashboard/creator/visaul/enhancer" },
    ],
  },
  {
    title: "Trend finder",
    href: "/dashboard/creator/tools",
    icon: Zap,
    subItems: [
      { title: "Trending Videos", href: "/dashboard/creator/tools/trending" },
      { title: "Growth Tips", href: "/dashboard/creator/tools/growth-tips" },
    ],
  },
  {
    title: "Credit Management",
    href: "/dashboard/creator/credits",
    icon: CreditCard,
    subItems: [
      { title: "Available Credits", href: "/dashboard/creator/credits/balance" },
      { title: "Purchase Credits", href: "/dashboard/creator/credits/purchase" },
      { title: "Usage History", href: "/dashboard/creator/credits/history" },
    ],
  },
  {
    title: "Notifications",
    href: "/dashboard/creator/notifications",
    icon: Bell,
  },
  {
    title: "Settings",
    href: "/dashboard/creator/settings",
    icon: Settings,
  },
];

interface CreatorSidebarProps {
  className?: string;
  onLogout?: () => void;
}

export default function CreatorSidebar({ className, onLogout }: CreatorSidebarProps) {
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
        "flex flex-col h-full bg-linear-to-b from-pink-950/20 to-rose-950/20 backdrop-blur-sm border-r border-pink-200/20 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-pink-200/20">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-linear-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Creator Studio</h2>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-linear-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-pink-600 hover:bg-pink-50"
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
            "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all hover:bg-pink-50 text-gray-700 hover:text-pink-700",
            isCollapsed && "justify-center"
          )}
        >
          <Home className="w-5 h-5" />
          {!isCollapsed && <span>Home</span>}
        </Link>

        {creatorNavItems.map((item) => {
          const Icon = item.icon;
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isItemActive = isActive(item.href) || (hasSubItems && item.subItems?.some(sub => isActive(sub.href)));
          const isExpanded = expandedItems.includes(item.title);

          return (
            <div key={item.title}>
              <button
                onClick={() => hasSubItems ? toggleItem(item.title) : null}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all text-gray-700 hover:bg-pink-50 hover:text-pink-700",
                  isItemActive && "bg-linear-to-r from-pink-50 to-rose-50 border-l-4 border-pink-500 text-pink-700",
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

              {hasSubItems && isExpanded && !isCollapsed && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.subItems?.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-all hover:bg-pink-50 text-gray-600 hover:text-pink-600",
                        isActive(subItem.href) && "bg-pink-50 text-pink-600 font-medium"
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

      {/* Credit Balance Display */}
      {/* {!isCollapsed && (
        <div className="p-4 mx-4 mb-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl text-white">
          <div className="text-xs opacity-90">Available Credits</div>
          <div className="text-2xl font-bold">1,245</div>
          <div className="text-xs opacity-90 mt-1">+250 this month</div>
        </div>
      )} */}

      {/* Footer */}
      <div className="p-4 border-t border-pink-200/20">
        {onLogout && (
          <Button
            onClick={onLogout}
            variant="ghost"
            className={cn(
              "w-full text-gray-500 hover:text-pink-600 hover:bg-pink-50",
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
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { UserRole } from '../../types/auth';
import {
  LayoutDashboard,
  Calendar,
  BarChart,
  Users,
  Settings,
  PenTool,
  PieChart,
  Shield,
} from 'lucide-react';

interface NavProps {
  role: UserRole;
}

export function DashboardNav({ role }: NavProps) {
  const pathname = usePathname();

  // Only show links for the user's own role
  const getNavItems = () => {
    const baseItems = [
      {
        title: 'Dashboard',
        href: `/dashboard/${role}`,
        icon: LayoutDashboard,
      },
    ];

    const roleItems = {
      creator: [
        {
          title: 'Content Calendar',
          href: `/dashboard/creator/calendar`,
          icon: Calendar,
        },
        {
          title: 'Posts',
          href: `/dashboard/creator/posts`,
          icon: PenTool,
        },
        {
          title: 'Analytics',
          href: `/dashboard/creator/analytics`,
          icon: BarChart,
        },
      ],
      analyst: [
        {
          title: 'Reports',
          href: `/dashboard/analyst/reports`,
          icon: PieChart,
        },
        {
          title: 'Analytics',
          href: `/dashboard/analyst/analytics`,
          icon: BarChart,
        },
        {
          title: 'Insights',
          href: `/dashboard/analyst/insights`,
          icon: Users,
        },
      ],
      admin: [
        {
          title: 'Team',
          href: `/dashboard/admin/team`,
          icon: Users,
        },
        {
          title: 'Settings',
          href: `/dashboard/admin/settings`,
          icon: Settings,
        },
        {
          title: 'Security',
          href: `/dashboard/admin/security`,
          icon: Shield,
        },
      ],
    };

    return [...baseItems, ...roleItems[role]];
  };

  const navItems = getNavItems();

  return (
    <nav className="flex space-x-4 lg:space-x-6">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center text-sm font-medium transition-colors hover:text-primary',
              pathname === item.href
                ? 'text-black'
                : 'text-muted-foreground'
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
'use client';

import AdminSidebar from '../../../../components/dashboard/adminsidebar';
import { Shield, Users, Settings, Activity, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useRoleSwitch } from '../../../../contexts/role-switch-context';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { switchToRole } = useRoleSwitch();
  const router = useRouter();

  const handleSwitchToRole = (role: 'creator' | 'analyst') => {
    switchToRole(role);
    router.push(`/dashboard/${role}`);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Fixed width on the left */}
      <div className="w-64 shrink-0">
        <AdminSidebar />
      </div>

      {/* Main Content - Takes remaining width on the right */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header with Role Switching */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <div className="flex space-x-3">
              <Button 
                onClick={() => handleSwitchToRole('creator')} 
                variant="outline"
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <UserCog className="mr-2 h-4 w-4" />
                Switch to Creator View
              </Button>
              <Button 
                onClick={() => handleSwitchToRole('analyst')} 
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Activity className="mr-2 h-4 w-4" />
                Switch to Analyst View
              </Button>
            </div>
          </div>

          {/* Page Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
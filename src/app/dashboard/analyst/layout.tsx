'use client';

import { useRoleSwitch } from '../../../../contexts/role-switch-context';
import AnalystSidebar from '../../../../components/dashboard/analystsidebar';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';

export default function AnalystLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { originalRole, isSwitched, resetToAdmin } = useRoleSwitch();
  const router = useRouter();
  const isAdminViewing = originalRole === 'admin' && isSwitched;

  const handleResetToAdmin = () => {
    resetToAdmin();
    router.push('/dashboard/admin');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Fixed width on the left */}
      <div className="w-64 shrink-0">
        <AnalystSidebar />
      </div>

      {/* Main Content - Takes remaining width on the right */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header with Back Button */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Analytics Studio</h1>
            {isAdminViewing && (
              <Button onClick={handleResetToAdmin} variant="default">
                <Shield className="mr-2 h-4 w-4" />
                Back to Admin Dashboard
              </Button>
            )}
          </div>

          {/* Admin Viewing Banner */}
          {isAdminViewing && (
            <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
              <p className="text-blue-700 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                You are viewing the Analyst Dashboard as an Admin. Your changes will be applied with admin privileges.
              </p>
            </Card>
          )}

          {/* Page Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardNav } from '../../../components/dashboard/nav';
import { UserNav } from '../../../components/dashboard/user-nav';
import { RoleSwitcher } from '../../../components/dashboard/role-switcher';
import { authClient } from '../../../lib/auth-client';
import { RoleSwitchProvider,useRoleSwitch } from '../../../contexts/role-switch-context';
import { UserRole } from '../../../types/auth';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const { originalRole, currentRole, isSwitched, switchToRole, resetToAdmin } = useRoleSwitch();
  const [effectiveRole, setEffectiveRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      // Initialize role switch context for admin
      if (session.user.role === 'admin' && !originalRole) {
        // @ts-ignore - We need to initialize the context
        switchToRole(session.user.role);
      }
      
      // Determine effective role (switched role for admin, actual role for others)
      if (session.user.role === 'admin' && isSwitched && currentRole) {
        setEffectiveRole(currentRole);
      } else {
        setEffectiveRole(session.user.role as UserRole);
      }
    }
  }, [session, isSwitched, currentRole, originalRole]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || !effectiveRole) {
    return null;
  }

  const isAdmin = session.user.role === 'admin';
  const showResetButton = isAdmin && isSwitched;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h2 className="text-xl font-bold mr-8">SocialMediaTool</h2>
              <DashboardNav role={effectiveRole} />
            </div>
            <div className="flex items-center space-x-4">
              {/* Role Switcher - Only visible to admin */}
              {isAdmin && (
                <RoleSwitcher
                  currentRole={effectiveRole}
                  originalRole={session.user.role as UserRole}
                  isSwitched={isSwitched}
                  onSwitchRole={switchToRole}
                  onReset={resetToAdmin}
                />
              )}
              <UserNav user={{
                ...session.user,
                role: effectiveRole,
                isAdmin: isAdmin
              }} />
            </div>
          </div>
        </div>
      </nav>
      <main className="">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleSwitchProvider>
      <DashboardContent>
        {children}</DashboardContent>
    </RoleSwitchProvider>
  );
}
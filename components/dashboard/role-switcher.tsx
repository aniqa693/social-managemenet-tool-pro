'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SwitchRoleDialog } from './switch-role-dialog';
import { UserRole } from '../../types/auth';
import { Users, UserCog, BarChart, Shield } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: UserRole;
  originalRole: UserRole;
  isSwitched: boolean;
  onSwitchRole: (role: UserRole) => void;
  onReset: () => void;
}

export function RoleSwitcher({ 
  currentRole, 
  originalRole, 
  isSwitched, 
  onSwitchRole, 
  onReset 
}: RoleSwitcherProps) {
  const router = useRouter();
  const [showSwitchDialog, setShowSwitchDialog] = useState(false);

  const roleIcons = {
    admin: <Shield className="mr-2 h-4 w-4" />,
    creator: <Users className="mr-2 h-4 w-4" />,
    analyst: <BarChart className="mr-2 h-4 w-4" />
  };

  const roleNames = {
    admin: 'Admin',
    creator: 'Creator',
    analyst: 'Analyst'
  };

  const handleRoleSelect = (role: UserRole) => {
    if (role === originalRole) {
      onReset();
      router.push(`/dashboard/${role}`);
    } else {
      onSwitchRole(role);
      router.push(`/dashboard/${role}`);
    }
    setShowSwitchDialog(false);
  };

  // Only show for admin users
  if (originalRole !== 'admin') return null;

  return (
    <>
      <div className="flex items-center space-x-2">
        {isSwitched && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onReset();
              router.push(`/dashboard/${originalRole}`);
            }}
            className="mr-2"
          >
            <Shield className="mr-2 h-4 w-4" />
            Reset to Admin
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <UserCog className="mr-2 h-4 w-4" />
              {isSwitched ? `Viewing as: ${roleNames[currentRole]}` : 'Switch Role'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Switch to Role</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleRoleSelect('creator')}>
              {roleIcons.creator}
              Creator Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleSelect('analyst')}>
              {roleIcons.analyst}
              Analyst Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleSelect('admin')}>
              {roleIcons.admin}
              Admin Dashboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SwitchRoleDialog
        open={showSwitchDialog}
        onOpenChange={setShowSwitchDialog}
        currentRole={currentRole}
        onSwitch={handleRoleSelect}
      />
    </>
  );
}
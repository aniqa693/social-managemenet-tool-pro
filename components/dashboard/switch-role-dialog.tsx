'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserRole } from '../../types/auth';
import { Users, BarChart, Shield } from 'lucide-react';

interface SwitchRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRole: UserRole;
  onSwitch: (role: UserRole) => void;
}

export function SwitchRoleDialog({ open, onOpenChange, currentRole, onSwitch }: SwitchRoleDialogProps) {
  const roles: { role: UserRole; icon: any; description: string }[] = [
    { role: 'creator', icon: Users, description: 'Create and manage content' },
    { role: 'analyst', icon: BarChart, description: 'View analytics and reports' },
    { role: 'admin', icon: Shield, description: 'Full system access' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Switch Role</DialogTitle>
          <DialogDescription>
            Select which dashboard you want to access
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {roles.map(({ role, icon: Icon, description }) => (
            <Button
              key={role}
              variant={currentRole === role ? "default" : "outline"}
              className="justify-start h-auto p-4"
              onClick={() => onSwitch(role)}
            >
              <Icon className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold capitalize">{role}</div>
                <div className="text-sm text-muted-foreground">{description}</div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
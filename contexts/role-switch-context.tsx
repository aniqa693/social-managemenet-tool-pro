'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types/auth';

interface RoleSwitchContextType {
  originalRole: UserRole | null;
  currentRole: UserRole | null;
  isSwitched: boolean;
  switchToRole: (role: UserRole) => void;
  resetToAdmin: () => void;
}

const RoleSwitchContext = createContext<RoleSwitchContextType | undefined>(undefined);

export function RoleSwitchProvider({ children }: { children: React.ReactNode }) {
  const [originalRole, setOriginalRole] = useState<UserRole | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [isSwitched, setIsSwitched] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem('roleSwitch');
    if (stored) {
      const { original, current, switched } = JSON.parse(stored);
      setOriginalRole(original);
      setCurrentRole(current);
      setIsSwitched(switched);
    }
  }, []);

  const switchToRole = (role: UserRole) => {
    setCurrentRole(role);
    setIsSwitched(true);
    localStorage.setItem('roleSwitch', JSON.stringify({
      original: originalRole,
      current: role,
      switched: true
    }));
  };

  const resetToAdmin = () => {
    setCurrentRole(originalRole);
    setIsSwitched(false);
    localStorage.removeItem('roleSwitch');
  };

  return (
    <RoleSwitchContext.Provider value={{
      originalRole,
      currentRole,
      isSwitched,
      switchToRole,
      resetToAdmin,
    }}>
      {children}
    </RoleSwitchContext.Provider>
  );
}

export function useRoleSwitch() {
  const context = useContext(RoleSwitchContext);
  if (context === undefined) {
    throw new Error('useRoleSwitch must be used within a RoleSwitchProvider');
  }
  return context;
}
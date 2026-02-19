export type UserRole = 'creator' | 'analyst' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  image?: string | null;
  isAdmin?: boolean; // Helper flag
 // image:string|undefined;
}

export interface Session {
  user: User;
  session: {
    id: string;
    expiresAt: Date;
  };
}

// For role switching state
export interface RoleSwitchState {
  originalRole: UserRole;
  currentRole: UserRole;
  isSwitched: boolean;
}
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  trustScore: number;
  username: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default admin account
const DEFAULT_ADMIN: User = {
  id: 'admin-001',
  email: 'admin@trustnet.app',
  role: 'admin',
  trustScore: 100,
  username: 'TrustNet Admin',
  isVerified: true
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('trustnet_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Demo admin login
    if (email === 'admin@trustnet.app' && password === 'DemoAdmin123!') {
      setUser(DEFAULT_ADMIN);
      localStorage.setItem('trustnet_user', JSON.stringify(DEFAULT_ADMIN));
      return true;
    }
    
    // For demo purposes, allow any other email/password for regular users
    if (email && password) {
      const regularUser: User = {
        id: `user-${Date.now()}`,
        email,
        role: 'user',
        trustScore: Math.floor(Math.random() * 40) + 60, // 60-100 random trust score
        username: email.split('@')[0],
        isVerified: true
      };
      setUser(regularUser);
      localStorage.setItem('trustnet_user', JSON.stringify(regularUser));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('trustnet_user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('trustnet_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
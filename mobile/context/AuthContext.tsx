import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on mount
  useEffect(() => {
    // In a real app, you would check AsyncStorage for user data
    // For now, we'll just simulate checking and set loading to false
    const checkUser = async () => {
      setTimeout(() => {
        setUser(null); // Always start as logged out
        setIsLoading(false);
      }, 1000);
    };

    checkUser();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Mock login: only allow specific credentials
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (email === 'admin' && password === 'Admin') {
        const userData: User = {
          id: '123',
          name: 'Roma',
          email: email,
        };
        setUser(userData);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      // This would be an API call in a real app
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo purposes, any registration works
      const userData: User = {
        id: '123',
        name: name,
        email: email,
      };

      setUser(userData);
      // In a real app, store user in AsyncStorage
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    // Clear user data
    setUser(null);
    // In a real app, remove user from AsyncStorage
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

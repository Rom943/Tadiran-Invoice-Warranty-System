import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/ApiService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, registrationKey: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Clear error helper function
  const clearError = () => setError(null);
  
  // Check for stored user on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const userJSON = await AsyncStorage.getItem('user');
        
        if (userJSON) {
          const userData = JSON.parse(userJSON);
          
          // Verify session is still valid with the backend
          const isSessionValid = await ApiService.checkSession();
          
          if (isSessionValid) {
            setUser(userData);
          } else {
            // Session expired, clear stored user data
            await AsyncStorage.removeItem('user');
            // Don't need to set user to null as it's the default state
          }
        }
      } catch (error) {
        console.error('Failed to get user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Clear any previous errors
      setError(null);
      setIsLoading(true);
      
      const response = await ApiService.login(email, password);
      
      if (response.success) {
        const userData: User = {
          id: response.data.id,
          name: response.data.name || email, // Default to email if name is not provided
          email: response.data.email,
          role: 'installer',
        };
        
        // Save user to state and storage
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      
      setError(response.message || 'Login failed');
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'אירעה שגיאה בהתחברות');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  // Register function
  const register = async (name: string, email: string, password: string, registrationKey: string): Promise<boolean> => {
    try {
      // Clear any previous errors
      setError(null);
      setIsLoading(true);
      
      const response = await ApiService.register(name, email, password, registrationKey);
      
      if (response.success) {
        const userData: User = {
          id: response.data.id,
          name: response.data.name || name,
          email: response.data.email,
          role: 'installer', // Default role for mobile app users
        };
        
        // Save user to state and storage
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      
      setError(response.message || 'הרשמה נכשלה');
      return false;
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'אירעה שגיאה בהרשמה');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  // Logout function
  const logout = async (): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await ApiService.logout();
      
      // Clear user data regardless of response
      setUser(null);
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('lastLoginTime');
      
      return response.success;
    } catch (error: any) {
      console.error('Logout error:', error);
      // Still clear local data even if API call fails
      setUser(null);
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('lastLoginTime');
      setError(error.message || 'אירעה שגיאה בהתנתקות');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, logout, clearError }}>
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

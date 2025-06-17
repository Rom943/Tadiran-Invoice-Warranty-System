import { AuthProvider } from 'react-admin';

// Set the API URL based on your backend location
const API_URL = 'https://tadiran-invoice-warranty-system.onrender.com/api';

export const authProvider: AuthProvider = {  // Called when the user attempts to log in
  login: async ({ username, password }) => {
    try {
      // React-admin uses 'username' for the login field, but our API expects 'email'
      const email = username;

      if (!email || !password) {
        console.error('Missing credentials:', { email, password });
        return Promise.reject('Email and password are required');
      }
      
      
      const response = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ email, password }),
      });
      

      
      const data = await response.json();

      
      // Detailed error logging
      if (!response.ok) {
        const errorMessage = data.message || (data.errors ? JSON.stringify(data.errors) : 'Login failed');
        console.error('Login failed:', errorMessage);
        console.error('Response details:', data);
        throw new Error(errorMessage);
      }
      
      if (data.success) {

        // Store user info in localStorage
        localStorage.setItem('admin', JSON.stringify(data.data));
        return Promise.resolve();
      } else {
        console.error('Login response indicated failure:', data);
        return Promise.reject(new Error('Login failed'));
      }
    } catch (error) {
      console.error('Login error:', error);
      return Promise.reject(error);
    }
  },

  // Called when the user clicks on the logout button
  logout: async () => {
    try {
      await fetch(`${API_URL}/admin/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('admin');
    return Promise.resolve();
  },

  // Called when the API returns an error
  checkError: ({ status }: { status: number }) => {
    if (status === 401 || status === 403) {
      localStorage.removeItem('admin');
      return Promise.reject();
    }
    return Promise.resolve();
  },

  // Called when the user navigates to a new location, to check for authentication
  checkAuth: async () => {
    try {

      const response = await fetch(`${API_URL}/admin/check-session`, {
        method: 'GET',
        credentials: 'include',
      });

      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return Promise.resolve();
        }
      }
      
      localStorage.removeItem('admin');
      return Promise.reject();
    } catch (error) {
      console.error('Check auth error:', error);
      localStorage.removeItem('admin');
      return Promise.reject();
    }
  },

  // Called when the user navigates to a new location, to check for permissions / roles
  getPermissions: () => {
    return Promise.resolve('admin');
  },

  // Optional: Return user identity
  getIdentity: () => {
    try {
      const admin = localStorage.getItem('admin');
      if (admin) {
        const parsedAdmin = JSON.parse(admin);
        return Promise.resolve({
          id: parsedAdmin.id,
          fullName: parsedAdmin.name || parsedAdmin.email,
          avatar: undefined,
        });
      }
    } catch (error) {
      console.error('Error getting identity:', error);
    }
    return Promise.reject('No identity');
  },
};

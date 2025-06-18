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
      

      const responseText = await response.text();


      
      // Detailed error logging
      if (!response.ok) {
        console.error('Login request failed with status:', response.status);
        try {
            const errorData = JSON.parse(responseText);
            throw new Error(errorData.message || 'Login failed');
        } catch(e) {
            throw new Error(responseText || 'Login failed');
        }
      }
      
      const data = JSON.parse(responseText);

      if (data.success) {
        // Store the token for subsequent requests
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('admin', JSON.stringify(data.data));
        return Promise.resolve();
      } else {
        console.error('Login response indicated failure:', data);
        return Promise.reject(new Error(data.message || 'Login failed'));
      }
    } catch (error) {
      console.error('Caught error in login function:', error);
      return Promise.reject(error);
    }
  },
  // Called when the user clicks on the logout button
  logout: async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/admin/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear all authentication data
    localStorage.removeItem('admin');
    localStorage.removeItem('token');
    return Promise.resolve();
  },
  // Called when the API returns an error
  checkError: ({ status }: { status: number }) => {
    if (status === 401 || status === 403) {
      localStorage.removeItem('admin');
      localStorage.removeItem('token');
      return Promise.reject();
    }
    return Promise.resolve();
  },

  // Called when the user navigates to a new location, to check for authentication
  checkAuth: () => {
        const token = localStorage.getItem('token');
        if (token) {
            return Promise.resolve();
        }

        return Promise.reject();
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

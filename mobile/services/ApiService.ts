// filepath: services/ApiService.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import Constants from 'expo-constants';
import Config from '../constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for API requests
const API_URL = 
  process.env.NODE_ENV === 'production'
    ? Config.API_URL.production
    : Config.API_URL.development;

// Log the API URL for debugging
console.log('Using API URL:', API_URL);

interface ApiErrorResponse {
  success: boolean;
  message?: string;
  errors?: Array<{ msg: string, param: string }>;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    // Create axios instance with fixed API URL
    this.api = axios.create({
      baseURL: API_URL,
      timeout: Config.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true, // Important for cookie handling
    });
    
    // Add request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        // Log request details for debugging
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Add response interceptor for better error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        // Format error message
        let errorMessage = 'אירעה שגיאה בשרת';
        const originalError = error.toJSON ? error.toJSON() : { message: error.message };
        console.log('API Error details:', JSON.stringify(originalError));
        
        if (error.response) {
          // The request was made and the server responded with an error status
          console.log('Error response status:', error.response.status);
          console.log('Error response data:', JSON.stringify(error.response.data));
          
          if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data?.errors && error.response.data.errors.length > 0) {
            errorMessage = error.response.data.errors.map((err: { msg: string }) => err.msg).join(', ');
          }
        } else if (error.request) {
          // The request was made but no response was received
          console.log('No response received from server');
          if (error.code === 'ECONNABORTED') {
            errorMessage = 'פג זמן ההמתנה לתשובה מהשרת, נסה שנית מאוחר יותר';
          } else {
            errorMessage = 'לא התקבלה תשובה מהשרת, בדוק את החיבור לאינטרנט ושהשרת פעיל';
          }
        }
        
        // Create a new error with the formatted message
        const formattedError = new Error(errorMessage);
        formattedError.name = error.name;
        
        return Promise.reject(formattedError);
      }
    );
  }

  // Auth endpoints
  public async login(email: string, password: string) {
    try {
      const response = await this.api.post('/api/installer/login', { email, password });
      // Store last login time
      await AsyncStorage.setItem('lastLoginTime', Date.now().toString());
      return response.data;
    } catch (error) {
      console.log('Login error:', error);
      throw error;
    }
  }

  public async register(name: string, email: string, password: string, registrationKey: string) {
    try {
      const response = await this.api.post('/api/installer/register', {
        name,
        email,
        password,
        registrationKey,
      });
      // Store last login time on successful registration
      await AsyncStorage.setItem('lastLoginTime', Date.now().toString());
      return response.data;
    } catch (error) {
      console.log('Registration error:', error);
      throw error;
    }
  }
  
  /**
   * Check if user session is still valid
   */
  public async checkSession() {
    try {
      const response = await this.api.get('/api/installer/check-session');
      return response.data.success === true;
    } catch (error) {
      console.log('Session check error:', error);
      return false;
    }
  }

  public async logout() {
    try {
      const response = await this.api.post('/api/installer/logout');
      return response.data;
    } catch (error) {
      console.log('Logout error:', error);
      throw error;
    }
  }
  
  // For authorized requests
  public async getWithAuth(endpoint: string, config?: AxiosRequestConfig) {
    try {
      const response = await this.api.get(endpoint, config);
      return response.data;
    } catch (error: any) {
      console.log(`GET ${endpoint} error:`, error);
      
      // Handle authorization errors
      if (error.response && error.response.status === 401) {
        // Clear the stored user data on auth error
        await AsyncStorage.removeItem('user');
        // Could trigger an event to notify UI about logout requirement
      }
      
      throw error;
    }
  }

  public async postWithAuth(endpoint: string, data?: any, config?: AxiosRequestConfig) {
    try {
      const response = await this.api.post(endpoint, data, config);
      return response.data;
    } catch (error: any) {
      console.log(`POST ${endpoint} error:`, error);
      
      // Handle authorization errors
      if (error.response && error.response.status === 401) {
        // Clear the stored user data on auth error
        await AsyncStorage.removeItem('user');
        // Could trigger an event to notify UI about logout requirement
      }
      
      throw error;
    }
  }  // Helper method for file uploads using fetch API for better FormData support
  public async uploadFile(endpoint: string, formData: FormData, config?: AxiosRequestConfig) {
    try {
      const timeout = config?.timeout || 60000;
      
      console.log(`Uploading file to ${endpoint}`, { 
        baseURL: API_URL,
        timeout: timeout 
      });
      
      // Use fetch API for better FormData support in React Native
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        body: formData, // Don't set Content-Type, let fetch handle it
        credentials: 'include', // Include cookies for authentication
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Handle error response
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}` };
        }
        
        console.log('Error response status:', response.status);
        console.log('Error response data:', JSON.stringify(errorData));
        
        const errorMessage = errorData.message || `Request failed with status ${response.status}`;
        const error = new Error(errorMessage);
        (error as any).response = { status: response.status, data: errorData };
        throw error;
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.log(`File upload to ${endpoint} error:`, error);
      
      // Add more specific error handling for file uploads
      // Create connection error message
      if (!error.response || error.code === 'ECONNABORTED') {
        const networkError = new Error('לא ניתן להתחבר לשרת, בדוק את החיבור לאינטרנט ונסה שנית');
        networkError.name = error.name;
        throw networkError;
      }
      
      throw error;
    }
  }
}

export default new ApiService();

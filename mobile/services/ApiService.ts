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

interface ApiErrorResponse {
  success: boolean;
  message?: string;
  errors?: Array<{ msg: string, param: string }>;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: Config.API_TIMEOUT, // Use timeout from config
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true, // Important for cookie handling
    });
      // Add response interceptor for better error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        // Format error message
        let errorMessage = 'אירעה שגיאה בשרת';
        
        if (error.response) {
          // The request was made and the server responded with an error status
          if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data?.errors && error.response.data.errors.length > 0) {
            errorMessage = error.response.data.errors.map((err: { msg: string }) => err.msg).join(', ');
          }
        } else if (error.request) {
          // The request was made but no response was received
          errorMessage = 'לא התקבלה תשובה מהשרת, בדוק את החיבור לאינטרנט';
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
      const response = await this.api.post('/installer/login', { email, password });
      // Store last login time
      await AsyncStorage.setItem('lastLoginTime', Date.now().toString());
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  public async register(name: string, email: string, password: string, registrationKey: string) {
    try {
      const response = await this.api.post('/installer/register', {
        name,
        email,
        password,
        registrationKey,
      });
      // Store last login time on successful registration
      await AsyncStorage.setItem('lastLoginTime', Date.now().toString());
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  /**
   * Check if user session is still valid
   */
  public async checkSession() {
    try {
      const response = await this.api.get('/installer/check-session');
      return response.data.success === true;
    } catch (error) {
      console.error('Session check error:', error);
      return false;
    }
  }

  public async logout() {
    try {
      const response = await this.api.post('/installer/logout');
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
  // For authorized requests
  public async getWithAuth(endpoint: string, config?: AxiosRequestConfig) {
    try {
      const response = await this.api.get(endpoint, config);
      return response.data;
    } catch (error: any) {
      console.error(`GET ${endpoint} error:`, error);
      
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
      console.error(`POST ${endpoint} error:`, error);
      
      // Handle authorization errors
      if (error.response && error.response.status === 401) {
        // Clear the stored user data on auth error
        await AsyncStorage.removeItem('user');
        // Could trigger an event to notify UI about logout requirement
      }
      
      throw error;
    }
  }
  
  // Helper method for file uploads
  public async uploadFile(endpoint: string, formData: FormData, config?: AxiosRequestConfig) {
    try {
      const uploadConfig = {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...config?.headers,
        },
      };
      
      const response = await this.api.post(endpoint, formData, uploadConfig);
      return response.data;
    } catch (error) {
      console.error(`File upload to ${endpoint} error:`, error);
      throw error;
    }
  }
}

export default new ApiService();

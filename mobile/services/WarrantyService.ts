import { WarrantyRequest } from '../types';
import ApiService from './ApiService';

// Real API integration for warranty operations
export const WarrantyService = {
  // Add a function to test authentication before warranty submission
  testAuthentication: async (): Promise<boolean> => {
    try {
      console.log('Testing authentication status...');
      const response = await ApiService.getWithAuth('/api/installer/check-session');
      console.log('Authentication test result:', response);
      return response.success === true;
    } catch (error: any) {
      console.error('Authentication test failed:', error.message);
      return false;
    }
  },

  // Get all warranties for the current user
  getAllWarranties: async (page: number = 1, limit: number = 10, status?: string): Promise<{
    warranties: WarrantyRequest[], 
    pagination: { total: number, page: number, limit: number, totalPages: number }
  }> => {
    try {
      let endpoint = `/api/installer/warranties?page=${page}&limit=${limit}`;
      
      if (status) {
        endpoint += `&status=${status}`;
      }
      
      const response = await ApiService.getWithAuth(endpoint);
      
      if (response.success) {
        return {
          warranties: response.data.map((item: any) => ({
            id: item.id,
            clientName: item.clientName,
            productInfo: item.productInfo,
            installationDate: item.installationDate,
            submissionDate: item.createdAt,
            status: item.status.toLowerCase(),
            invoiceFile: item.invoiceUrl ? {
              type: 'image',
              uri: item.invoiceUrl,
              name: 'invoice.jpg',
            } : undefined,
          })),
          pagination: response.pagination
        };
      }
      
      throw new Error(response.message || 'Failed to fetch warranty data');
    } catch (error) {
      console.log('Error fetching warranties:', error);
      throw error;
    }
  },
  // Submit a new warranty request
  submitWarranty: async (warrantyData: {
    clientName: string;
    productInfo: string;
    installationDate: string;
    invoiceFile: {
      uri: string;
      type: string;
      name: string;
    };
  }): Promise<WarrantyRequest> => {
    try {
      // First, test authentication
      console.log('Testing authentication before warranty submission...');
      const isAuthenticated = await WarrantyService.testAuthentication();
      if (!isAuthenticated) {
        throw new Error('Authentication failed. Please log in again.');
      }
      console.log('Authentication confirmed. Proceeding with warranty submission.');
      
      console.log('Creating FormData for warranty submission');
      
      // Create form data for file upload
      const formData = new FormData();
        // Add all fields to form data
      formData.append('clientName', warrantyData.clientName); // Note: Backend has a typo in the field name
      formData.append('productSN', warrantyData.productInfo);
      formData.append('installDate', warrantyData.installationDate);
      
      
      // Log file details before upload (for debugging)
      console.log('File details:', {
        uri: warrantyData.invoiceFile.uri,
        name: warrantyData.invoiceFile.name,
        type: warrantyData.invoiceFile.type || 'application/octet-stream'
      });
        // Add invoice file - make sure type is set correctly based on file
      const fileType = warrantyData.invoiceFile.name.endsWith('.pdf') 
        ? 'application/pdf' 
        : 'image/jpeg'; // Use proper MIME type
        
      // @ts-ignore - FormData in React Native has a slightly different interface
      formData.append('invoiceImage', {
        uri: warrantyData.invoiceFile.uri,
        name: warrantyData.invoiceFile.name,
        type: fileType,
      } as any);console.log('Submitting warranty request to API');
      console.log('Form data being sent:', {
        clientName: warrantyData.clientName,
        productSN: warrantyData.productInfo,
        installDate: warrantyData.installationDate,
        invoiceImage: 'File attached'
      });
      
      // Submit warranty request with a longer timeout for file uploads
      const response = await ApiService.uploadFile('/api/warranties', formData, {
        timeout: 60000 // 60 seconds timeout for uploads
      });
      
      console.log('Warranty API response received:', response);
      
      if (response.success) {
        return {
          id: response.data.id,
          clientName: response.data.clientName,
          productInfo: response.data.productInfo,
          installationDate: response.data.installationDate,
          submissionDate: response.data.createdAt,
          status: response.data.status.toLowerCase(),
          invoiceFile: response.data.invoiceUrl ? {
            type: 'image',
            uri: response.data.invoiceUrl,
            name: 'invoice.jpg',
          } : undefined,
        };
      }
      
      throw new Error(response.message || 'Failed to submit warranty request');
    } catch (error: any) {
      console.log('Error submitting warranty:', error.message);
      // Check if it's a network-related error message from ApiService or a generic network error
      if (error.message.includes('לא ניתן להתחבר לשרת') || error.message.includes('Network Error') || error.message.includes('timeout') || error.message.includes('Failed to fetch')) {
        throw new Error('לא ניתן להתחבר לשרת, בדוק את החיבור לאינטרנט ונסה שנית');
      }
      // For other errors, re-throw to let ApiService's handler format it or handle it further
      throw error;
    }
  },

  // Get warranty details by ID
  getWarrantyById: async (warrantyId: string): Promise<WarrantyRequest> => {
    try {
      const response = await ApiService.getWithAuth(`/api/warranties/${warrantyId}`);
      if (response.success) {
        return {
          id: response.data.id,
          clientName: response.data.clientName,
          productInfo: response.data.productInfo,
          installationDate: response.data.installationDate,
          submissionDate: response.data.createdAt,
          status: response.data.status.toLowerCase(),
          invoiceFile: response.data.invoiceUrl ? {
            type: 'image',
            uri: response.data.invoiceUrl,
            name: 'invoice.jpg',
          } : undefined,
        };
      }      throw new Error(response.message || 'Failed to fetch warranty details');
    } catch (error) {
      console.log('Error fetching warranty details:', error);
      throw error;
    }  },
  // Process invoice OCR
  processInvoice: async (
    fileUri: string, 
    installationDate: string
  ): Promise<'approved' | 'rejected' | 'pending'> => {
    try {
      // The OCR processing is handled on the backend as part of warranty creation
      // This method remains for future implementation of separate OCR processing
      console.log('OCR processing handled on the server during warranty creation');
      
      // Return pending since the actual OCR happens during warranty creation on the backend
      return 'pending';
    } catch (error) {
      console.log('Error processing invoice:', error);
      return 'pending'; // Default to pending if there's an error
    }
  }
};

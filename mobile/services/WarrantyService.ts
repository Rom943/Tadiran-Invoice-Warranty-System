import { WarrantyRequest } from '../types';
import ApiService from './ApiService';

// Real API integration for warranty operations
export const WarrantyService = {
  // Get all warranties for the current user
  getAllWarranties: async (page: number = 1, limit: number = 10, status?: string): Promise<{
    warranties: WarrantyRequest[], 
    pagination: { total: number, page: number, limit: number, totalPages: number }
  }> => {
    try {
      let endpoint = `/installer/warranties?page=${page}&limit=${limit}`;
      
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
      console.error('Error fetching warranties:', error);
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
  }): Promise<WarrantyRequest> => {    try {
      // Create form data for file upload
      const formData = new FormData();
      
      // Add all fields to form data
      formData.append('clientName', warrantyData.clientName);
      formData.append('productInfo', warrantyData.productInfo);
      formData.append('installationDate', warrantyData.installationDate);
      
      // Add invoice file
      // @ts-ignore - FormData in React Native has a slightly different interface
      formData.append('invoiceFile', {
        uri: warrantyData.invoiceFile.uri,
        name: warrantyData.invoiceFile.name,
        type: warrantyData.invoiceFile.type,
      });
      
      // Submit warranty request
      const response = await ApiService.uploadFile('/installer/warranties', formData);
      
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
    } catch (error) {
      console.error('Error submitting warranty:', error);
      throw error;
    }
  },

  // Get warranty details by ID
  getWarrantyById: async (warrantyId: string): Promise<WarrantyRequest> => {
    try {
      const response = await ApiService.getWithAuth(`/installer/warranties/${warrantyId}`);
      
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
      console.error('Error fetching warranty details:', error);
      throw error;
    }
  }
};

import { WarrantyRequest } from '../types';

// Mock data for warranty history
const mockWarrantyData: WarrantyRequest[] = [
  {
    id: '1',
    clientName: 'John Doe',
    productInfo: 'Model A123, SN: 456789',
    installationDate: '2025-05-20',
    submissionDate: '2025-05-21',
    status: 'approved',
  },
  {
    id: '2',
    clientName: 'Jane Smith',
    productInfo: 'Model B456, SN: 123456',
    installationDate: '2025-05-15',
    submissionDate: '2025-06-10',
    status: 'rejected',
  },
  {
    id: '3',
    clientName: 'Alex Johnson',
    productInfo: 'Model C789, SN: 654321',
    installationDate: '2025-06-01',
    submissionDate: '2025-06-05',
    status: 'pending',
  },
  {
    id: '4',
    clientName: 'Sarah Williams',
    productInfo: 'Model D012, SN: 987654234234234234',
    installationDate: '2025-05-25',
    submissionDate: '2025-05-26',
    status: 'manual_review',
  },
];

// In a real app, these functions would make API calls
export const WarrantyService = {
  // Get all warranties for the current user
  getAllWarranties: async (): Promise<WarrantyRequest[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockWarrantyData;
  },
  
  // Submit a new warranty request
  submitWarranty: async (warrantyData: Omit<WarrantyRequest, 'id' | 'status' | 'submissionDate'>): Promise<WarrantyRequest> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a new warranty request with pending status
    const newWarranty: WarrantyRequest = {
      id: Math.random().toString(36).substring(2, 9), // Generate random ID
      ...warrantyData,
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'pending',
    };
    
    // In a real app, this would be stored in a database
    // For demo purposes, just return the new warranty
    return newWarranty;
  },

  // Process OCR on invoice
  processInvoice: async (invoiceUri: string, installationDate: string): Promise<string> => {
    // Simulate API delay for OCR processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate OCR result - in a real app, this would analyze the invoice date
    const today = new Date();
    const installDate = new Date(installationDate);
    const daysDiff = Math.floor((today.getTime() - installDate.getTime()) / (1000 * 3600 * 24));
    
    // Status based on date difference (for demo purposes)
    if (daysDiff <= 21) {
      return 'approved';
    } else if (Math.random() > 0.7) {
      return 'manual_review'; // Occasionally fail OCR
    } else {
      return 'rejected';
    }
  }
};

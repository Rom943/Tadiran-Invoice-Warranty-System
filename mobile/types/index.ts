// Define interface for user
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'installer';
  // Add more user fields as needed
}

// Define interface for warranty request
export interface WarrantyRequest {
  id: string;
  clientName: string;
  productInfo: string;
  installationDate: string;
  submissionDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress';
  invoiceUrl?: string; // Optional field for invoice URL
}

// Define interface for user
export interface User {
  id: string;
  name: string;
  email: string;
  // Add more user fields as needed
}

// Define interface for warranty request
export interface WarrantyRequest {
  id: string;
  clientName: string;
  productInfo: string;
  installationDate: string;
  submissionDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'manual_review';
  invoiceFile?: {
    type: 'image' | 'document';
    uri: string;
    name: string;
  };
}

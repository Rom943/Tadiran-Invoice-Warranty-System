import * as React from 'react';

declare module 'react/jsx-runtime' {
  export default React;
}

// Declare global types for JSX elements
interface WarrantyRecord {
  id: string;
  productSN: string;
  clientName: string;
  installDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS';
  installerId: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface InstallerRecord {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    warranties: number;
  };
}

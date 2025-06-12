import { Request } from 'express';

// Extend the Express Request interface to include the file uploaded by Multer
// No need to import anything from multer as Express.Multer is already declared
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

export interface JwtPayload {
  userId: string;
  userType: 'installer' | 'admin';
  email: string;
  iat?: number;
  exp?: number;
}

export interface InstallerUserDto {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
}

export interface AdminUserDto {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
}

export interface WarrantyDto {
  id: string;
  installerId: string;
  productSN: string;
  imageUrl?: string;
  clietnName: string; // Note: there's a typo in the schema, it should be clientName
  installDate: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS';
  adminUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InstallerRegistrationKeyDto {
  id: string;
  key: string;
  installerId?: string;
  adminId: string;
  createdAt: Date;
  updatedAt: Date;
}

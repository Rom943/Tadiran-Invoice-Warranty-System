// filepath: src/middleware/upload.middleware.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import config from '../config/env.config';

// Ensure the temp directory exists
if (!fs.existsSync(config.tempDir)) {
  fs.mkdirSync(config.tempDir, { recursive: true });
}

// Set up storage configuration for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter function to only allow images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP, and PDF files are allowed.'));
  }
};

// Create multer upload instance
const upload = multer({ 
  storage,
  fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware to handle file upload errors
export const handleUploadErrors = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  return (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File is too large. Maximum size is 5MB.'
        });
      }
    }
    
    return res.status(400).json({
      success: false,
      message: err.message || 'Error uploading file.'
    });
  };
};

// Single file upload middleware
export const uploadInvoiceImage = (req: Request, res: Response, next: NextFunction) => {
  upload.single('invoiceImage')(req, res, (err) => {
    if (err) {
      return handleUploadErrors(req, res, next)(err);
    }
    next();
  });
};

export default uploadInvoiceImage;

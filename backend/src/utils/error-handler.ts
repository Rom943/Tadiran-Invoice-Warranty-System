import { Response } from 'express';
import { ValidationError } from 'express-validator';

export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export const formatValidationErrors = (errors: ValidationError[]) => {
  return errors.reduce((acc: Record<string, string>, err) => {
    // Use type assertion to handle different ValidationError structures
    const error = err as any;
    const param = error.param || error.path || 'unknown';
    const msg = error.msg || error.message || 'Invalid value';
    
    acc[param] = msg;
    return acc;
  }, {});
};

export const errorHandler = (res: Response, error: unknown): void => {
  
  
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: error.name
    });
    return;
  }
  
  // Handle OCR specific errors
  if (error instanceof Error && error.message.includes('Tesseract')) {
    res.status(500).json({
      success: false,
      message: 'Error processing image with OCR',
      error: error.message,
      status: 'IN_PROGRESS' // Default to manual review when OCR fails
    });
    return;
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error instanceof Error ? error.message : 'Unknown error'
  });
};

import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwtService from '../services/jwt.service';
import { ApiError } from '../utils/error-handler';
import { JwtPayload } from '../types';

// Extend Express Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Authentication middleware to verify JWT token from cookies
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let token = req.cookies.token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      const error = new ApiError('Not authenticated', 401);
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    // Verify token
    const decoded = jwtService.verifyToken(token);
    if (!decoded) {
      const error = new ApiError('Invalid or expired token', 401);
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    // Add user data to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'An unexpected error occurred' });
    }
  }
};

/**
 * Middleware to ensure user is an installer
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export const requireInstaller = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user || req.user.userType !== 'installer') {
      const error = new ApiError('Access denied. Installer permissions required.', 403);
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
      return;
    }
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
  }
};

/**
 * Middleware to ensure user is an admin
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user || req.user.userType !== 'admin') {
      const error = new ApiError('Access denied. Admin permissions required.', 403);
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
      return;
    }
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
  }
};

/**
 * Middleware to ensure user is either an admin or a specific installer
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export const requireAdminOrSpecificInstaller = (paramName: string = 'installerId'): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        const error = new ApiError('Not authenticated', 401);
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
        return;
      }

      // Allow if user is admin
      if (req.user.userType === 'admin') {
        next();
        return;
      }

      // Allow if user is the specific installer
      const requestedId = req.params.id || req.body[paramName];
      if (req.user.userType === 'installer' && requestedId === req.user.userId) {
        next();
        return;
      }

      const error = new ApiError('Access denied. Insufficient permissions.', 403);
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }
  };
};

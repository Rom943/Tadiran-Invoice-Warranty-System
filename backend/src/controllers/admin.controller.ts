import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '../../generated/prisma';
import passwordService from '../services/password.service';
import jwtService from '../services/jwt.service';
import { ApiError, errorHandler, formatValidationErrors } from '../utils/error-handler';
import config from '../config/env.config';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/admin/register:
 *   post:
 *     summary: Register a new admin user
 *     description: Create a new admin user (requires admin authentication)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Admin's password
 *               name:
 *                 type: string
 *                 description: Admin's name (optional)
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       409:
 *         description: Email already exists
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: formatValidationErrors(errors.array())
      });
      return;
    }

    // Request body
    const { email, password, name } = req.body;

    // Check if email is already in use
    const existingUser = await prisma.adminUser.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new ApiError('Email already registered', 409);
    }

    // Hash password
    const hashedPassword = await passwordService.hashPassword(password);

    // Create admin user
    const user = await prisma.adminUser.create({
      data: {
        email,
        name,
        password: hashedPassword
      }
    });

    // Return success response (don't automatically log in the new admin)
    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    errorHandler(res, error);
  }
};

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Login as admin
 *     description: Authenticate admin and get JWT token in cookie
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid credentials
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: formatValidationErrors(errors.array())
      });
      return;
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.adminUser.findUnique({
      where: { email }
    });

    // Check if user exists
    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await passwordService.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Generate JWT token
    const token = jwtService.generateToken(user.id, 'admin', user.email);

    // Set token in cookie
    res.cookie('token', token, config.cookie.options);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        token: token //for testing purposes, you might not want to return the token in production
      }
    });
  } catch (error) {
    errorHandler(res, error);
  }
};

/**
 * @swagger
 * /api/admin/warranties:
 *   get:
 *     summary: Get all warranties
 *     description: Get all warranty requests (admin only)
 *     tags: [Admin, Warranty]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, IN_PROGRESS]
 *         description: Filter warranties by status
 *       - in: query
 *         name: installerId
 *         schema:
 *           type: string
 *         description: Filter warranties by installer ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of warranties
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
export const getWarranties = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, installerId } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build query filters
    const where = {
      ...(status ? { status: status as any } : {}),
      ...(installerId ? { installerId: installerId as string } : {})
    };

    // Get warranties with pagination
    const warranties = await prisma.warranty.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        installer: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        adminUser: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    // Get total count for pagination
    const total = await prisma.warranty.count({ where });

    // Return success response
    res.status(200).json({
      success: true,
      data: warranties,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    errorHandler(res, error);
  }
};

/**
 * @swagger
 * /api/admin/logout:
 *   post:
 *     summary: Logout admin
 *     description: Clear authentication cookie
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Logout successful
 */
export const logout = (req: Request, res: Response): void => {
  // Clear the token cookie
  res.clearCookie('token');
  
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
};

/**
 * @swagger
 * /api/admin/check-session:
 *   get:
 *     summary: Check if admin session is valid
 *     description: Verifies if the current JWT token is valid for an admin user
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Session status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - Invalid or expired session
 */
export const checkSession = (req: Request, res: Response): void => {
  // If we've reached this point, it means the auth middleware has
  // already validated the token, so we can just return success
  if (req.user) {
    res.status(200).json({
      success: true,
      message: 'Session is valid',
      data: {
        userId: req.user.userId,
        email: req.user.email,
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired session'
    });
  }
};

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
 * /api/installer/register:
 *   post:
 *     summary: Register a new installer
 *     description: Register a new installer using a valid registration key
 *     tags: [Installer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - registrationKey
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Installer's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Installer's password
 *               name:
 *                 type: string
 *                 description: Installer's name (optional)
 *               registrationKey:
 *                 type: string
 *                 description: Registration key provided by admin
 *     responses:
 *       201:
 *         description: Installer registered successfully
 *       400:
 *         description: Invalid input or registration key already used
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

    const { email, password, name, registrationKey } = req.body;

    // Check if email is already in use
    const existingUser = await prisma.installerUser.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new ApiError('Email already registered', 409);
    }

    // Find registration key and check if it's available
    const keyRecord = await prisma.installerRegistrationKey.findUnique({
      where: { key: registrationKey }
    });

    if (!keyRecord) {
      throw new ApiError('Invalid registration key', 400);
    }

    if (keyRecord.installerId) {
      throw new ApiError('Registration key already used', 400);
    }

    // Hash password
    const hashedPassword = await passwordService.hashPassword(password);    // Create installer user in transaction
    const user = await prisma.$transaction(async (prisma) => {
      // Create user
      const newUser = await prisma.installerUser.create({
        data: {
          email,
          name,
          password: hashedPassword
        }
      });

      // Update registration key with installer ID
      await prisma.installerRegistrationKey.update({
        where: { id: keyRecord.id },
        data: {
          installerId: newUser.id
        }
      });

      return newUser; // This return is okay since it's part of the transaction callback
    });

    // Generate JWT token
    const token = jwtService.generateToken(user.id, 'installer', user.email);

    // Set token in cookie
    res.cookie('token', token, config.cookie.options);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Installer registered successfully',
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
 * /api/installer/login:
 *   post:
 *     summary: Login as installer
 *     description: Authenticate installer and get JWT token in cookie
 *     tags: [Installer]
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
    const user = await prisma.installerUser.findUnique({
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
    const token = jwtService.generateToken(user.id, 'installer', user.email);

    // Set token in cookie
    res.cookie('token', token, config.cookie.options);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
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
 * /api/installer/warranties:
 *   get:
 *     summary: Get warranties by installer
 *     description: Get all warranties created by the authenticated installer
 *     tags: [Installer, Warranty]
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
 */
export const getWarranties = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError('Not authenticated', 401);
    }

    const { status } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build query filters
    const where = {
      installerId: req.user.userId,
      ...(status ? { status: status as any } : {})
    };

    // Get warranties with pagination
    const warranties = await prisma.warranty.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
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
 * /api/installer/logout:
 *   post:
 *     summary: Logout installer
 *     description: Clear authentication cookie
 *     tags: [Installer]
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
 * /api/installer/check-session:
 *   get:
 *     summary: Check if user session is valid
 *     description: Verifies if the current JWT token is valid
 *     tags: [Installer]
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

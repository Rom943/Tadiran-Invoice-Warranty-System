import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '../../generated/prisma';
import { ApiError, errorHandler, formatValidationErrors } from '../utils/error-handler';
import { uploadImage } from '../utils/cloudinary';
import ocrService from '../services/ocr.service';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/warranties:
 *   post:
 *     summary: Create a new warranty
 *     description: Submit a new warranty request (installer only)
 *     tags: [Warranty]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productSN
 *               - clietnName
 *               - installDate
 *             properties:
 *               productSN:
 *                 type: string
 *                 description: Product serial number
 *               clietnName:
 *                 type: string
 *                 description: Client name (Note: there's a typo in schema)
 *               installDate:
 *                 type: string
 *                 format: date
 *                 description: Installation date (YYYY-MM-DD)
 *               imageUrl:
 *                 type: string
 *                 description: URL to uploaded invoice image (optional)
 *     responses:
 *       201:
 *         description: Warranty created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
export const createWarranty = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check authentication
    if (!req.user) {
      throw new ApiError('Not authenticated', 401);
    }

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: formatValidationErrors(errors.array())
      });
      return;
    }

    // Check if invoice image was uploaded
    if (!req.file) {
      throw new ApiError('Invoice image is required', 400);
    }

    const { productSN, clietnName, installDate } = req.body;
    const installDateObj = new Date(installDate);
    
    // Upload image to Cloudinary
    const invoiceImagePath = req.file.path;
    const imageUrl = await uploadImage(invoiceImagePath);
    
    // Process image with OCR
    const ocrResult = await ocrService.verifyInstallationDate(invoiceImagePath, installDateObj);
    
    // Determine warranty status based on OCR results
    const warrantyStatus = ocrResult.matches ? 'APPROVED' : 
                          (ocrResult.extractedDates.length > 0 ? 'REJECTED' : 'IN_PROGRESS');

    // Create warranty
    const warranty = await prisma.warranty.create({
      data: {
        productSN,
        clietnName,
        installDate: installDateObj,
        imageUrl,
        status: warrantyStatus as any,
        installerId: req.user.userId
      }
    });

    // Clean up temp file
    fs.unlinkSync(invoiceImagePath);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Warranty created successfully',
      data: {
        warranty,
        ocrResults: {
          status: warrantyStatus,
          extractedDates: ocrResult.extractedDates,
          matches: ocrResult.matches
        }
      }
    });
  } catch (error) {
    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    errorHandler(res, error);
  }
};

/**
 * @swagger
 * /api/warranties/{id}:
 *   put:
 *     summary: Update a warranty
 *     description: Update warranty details (admin or warranty owner only)
 *     tags: [Warranty]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Warranty ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productSN:
 *                 type: string
 *                 description: Product serial number
 *               clietnName:
 *                 type: string
 *                 description: Client name
 *               installDate:
 *                 type: string
 *                 format: date
 *                 description: Installation date (YYYY-MM-DD)
 *               imageUrl:
 *                 type: string
 *                 description: URL to uploaded invoice image
 *     responses:
 *       200:
 *         description: Warranty updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Warranty not found
 */
export const updateWarranty = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check authentication
    if (!req.user) {
      throw new ApiError('Not authenticated', 401);
    }

    const { id } = req.params;
    const { productSN, clietnName, installDate, imageUrl } = req.body;

    // Check if warranty exists
    const existingWarranty = await prisma.warranty.findUnique({
      where: { id }
    });

    if (!existingWarranty) {
      throw new ApiError('Warranty not found', 404);
    }

    // Check authorization (admin or warranty owner)
    if (req.user.userType !== 'admin' && existingWarranty.installerId !== req.user.userId) {
      throw new ApiError('Not authorized to update this warranty', 403);
    }

    // Prepare update data
    const updateData: any = {};
    if (productSN !== undefined) updateData.productSN = productSN;
    if (clietnName !== undefined) updateData.clietnName = clietnName;
    if (installDate !== undefined) updateData.installDate = new Date(installDate);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    // Update warranty
    const warranty = await prisma.warranty.update({
      where: { id },
      data: updateData
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Warranty updated successfully',
      data: warranty
    });
  } catch (error) {
    errorHandler(res, error);
  }
};

/**
 * @swagger
 * /api/warranties/{id}/status:
 *   patch:
 *     summary: Update warranty status
 *     description: Update warranty status (admin only)
 *     tags: [Warranty]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Warranty ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, APPROVED, REJECTED, IN_PROGRESS]
 *                 description: New warranty status
 *     responses:
 *       200:
 *         description: Warranty status updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Warranty not found
 */
export const updateWarrantyStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check authentication
    if (!req.user || req.user.userType !== 'admin') {
      throw new ApiError('Not authorized', 403);
    }

    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS'];
    if (!validStatuses.includes(status)) {
      throw new ApiError('Invalid status value', 400);
    }

    // Check if warranty exists
    const existingWarranty = await prisma.warranty.findUnique({
      where: { id }
    });

    if (!existingWarranty) {
      throw new ApiError('Warranty not found', 404);
    }

    // Update warranty status
    const warranty = await prisma.warranty.update({
      where: { id },
      data: {
        status,
        adminUserId: req.user.userId
      }
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Warranty status updated successfully',
      data: warranty
    });
  } catch (error) {
    errorHandler(res, error);
  }
};

/**
 * @swagger
 * /api/warranties/{id}:
 *   get:
 *     summary: Get warranty by ID
 *     description: Get warranty details by ID (admin or warranty owner only)
 *     tags: [Warranty]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Warranty ID
 *     responses:
 *       200:
 *         description: Warranty details
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Warranty not found
 */
export const getWarrantyById = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check authentication
    if (!req.user) {
      throw new ApiError('Not authenticated', 401);
    }

    const { id } = req.params;

    // Find warranty with related data
    const warranty = await prisma.warranty.findUnique({
      where: { id },
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

    // Check if warranty exists
    if (!warranty) {
      throw new ApiError('Warranty not found', 404);
    }

    // Check authorization (admin or warranty owner)
    if (req.user.userType !== 'admin' && warranty.installerId !== req.user.userId) {
      throw new ApiError('Not authorized to view this warranty', 403);
    }

    // Return success response
    res.status(200).json({
      success: true,
      data: warranty
    });
  } catch (error) {
    errorHandler(res, error);
  }
};

/**
 * @swagger
 * /api/warranties:
 *   get:
 *     summary: Get all warranties
 *     description: Get warranties according to user role
 *     tags: [Warranty]
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
export const getAllWarranties = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check authentication
    if (!req.user) {
      throw new ApiError('Not authenticated', 401);
    }

    const { status } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build query filters
    let where: any = {};
    
    // For installers, only show their warranties
    if (req.user.userType === 'installer') {
      where.installerId = req.user.userId;
    }
    
    // Apply status filter if provided
    if (status) {
      where.status = status;
    }

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

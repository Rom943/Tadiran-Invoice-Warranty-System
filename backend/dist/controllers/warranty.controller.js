"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllWarranties = exports.getWarrantyById = exports.updateWarranty = exports.createWarranty = void 0;
const express_validator_1 = require("express-validator");
const prisma_1 = require("../../generated/prisma");
const error_handler_1 = require("../utils/error-handler");
const cloudinary_1 = require("../utils/cloudinary");
const ocr_service_1 = require("../services/ocr.service");
const fs_1 = __importDefault(require("fs"));
const prisma = new prisma_1.PrismaClient();
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
const createWarranty = async (req, res) => {
    let invoiceImagePath = undefined; // Define here for broader scope
    try {
        // Check authentication
        if (!req.user) {
            throw new error_handler_1.ApiError('Not authenticated', 401);
        }
        // Validate request
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                errors: (0, error_handler_1.formatValidationErrors)(errors.array())
            });
            return;
        } // Check if invoice image was uploaded
        if (!req.file) {
            throw new error_handler_1.ApiError('Invoice image is required', 400);
        }
        invoiceImagePath = req.file.path; // Assign path for OCR and cleanup
        const { productSN, clientName, installDate } = req.body;
        const installDateObj = new Date(installDate);
        // Perform OCR validation on the uploaded image
        let ocrValidation;
        let warrantyStatus = prisma_1.WarrantyStatus.PENDING; // Default status
        if (invoiceImagePath) {
            try {
                console.log('Starting OCR validation for warranty creation...');
                ocrValidation = await (0, ocr_service_1.validateWarrantyByOCR)(invoiceImagePath, installDateObj);
                // Set warranty status based on OCR validation result
                warrantyStatus = ocrValidation.status;
                console.log(`OCR validation completed. Status: ${warrantyStatus}`, {
                    extractedDatesCount: ocrValidation.extractedDates.length,
                    matchingDate: ocrValidation.matchingDate?.toISOString(),
                    daysDifference: ocrValidation.daysDifference
                });
            }
            catch (ocrError) {
                console.warn('OCR validation failed:', ocrError);
                // Set to IN_PROGRESS if OCR fails
                warrantyStatus = prisma_1.WarrantyStatus.IN_PROGRESS;
                ocrValidation = {
                    status: 'IN_PROGRESS',
                    extractedDates: [],
                    ocrText: '',
                    error: ocrError instanceof Error ? ocrError.message : 'OCR processing failed'
                };
            }
        } // Upload image to Cloudinary
        const cloudinaryUrl = await (0, cloudinary_1.uploadImage)(invoiceImagePath); // uploadImage returns the URL string
        // Create warranty entry in database
        const newWarranty = await prisma.warranty.create({
            data: {
                productSN,
                clientName,
                installDate: installDateObj,
                imageUrl: cloudinaryUrl,
                status: warrantyStatus, // Use the status determined by OCR validation
                installer: {
                    connect: {
                        id: req.user.userId // Corrected: Use userId from req.user
                    }
                }
            },
        });
        // Create appropriate response message based on OCR result
        let responseMessage = 'Warranty created successfully';
        if (ocrValidation) {
            switch (ocrValidation.status) {
                case 'APPROVED':
                    responseMessage = 'Warranty created and automatically approved - invoice date verified';
                    break;
                case 'REJECTED':
                    responseMessage = 'Warranty created but rejected - invoice date outside acceptable range';
                    break;
                case 'IN_PROGRESS':
                    responseMessage = ocrValidation.error || 'Warranty created and pending manual review - could not automatically verify invoice date';
                    break;
            }
        }
        res.status(201).json({
            success: true,
            message: responseMessage,
            data: {
                ...newWarranty,
                ocrValidation: ocrValidation ? {
                    status: ocrValidation.status,
                    extractedDatesCount: ocrValidation.extractedDates.length,
                    matchingDate: ocrValidation.matchingDate?.toISOString(),
                    daysDifference: ocrValidation.daysDifference,
                    error: ocrValidation.error
                } : undefined
            },
        });
    }
    catch (error) { // Catches errors from try block
        // console.log('--- DEBUG: res object in createWarranty before calling errorHandler ---');
        // console.log(typeof res);
        // console.log(Object.keys(res)); // Log keys to see if it looks like an Express response
        // console.log('Is res.status a function?', typeof res.status === 'function');
        (0, error_handler_1.errorHandler)(res, error); // Corrected: Swapped res and error arguments
    }
    finally {
        // Clean up uploaded file from temp directory
        if (invoiceImagePath) {
            try {
                fs_1.default.unlinkSync(invoiceImagePath);
            }
            catch (cleanupError) {
                console.error('Error deleting temp file:', cleanupError);
            }
        }
    }
};
exports.createWarranty = createWarranty;
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
 *               clientName:
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
const updateWarranty = async (req, res) => {
    try {
        // Check authentication
        if (!req.user) {
            throw new error_handler_1.ApiError('Not authenticated', 401);
        }
        console.log('Update warranty request:', req.user);
        console.log('Request body:', req.body);
        console.log('Request params:', req.params);
        const { id } = req.params;
        const { productSN, clientName, installDate, imageUrl, status } = req.body;
        // Check if warranty exists
        console.log('Looking for warranty with ID:', id);
        const existingWarranty = await prisma.warranty.findUnique({
            where: { id }
        });
        if (!existingWarranty) {
            console.log('Warranty not found for ID:', id);
            throw new error_handler_1.ApiError('Warranty not found', 404);
        }
        console.log('Found existing warranty:', existingWarranty);
        // Check authorization (admin or warranty owner)
        if (req.user.userType !== 'admin' && existingWarranty.installerId !== req.user.userId) {
            throw new error_handler_1.ApiError('Not authorized to update this warranty', 403);
        }
        // Prepare update data
        let updateData = {};
        if (productSN !== undefined)
            updateData.productSN = productSN;
        if (clientName !== undefined)
            updateData.clientName = clientName;
        if (installDate !== undefined)
            updateData.installDate = new Date(installDate);
        if (imageUrl !== undefined)
            updateData.imageUrl = imageUrl;
        if (status !== undefined) {
            const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS'];
            if (!validStatuses.includes(status)) {
                throw new error_handler_1.ApiError('Invalid status value', 400);
            }
            updateData.status = status;
        }
        console.log('Update data prepared:', updateData);
        // Update warranty
        console.log('Attempting to update warranty...');
        const warranty = await prisma.warranty.update({
            where: { id },
            data: updateData
        });
        console.log('Warranty updated successfully:', warranty);
        // Return success response
        res.status(200).json({
            success: true,
            message: 'Warranty updated successfully',
            data: warranty
        });
    }
    catch (error) {
        console.error('Error in updateWarranty:', error);
        (0, error_handler_1.errorHandler)(res, error);
    }
};
exports.updateWarranty = updateWarranty;
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
const getWarrantyById = async (req, res) => {
    try {
        // Check authentication
        if (!req.user) {
            throw new error_handler_1.ApiError('Not authenticated', 401);
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
            throw new error_handler_1.ApiError('Warranty not found', 404);
        }
        // Check authorization (admin or warranty owner)
        if (req.user.userType !== 'admin' && warranty.installerId !== req.user.userId) {
            throw new error_handler_1.ApiError('Not authorized to view this warranty', 403);
        }
        // Return success response
        res.status(200).json({
            success: true,
            data: warranty
        });
    }
    catch (error) {
        (0, error_handler_1.errorHandler)(res, error);
    }
};
exports.getWarrantyById = getWarrantyById;
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
const getAllWarranties = async (req, res) => {
    try {
        // Check authentication
        if (!req.user) {
            throw new error_handler_1.ApiError('Not authenticated', 401);
        }
        const { status } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Build query filters
        let where = {};
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
    }
    catch (error) {
        (0, error_handler_1.errorHandler)(res, error);
    }
};
exports.getAllWarranties = getAllWarranties;

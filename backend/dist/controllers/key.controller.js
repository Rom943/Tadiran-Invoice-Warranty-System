"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteKey = exports.getAllKeys = exports.createKey = void 0;
const prisma_1 = require("../../generated/prisma");
const error_handler_1 = require("../utils/error-handler");
const uuid_1 = require("uuid");
const prisma = new prisma_1.PrismaClient();
/**
 * @swagger
 * /api/keys:
 *   post:
 *     summary: Create a new installer registration key
 *     description: Generate a new registration key for installers (admin only)
 *     tags: [Registration Key]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Registration key created successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
const createKey = async (req, res) => {
    try {
        // Check authentication
        if (!req.user || req.user.userType !== 'admin') {
            throw new error_handler_1.ApiError('Not authorized', 403);
        }
        // Generate unique key
        const key = (0, uuid_1.v4)();
        // Create registration key
        const registrationKey = await prisma.installerRegistrationKey.create({
            data: {
                key,
                adminId: req.user.userId
            }
        });
        // Return success response
        res.status(201).json({
            success: true,
            message: 'Registration key created successfully',
            data: registrationKey
        });
    }
    catch (error) {
        (0, error_handler_1.errorHandler)(res, error);
    }
};
exports.createKey = createKey;
/**
 * @swagger
 * /api/keys:
 *   get:
 *     summary: Get all registration keys
 *     description: Get all installer registration keys (admin only)
 *     tags: [Registration Key]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: used
 *         schema:
 *           type: boolean
 *         description: Filter keys by used status (true/false)
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
 *         description: List of registration keys
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
const getAllKeys = async (req, res) => {
    try {
        // Check authentication
        if (!req.user || req.user.userType !== 'admin') {
            throw new error_handler_1.ApiError('Not authorized', 403);
        }
        const usedParam = req.query.used;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Build query filters
        const where = {};
        // Apply used filter if provided
        if (usedParam !== undefined) {
            const isUsed = usedParam === 'true';
            where.installerId = isUsed ? { not: null } : null;
        }
        // Get registration keys with pagination
        const keys = await prisma.installerRegistrationKey.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                admin: {
                    select: {
                        id: true,
                        email: true,
                        name: true
                    }
                },
                installer: {
                    select: {
                        id: true,
                        email: true,
                        name: true
                    }
                }
            }
        });
        // Get total count for pagination
        const total = await prisma.installerRegistrationKey.count({ where });
        // Return success response
        res.status(200).json({
            success: true,
            data: keys,
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
exports.getAllKeys = getAllKeys;
/**
 * @swagger
 * /api/keys/{id}:
 *   delete:
 *     summary: Delete an unused registration key
 *     description: Delete an unused installer registration key (admin only)
 *     tags: [Registration Key]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Registration key ID
 *     responses:
 *       200:
 *         description: Registration key deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized or key is already used
 *       404:
 *         description: Registration key not found
 */
const deleteKey = async (req, res) => {
    try {
        // Check authentication
        if (!req.user || req.user.userType !== 'admin') {
            throw new error_handler_1.ApiError('Not authorized', 403);
        }
        const { id } = req.params;
        // Check if key exists
        const key = await prisma.installerRegistrationKey.findUnique({
            where: { id }
        });
        if (!key) {
            throw new error_handler_1.ApiError('Registration key not found', 404);
        }
        // Check if key is already used
        if (key.installerId) {
            throw new error_handler_1.ApiError('Cannot delete a registration key that is already used', 403);
        }
        // Delete the key
        await prisma.installerRegistrationKey.delete({
            where: { id }
        });
        // Return success response
        res.status(200).json({
            success: true,
            message: 'Registration key deleted successfully'
        });
    }
    catch (error) {
        (0, error_handler_1.errorHandler)(res, error);
    }
};
exports.deleteKey = deleteKey;

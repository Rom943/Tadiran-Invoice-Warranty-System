"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSession = exports.logout = exports.getWarranties = exports.login = exports.register = void 0;
const express_validator_1 = require("express-validator");
const prisma_1 = require("../../generated/prisma");
const password_service_1 = __importDefault(require("../services/password.service"));
const jwt_service_1 = __importDefault(require("../services/jwt.service"));
const error_handler_1 = require("../utils/error-handler");
const env_config_1 = __importDefault(require("../config/env.config"));
const prisma = new prisma_1.PrismaClient();
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
const register = async (req, res) => {
    try {
        // Validate request
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                errors: (0, error_handler_1.formatValidationErrors)(errors.array())
            });
            return;
        }
        const { email, password, name, registrationKey } = req.body;
        // Check if email is already in use
        const existingUser = await prisma.installerUser.findUnique({
            where: { email }
        });
        if (existingUser) {
            throw new error_handler_1.ApiError('Email already registered', 409);
        }
        // Find registration key and check if it's available
        const keyRecord = await prisma.installerRegistrationKey.findUnique({
            where: { key: registrationKey }
        });
        if (!keyRecord) {
            throw new error_handler_1.ApiError('Invalid registration key', 400);
        }
        if (keyRecord.installerId) {
            throw new error_handler_1.ApiError('Registration key already used', 400);
        }
        // Hash password
        const hashedPassword = await password_service_1.default.hashPassword(password); // Create installer user in transaction
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
        const token = jwt_service_1.default.generateToken(user.id, 'installer', user.email);
        // Set token in cookie
        res.cookie('token', token, env_config_1.default.cookie.options);
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
    }
    catch (error) {
        (0, error_handler_1.errorHandler)(res, error);
    }
};
exports.register = register;
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
const login = async (req, res) => {
    try {
        // Validate request
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                errors: (0, error_handler_1.formatValidationErrors)(errors.array())
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
            throw new error_handler_1.ApiError('Invalid credentials', 401);
        }
        // Verify password
        const isPasswordValid = await password_service_1.default.comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new error_handler_1.ApiError('Invalid credentials', 401);
        }
        // Generate JWT token
        const token = jwt_service_1.default.generateToken(user.id, 'installer', user.email);
        // Set token in cookie
        res.cookie('token', token, env_config_1.default.cookie.options);
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
    }
    catch (error) {
        (0, error_handler_1.errorHandler)(res, error);
    }
};
exports.login = login;
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
const getWarranties = async (req, res) => {
    try {
        if (!req.user) {
            throw new error_handler_1.ApiError('Not authenticated', 401);
        }
        const { status } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Build query filters
        const where = {
            installerId: req.user.userId,
            ...(status ? { status: status } : {})
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
    }
    catch (error) {
        (0, error_handler_1.errorHandler)(res, error);
    }
};
exports.getWarranties = getWarranties;
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
const logout = (req, res) => {
    // Clear the token cookie
    res.clearCookie('token');
    res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
};
exports.logout = logout;
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
const checkSession = (req, res) => {
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
    }
    else {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired session'
        });
    }
};
exports.checkSession = checkSession;

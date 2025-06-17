"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const installerController = __importStar(require("../controllers/installer.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Installer
 *   description: Installer user operations
 */
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
 *               password:
 *                 type: string
 *                 format: password
 *               name:
 *                 type: string
 *               registrationKey:
 *                 type: string
 *     responses:
 *       201:
 *         description: Installer registered successfully
 *       400:
 *         description: Invalid input or registration key already used
 *       409:
 *         description: Email already exists
 */
router.post('/register', [
    (0, express_validator_1.body)('email').isEmail().withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('registrationKey').notEmpty().withMessage('Registration key is required')
], installerController.register);
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
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required')
], installerController.login);
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
router.get('/warranties', auth_middleware_1.authenticate, auth_middleware_1.requireInstaller, installerController.getWarranties);
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
router.post('/logout', installerController.logout);
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
 *       401:
 *         description: Unauthorized - Invalid or expired session
 */
router.get('/check-session', auth_middleware_1.authenticate, auth_middleware_1.requireInstaller, installerController.checkSession);
exports.default = router;

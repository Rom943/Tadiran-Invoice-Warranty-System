import { Router } from 'express';
import { body } from 'express-validator';
import * as installerController from '../controllers/installer.controller';
import { authenticate, requireInstaller } from '../middleware/auth.middleware';

const router = Router();

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
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('registrationKey').notEmpty().withMessage('Registration key is required')
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
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
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
router.get('/warranties', authenticate, requireInstaller, installerController.getWarranties);

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
router.get('/check-session', authenticate, requireInstaller, installerController.checkSession);

export default router;

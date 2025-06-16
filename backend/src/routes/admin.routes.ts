import { Router } from 'express';
import { body } from 'express-validator';
import * as adminController from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin operations
 */

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
router.post('/register', [
  authenticate,
  requireAdmin,
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], adminController.register);

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
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], adminController.login);

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
router.get('/warranties', authenticate, requireAdmin, adminController.getWarranties);

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
router.post('/logout', adminController.logout);

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
 *       401:
 *         description: Unauthorized - Invalid or expired session
 */
router.get('/check-session', authenticate, requireAdmin, adminController.checkSession);

/**
 * @swagger
 * /api/admin/installers:
 *   get:
 *     summary: Get all installer users
 *     description: Get all installer users (admin only)
 *     tags: [Admin, Installer]
 *     security:
 *       - cookieAuth: []
 *     parameters:
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
 *         description: List of installer users
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get('/installers', authenticate, requireAdmin, adminController.getInstallerUsers);

/**
 * @swagger
 * /api/admin/installers/{installerId}/warranties:
 *   get:
 *     summary: Get warranties by installer ID
 *     description: Get all warranties for a specific installer user (admin only)
 *     tags: [Admin, Installer, Warranty]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: installerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The installer user ID
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
 *         description: List of warranties for the installer
 *       400:
 *         description: Invalid installer ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Installer not found
 */
router.get('/installers/:installerId/warranties', authenticate, requireAdmin, adminController.getWarrantiesByInstaller);

/**
 * @swagger
 * /api/admin/admins:
 *   get:
 *     summary: Get all admin users
 *     description: Get all admin users (admin only)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
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
 *         description: List of admin users
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get('/admins', authenticate, requireAdmin, adminController.getAdmins);

export default router;

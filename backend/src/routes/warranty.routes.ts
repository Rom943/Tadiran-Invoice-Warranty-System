import { Router } from 'express';
import { body, param } from 'express-validator';
import * as warrantyController from '../controllers/warranty.controller';
import { authenticate, requireInstaller, requireAdmin, requireAdminOrSpecificInstaller } from '../middleware/auth.middleware';
import { uploadInvoiceImage } from '../middleware/upload.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Warranty
 *   description: Warranty operations
 */

/**
 * @swagger
 * /api/warranties:
 *   post:
 *     summary: Create a new warranty
 *     description: Submit a new warranty request with invoice image (installer only)
 *     tags: [Warranty]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - productSN
 *               - clientName
 *               - installDate
 *               - invoiceImage
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
 *               invoiceImage:
 *                 type: string
 *                 format: binary
 *                 description: Invoice image to be processed with OCR
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
router.post('/', [
  authenticate,
  requireInstaller,
  uploadInvoiceImage,
  body('productSN').notEmpty().withMessage('Product serial number is required'),
  body('clientName').notEmpty().withMessage('Client name is required'),
  body('installDate').isISO8601().toDate().withMessage('Valid installation date is required')
], warrantyController.createWarranty);

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
router.get('/', authenticate, warrantyController.getAllWarranties);

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
router.get('/:id', [
  authenticate,
  param('id').isString().withMessage('Invalid warranty ID')
], warrantyController.getWarrantyById);

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
router.put('/:id', [
  authenticate,
  param('id').isString().withMessage('Invalid warranty ID'),
  body('installDate').optional().isISO8601().toDate().withMessage('Valid installation date is required')
], warrantyController.updateWarranty);

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
 *   put:
 *     summary: Update warranty status (alternative for PATCH)
 *     description: Update warranty status using PUT method (admin only)
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
router.patch('/:id/status', [
  authenticate,
  requireAdmin,
  param('id').isString().withMessage('Invalid warranty ID'),
  body('status').isIn(['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS']).withMessage('Invalid status value')
], warrantyController.updateWarrantyStatus);

// Add a PUT route for the same endpoint to support React Admin
router.put('/:id/status', [
  authenticate,
  requireAdmin,
  param('id').isString().withMessage('Invalid warranty ID'),
  body('status').isIn(['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS']).withMessage('Invalid status value')
], warrantyController.updateWarrantyStatus);

export default router;

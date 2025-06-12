import { Router } from 'express';
import { param } from 'express-validator';
import * as keyController from '../controllers/key.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Registration Key
 *   description: Installer registration key operations
 */

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
router.post('/', authenticate, requireAdmin, keyController.createKey);

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
router.get('/', authenticate, requireAdmin, keyController.getAllKeys);

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
router.delete('/:id', [
  authenticate,
  requireAdmin,
  param('id').isString().withMessage('Invalid key ID')
], keyController.deleteKey);

export default router;

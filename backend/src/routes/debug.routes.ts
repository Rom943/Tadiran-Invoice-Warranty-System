import { Router } from 'express';
import { corsTest } from '../controllers/debug.controller';

const router = Router();

/**
 * @swagger
 * /api/debug/cors-test:
 *   get:
 *     summary: Test CORS configuration
 *     description: An endpoint to verify that the server is sending the correct CORS headers.
 *     tags: [Debug]
 *     responses:
 *       200:
 *         description: CORS headers are correctly configured.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: CORS is working!
 */
router.get('/cors-test', corsTest);

export default router;

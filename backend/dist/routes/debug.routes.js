"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const debug_controller_1 = require("../controllers/debug.controller");
const router = (0, express_1.Router)();
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
router.get('/cors-test', debug_controller_1.corsTest);
exports.default = router;

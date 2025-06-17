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
const warrantyController = __importStar(require("../controllers/warranty.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
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
    auth_middleware_1.authenticate,
    auth_middleware_1.requireInstaller,
    upload_middleware_1.uploadInvoiceImage,
    (0, express_validator_1.body)('productSN').notEmpty().withMessage('Product serial number is required'),
    (0, express_validator_1.body)('clientName').notEmpty().withMessage('Client name is required'),
    (0, express_validator_1.body)('installDate').isISO8601().toDate().withMessage('Valid installation date is required')
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
router.get('/', auth_middleware_1.authenticate, warrantyController.getAllWarranties);
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
    auth_middleware_1.authenticate,
    (0, express_validator_1.param)('id').isString().withMessage('Invalid warranty ID')
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
    auth_middleware_1.authenticate,
    (0, express_validator_1.param)('id').isString().withMessage('Invalid warranty ID'),
    (0, express_validator_1.body)('installDate').optional().isISO8601().toDate().withMessage('Valid installation date is required')
], warrantyController.updateWarranty);
exports.default = router;

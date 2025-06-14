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
const keyController = __importStar(require("../controllers/key.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
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
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, keyController.createKey);
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
router.get('/', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, keyController.getAllKeys);
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
    auth_middleware_1.authenticate,
    auth_middleware_1.requireAdmin,
    (0, express_validator_1.param)('id').isString().withMessage('Invalid key ID')
], keyController.deleteKey);
exports.default = router;

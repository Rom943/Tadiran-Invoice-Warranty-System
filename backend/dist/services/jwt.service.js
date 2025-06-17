"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_config_1 = __importDefault(require("../config/env.config"));
exports.default = {
    /**
     * Generate a JWT token for a user
     * @param userId - User ID
     * @param userType - Type of user (installer or admin)
     * @param email - User email
     * @returns JWT token
     */
    generateToken(userId, userType, email) {
        const payload = {
            userId,
            userType,
            email
        };
        // Use a type assertion to tell TypeScript this is a valid secret
        return jsonwebtoken_1.default.sign(payload, env_config_1.default.jwt.secret, { expiresIn: env_config_1.default.jwt.expiresIn });
    },
    /**
     * Verify a JWT token
     * @param token - JWT token to verify
     * @returns Decoded token payload or null if invalid
     */
    verifyToken(token) {
        try {
            // Also use type assertion here for consistency
            const decoded = jsonwebtoken_1.default.verify(token, env_config_1.default.jwt.secret);
            return decoded;
        }
        catch (error) {
            return null;
        }
    }
};

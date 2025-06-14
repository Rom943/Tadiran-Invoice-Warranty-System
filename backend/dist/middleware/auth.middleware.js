"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminOrSpecificInstaller = exports.requireAdmin = exports.requireInstaller = exports.authenticate = void 0;
const jwt_service_1 = __importDefault(require("../services/jwt.service"));
const error_handler_1 = require("../utils/error-handler");
/**
 * Authentication middleware to verify JWT token from cookies
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
const authenticate = (req, res, next) => {
    try {
        // Get token from cookie
        const token = req.cookies.token;
        if (!token) {
            const error = new error_handler_1.ApiError('Not authenticated', 401);
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
            return;
        }
        // Verify token
        const decoded = jwt_service_1.default.verifyToken(token);
        if (!decoded) {
            const error = new error_handler_1.ApiError('Invalid or expired token', 401);
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
            return;
        }
        // Add user data to request
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof error_handler_1.ApiError) {
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        else {
            res.status(401).json({
                success: false,
                message: 'Authentication failed'
            });
        }
    }
};
exports.authenticate = authenticate;
/**
 * Middleware to ensure user is an installer
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
const requireInstaller = (req, res, next) => {
    try {
        if (!req.user || req.user.userType !== 'installer') {
            const error = new error_handler_1.ApiError('Access denied. Installer permissions required.', 403);
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
            return;
        }
        next();
    }
    catch (error) {
        if (error instanceof error_handler_1.ApiError) {
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        else {
            res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
    }
};
exports.requireInstaller = requireInstaller;
/**
 * Middleware to ensure user is an admin
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
const requireAdmin = (req, res, next) => {
    try {
        if (!req.user || req.user.userType !== 'admin') {
            const error = new error_handler_1.ApiError('Access denied. Admin permissions required.', 403);
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
            return;
        }
        next();
    }
    catch (error) {
        if (error instanceof error_handler_1.ApiError) {
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        else {
            res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
    }
};
exports.requireAdmin = requireAdmin;
/**
 * Middleware to ensure user is either an admin or a specific installer
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
const requireAdminOrSpecificInstaller = (paramName = 'installerId') => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                const error = new error_handler_1.ApiError('Not authenticated', 401);
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
                return;
            }
            // Allow if user is admin
            if (req.user.userType === 'admin') {
                next();
                return;
            }
            // Allow if user is the specific installer
            const requestedId = req.params.id || req.body[paramName];
            if (req.user.userType === 'installer' && requestedId === req.user.userId) {
                next();
                return;
            }
            const error = new error_handler_1.ApiError('Access denied. Insufficient permissions.', 403);
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        catch (error) {
            if (error instanceof error_handler_1.ApiError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            else {
                res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }
    };
};
exports.requireAdminOrSpecificInstaller = requireAdminOrSpecificInstaller;

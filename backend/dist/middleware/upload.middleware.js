"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadInvoiceImage = exports.handleUploadErrors = void 0;
// filepath: src/middleware/upload.middleware.ts
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const env_config_1 = __importDefault(require("../config/env.config"));
// Ensure the temp directory exists
if (!fs_1.default.existsSync(env_config_1.default.tempDir)) {
    fs_1.default.mkdirSync(env_config_1.default.tempDir, { recursive: true });
}
// Set up storage configuration for multer
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, env_config_1.default.tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
// Filter function to only allow images
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP, and PDF files are allowed.'));
    }
};
// Create multer upload instance
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});
// Middleware to handle file upload errors
const handleUploadErrors = (req, res, next) => {
    return (err) => {
        if (err instanceof multer_1.default.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File is too large. Maximum size is 5MB.'
                });
            }
        }
        return res.status(400).json({
            success: false,
            message: err.message || 'Error uploading file.'
        });
    };
};
exports.handleUploadErrors = handleUploadErrors;
// Single file upload middleware
const uploadInvoiceImage = (req, res, next) => {
    upload.single('invoiceImage')(req, res, (err) => {
        if (err) {
            return (0, exports.handleUploadErrors)(req, res, next)(err);
        }
        next();
    });
};
exports.uploadInvoiceImage = uploadInvoiceImage;
exports.default = exports.uploadInvoiceImage;

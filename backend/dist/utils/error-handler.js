"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.formatValidationErrors = exports.ApiError = void 0;
class ApiError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ApiError';
    }
}
exports.ApiError = ApiError;
const formatValidationErrors = (errors) => {
    return errors.reduce((acc, err) => {
        // Use type assertion to handle different ValidationError structures
        const error = err;
        const param = error.param || error.path || 'unknown';
        const msg = error.msg || error.message || 'Invalid value';
        acc[param] = msg;
        return acc;
    }, {});
};
exports.formatValidationErrors = formatValidationErrors;
const errorHandler = (res, error) => {
    if (error instanceof ApiError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
            error: error.name
        });
        return;
    }
    // Handle OCR specific errors
    if (error instanceof Error && error.message.includes('Tesseract')) {
        res.status(500).json({
            success: false,
            message: 'Error processing image with OCR',
            error: error.message,
            status: 'IN_PROGRESS' // Default to manual review when OCR fails
        });
        return;
    }
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
    });
};
exports.errorHandler = errorHandler;

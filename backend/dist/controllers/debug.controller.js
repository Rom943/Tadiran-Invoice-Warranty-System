"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsTest = void 0;
/**
 * Debug endpoint to test CORS headers
 */
const corsTest = (req, res) => {
    res.json({
        message: 'CORS is working!',
        origin: req.headers.origin,
    });
};
exports.corsTest = corsTest;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const installer_routes_1 = __importDefault(require("./installer.routes"));
const admin_routes_1 = __importDefault(require("./admin.routes"));
const warranty_routes_1 = __importDefault(require("./warranty.routes"));
const key_routes_1 = __importDefault(require("./key.routes"));
const router = (0, express_1.Router)();
// Install all routes
router.use('/api/installer', installer_routes_1.default);
router.use('/api/admin', admin_routes_1.default);
router.use('/api/warranties', warranty_routes_1.default);
router.use('/api/keys', key_routes_1.default);
exports.default = router;

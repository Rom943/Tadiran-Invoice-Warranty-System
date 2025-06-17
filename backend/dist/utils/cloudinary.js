"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicIdFromUrl = exports.deleteImage = exports.uploadImage = void 0;
// filepath: src/utils/cloudinary.ts
const cloudinary_1 = require("cloudinary");
const env_config_1 = __importDefault(require("../config/env.config"));
// Configure cloudinary
cloudinary_1.v2.config({
    cloud_name: env_config_1.default.cloudinary.cloudName,
    api_key: env_config_1.default.cloudinary.apiKey,
    api_secret: env_config_1.default.cloudinary.apiSecret,
    secure: true,
});
const uploadImage = async (filePath) => {
    try {
        const result = await cloudinary_1.v2.uploader.upload(filePath, {
            folder: env_config_1.default.cloudinary.folder,
            resource_type: 'image',
        });
        return result.secure_url;
    }
    catch (error) {
        throw error;
    }
};
exports.uploadImage = uploadImage;
const deleteImage = async (publicId) => {
    try {
        await cloudinary_1.v2.uploader.destroy(publicId);
    }
    catch (error) {
        throw error;
    }
};
exports.deleteImage = deleteImage;
// Helper to get public ID from full URL
const getPublicIdFromUrl = (url) => {
    const urlParts = url.split('/');
    const filenameWithExtension = urlParts[urlParts.length - 1];
    const filename = filenameWithExtension.split('.')[0];
    const foldername = urlParts[urlParts.length - 2];
    return `${foldername}/${filename}`;
};
exports.getPublicIdFromUrl = getPublicIdFromUrl;
exports.default = cloudinary_1.v2;

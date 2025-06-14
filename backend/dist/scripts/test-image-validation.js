"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ocr_service_1 = require("../services/ocr.service");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Test script to validate image processing improvements
 */
async function testImageValidation() {
    console.log('🧪 Testing Image Validation and OCR Error Handling...\n');
    // Test with a non-existent file
    console.log('1. Testing non-existent file...');
    try {
        const result = await (0, ocr_service_1.validateImageFile)('./non-existent-image.jpg');
        console.log('Validation result:', result);
    }
    catch (error) {
        console.log('Error:', error.message);
    }
    console.log('---\n');
    // Test with an empty file (simulate corrupted file)
    console.log('2. Creating and testing empty file...');
    const emptyFilePath = path_1.default.join(__dirname, '../../temp/empty-test.jpg');
    // Ensure temp directory exists
    const tempDir = path_1.default.dirname(emptyFilePath);
    if (!fs_1.default.existsSync(tempDir)) {
        fs_1.default.mkdirSync(tempDir, { recursive: true });
    }
    // Create empty file
    fs_1.default.writeFileSync(emptyFilePath, '');
    try {
        const result = await (0, ocr_service_1.validateImageFile)(emptyFilePath);
        console.log('Validation result:', result);
        if (result.isValid) {
            console.log('Testing OCR with empty file...');
            const ocrResult = await (0, ocr_service_1.validateWarrantyByOCR)(emptyFilePath, new Date('2025-06-13'));
            console.log('OCR result:', ocrResult);
        }
    }
    catch (error) {
        console.log('Error:', error.message);
    }
    finally {
        // Clean up
        if (fs_1.default.existsSync(emptyFilePath)) {
            fs_1.default.unlinkSync(emptyFilePath);
        }
    }
    console.log('---\n');
    // Test with unsupported file type
    console.log('3. Creating and testing unsupported file type...');
    const txtFilePath = path_1.default.join(__dirname, '../../temp/test.txt');
    fs_1.default.writeFileSync(txtFilePath, 'This is a text file, not an image');
    try {
        const result = await (0, ocr_service_1.validateImageFile)(txtFilePath);
        console.log('Validation result:', result);
    }
    catch (error) {
        console.log('Error:', error.message);
    }
    finally {
        // Clean up
        if (fs_1.default.existsSync(txtFilePath)) {
            fs_1.default.unlinkSync(txtFilePath);
        }
    }
    console.log('---\n');
    console.log('✅ Image validation tests completed!');
}
// Run the test if this file is executed directly
if (require.main === module) {
    testImageValidation().catch(console.error);
}

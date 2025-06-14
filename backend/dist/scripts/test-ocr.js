"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ocr_service_1 = require("../services/ocr.service");
/**
 * Test script to debug OCR functionality
 * Usage: npx ts-node src/scripts/test-ocr.ts <image-path> <installation-date>
 */
async function testOCR() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log('Usage: npx ts-node src/scripts/test-ocr.ts <image-path> <installation-date>');
        console.log('Example: npx ts-node src/scripts/test-ocr.ts ./temp/invoice.jpg 2025-06-13');
        process.exit(1);
    }
    const imagePath = args[0];
    const installationDate = new Date(args[1]);
    console.log('🔍 Testing OCR functionality...');
    console.log('Image path:', imagePath);
    console.log('Installation date:', installationDate.toISOString());
    console.log('---');
    try {
        // Test text extraction
        console.log('1. Extracting text from image...');
        const ocrText = await (0, ocr_service_1.extractTextWithFallback)(imagePath);
        console.log('Extracted text:', JSON.stringify(ocrText));
        console.log('Text length:', ocrText.length);
        console.log('---');
        // Test date extraction
        console.log('2. Extracting dates from text...');
        const extractedDates = (0, ocr_service_1.extractDatesFromText)(ocrText);
        console.log('Extracted dates:', extractedDates.map(d => d.toISOString()));
        console.log('---');
        // Test full validation
        console.log('3. Running full warranty validation...');
        const validation = await (0, ocr_service_1.validateWarrantyByOCR)(imagePath, installationDate);
        console.log('Validation result:', JSON.stringify(validation, null, 2));
    }
    catch (error) {
        console.error('❌ Error during OCR test:', error);
    }
}
// Run the test if this file is executed directly
if (require.main === module) {
    testOCR();
}

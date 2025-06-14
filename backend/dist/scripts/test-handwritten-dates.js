"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ocr_service_1 = require("../services/ocr.service");
/**
 * Test date extraction with handwritten content like your image
 */
function testHandwrittenDateExtraction() {
    console.log('🧪 Testing Handwritten Date Extraction...\n');
    const testCases = [
        // Your specific case
        '13/6/2025',
        '13 / 6 / 2025',
        '13/6/2025 תאריך',
        'תאריך 13/6/2025',
        // Variations
        '3/6/2025',
        '13/06/2025',
        '13 6 2025',
        '13.6.2025',
        '13-6-2025',
        // OCR might misread as
        'i3/6/2025',
        '13/G/2025',
        '13/б/2025',
        // With Hebrew text mixed in
        'תאריך: 13/6/2025 סכום',
        '13/6/2025 : תאריך',
    ];
    for (const [index, testText] of testCases.entries()) {
        console.log(`Test ${index + 1}: "${testText}"`);
        const extractedDates = (0, ocr_service_1.extractDatesFromText)(testText);
        console.log(`  Found ${extractedDates.length} dates:`);
        extractedDates.forEach(date => {
            console.log(`    - ${date.toLocaleDateString()} (${date.toISOString().split('T')[0]})`);
        });
        // Test validation against June 13, 2025
        const installationDate = new Date('2025-06-13');
        const validation = (0, ocr_service_1.validateInvoiceDateRange)(installationDate, extractedDates);
        console.log(`  Validation: ${validation.status}`);
        if (validation.matchingDate) {
            console.log(`    Match: ${validation.matchingDate.toLocaleDateString()} (${validation.daysDifference} days difference)`);
        }
        console.log('---');
    }
}
// Run the test
testHandwrittenDateExtraction();

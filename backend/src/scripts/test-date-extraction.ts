import { extractDatesFromText, validateInvoiceDateRange } from '../services/ocr.service';

/**
 * Test date extraction with sample text
 */
function testDateExtraction() {
  console.log('🧪 Testing date extraction patterns...\n');
  
  const testCases = [
    'Invoice Date: 13/06/2025 Total: $500',
    'Date: 2025-06-13 Amount: 500',
    'Invoice 13.06.2025 Client: John Doe',
    'Invoice 06/13/2025 Total: $500',
    'Date 13-06-25 Payment Due',
    '2025.06.13 Invoice #1234',
    'תאריך: 13/06/2025 סכום: 500₪',
    'Very short text',
    '12345 no dates here',
    'Invoice from 31/12/2024 for client'
  ];
  
  for (const [index, testText] of testCases.entries()) {
    console.log(`Test ${index + 1}: "${testText}"`);
    
    const extractedDates = extractDatesFromText(testText);
    console.log(`  Found ${extractedDates.length} dates:`);
    
    extractedDates.forEach(date => {
      console.log(`    - ${date.toISOString().split('T')[0]} (${date.toLocaleDateString()})`);
    });
    
    // Test validation against a reference date (2025-06-13)
    const installationDate = new Date('2025-06-13');
    const validation = validateInvoiceDateRange(installationDate, extractedDates);
    console.log(`  Validation: ${validation.status}`);
    if (validation.matchingDate) {
      console.log(`    Match: ${validation.matchingDate.toISOString().split('T')[0]} (${validation.daysDifference} days difference)`);
    }
    
    console.log('---');
  }
}

// Run the test
testDateExtraction();

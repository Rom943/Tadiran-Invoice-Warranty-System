// Quick test for date extraction
const { extractDatesFromText } = require('./services/ocr.service');

console.log('Testing handwritten date extraction...');

const testTexts = [
  '13/6/2025',
  '13 / 6 / 2025', 
  'תאריך 13/6/2025',
  '13 6 2025',
];

testTexts.forEach((text, i) => {
  console.log(`\nTest ${i + 1}: "${text}"`);
  try {
    const dates = extractDatesFromText(text);
    console.log(`Found ${dates.length} dates:`, dates.map(d => d.toLocaleDateString()));
  } catch (error) {
    console.log('Error:', error.message);
  }
});

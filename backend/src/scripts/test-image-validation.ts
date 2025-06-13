import { validateImageFile, validateWarrantyByOCR } from '../services/ocr.service';
import fs from 'fs';
import path from 'path';

/**
 * Test script to validate image processing improvements
 */
async function testImageValidation() {
  console.log('🧪 Testing Image Validation and OCR Error Handling...\n');
  
  // Test with a non-existent file
  console.log('1. Testing non-existent file...');
  try {
    const result = await validateImageFile('./non-existent-image.jpg');
    console.log('Validation result:', result);
  } catch (error: any) {
    console.log('Error:', error.message);
  }
  console.log('---\n');
  
  // Test with an empty file (simulate corrupted file)
  console.log('2. Creating and testing empty file...');
  const emptyFilePath = path.join(__dirname, '../../temp/empty-test.jpg');
  
  // Ensure temp directory exists
  const tempDir = path.dirname(emptyFilePath);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Create empty file
  fs.writeFileSync(emptyFilePath, '');
  
  try {
    const result = await validateImageFile(emptyFilePath);
    console.log('Validation result:', result);
    
    if (result.isValid) {
      console.log('Testing OCR with empty file...');
      const ocrResult = await validateWarrantyByOCR(emptyFilePath, new Date('2025-06-13'));
      console.log('OCR result:', ocrResult);
    }
  } catch (error: any) {
    console.log('Error:', error.message);
  } finally {
    // Clean up
    if (fs.existsSync(emptyFilePath)) {
      fs.unlinkSync(emptyFilePath);
    }
  }
  console.log('---\n');
  
  // Test with unsupported file type
  console.log('3. Creating and testing unsupported file type...');
  const txtFilePath = path.join(__dirname, '../../temp/test.txt');
  fs.writeFileSync(txtFilePath, 'This is a text file, not an image');
  
  try {
    const result = await validateImageFile(txtFilePath);
    console.log('Validation result:', result);
  } catch (error: any) {
    console.log('Error:', error.message);
  } finally {
    // Clean up
    if (fs.existsSync(txtFilePath)) {
      fs.unlinkSync(txtFilePath);
    }
  }
  console.log('---\n');
  
  console.log('✅ Image validation tests completed!');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testImageValidation().catch(console.error);
}

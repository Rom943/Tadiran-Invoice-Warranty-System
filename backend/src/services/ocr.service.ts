// filepath: src/services/ocr.service.ts
import { createWorker, PSM } from 'tesseract.js';
import { parseISO, isEqual, parse, isValid, differenceInDays } from 'date-fns';
import fs from 'fs';
import path from 'path';
import config from '../config/env.config';

// Common date formats found in invoices
const dateFormats = [
  'dd/MM/yyyy',
  'MM/dd/yyyy',
  'yyyy-MM-dd',
  'dd-MM-yyyy',
  'MM-dd-yyyy',
  'dd.MM.yyyy',
  'MM.dd.yyyy',
  'yyyy.MM.dd',
  'dd/MM/yy',
  'MM/dd/yy',
  'dd-MM-yy',
  'MM-dd-yy',
  'dd.MM.yy',
  'MM.dd.yy',
  // Add more formats as needed
];

// Regex patterns for date extraction
const dateRegexPatterns = [
  /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/g, // dd/MM/yyyy, dd-MM-yyyy, dd.MM.yyyy
  /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/g, // yyyy/MM/dd, yyyy-MM-dd, yyyy.MM.dd
  /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})\b/g,  // dd/MM/yy, dd-MM-yy, dd.MM.yy
];

/**
 * Extract text from image using Tesseract OCR with improved settings
 */
export const extractTextFromImage = async (imagePath: string): Promise<string> => {
  // Validate image first
  const validation = await validateImageFile(imagePath);
  if (!validation.isValid) {
    throw new Error(`Image validation failed: ${validation.error}`);
  }
  
  console.log(`Processing image: ${path.basename(imagePath)} (${Math.round(validation.fileSize! / 1024)}KB)`);
  
  const worker = await createWorker('eng+heb');
  
  try {
    // Set better OCR parameters for invoice text
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/.:-אבגדהוזחטיכלמנסעפצקרשתךםןףץ ',
    });
    
    const { data } = await worker.recognize(imagePath);
    
    // Log OCR confidence if available
    if (data.confidence !== undefined) {
      console.log(`OCR confidence: ${data.confidence}%`);
    }
    
    console.log(`OCR extracted text: "${data.text}"`);
    return data.text;
  } catch (ocrError: any) {
    // Handle specific OCR errors
    if (ocrError.message?.includes('Image too small') || ocrError.message?.includes('Line cannot be recognized')) {
      throw new Error('Image quality too poor for OCR processing - image may be corrupted, too small, or low resolution');
    }
    throw new Error(`OCR processing failed: ${ocrError.message || 'Unknown OCR error'}`);
  } finally {
    await worker.terminate();
  }
};

/**
 * Extract text from image using multiple OCR attempts with different settings
 */
export const extractTextWithFallback = async (imagePath: string): Promise<string> => {
  console.log('Attempting OCR with multiple settings...');
  
  // Validate image first
  const validation = await validateImageFile(imagePath);
  if (!validation.isValid) {
    throw new Error(`Image validation failed: ${validation.error}`);
  }
  
  // First attempt: Standard settings
  try {
    const text1 = await extractTextFromImage(imagePath);
    if (text1.length > 10) { // If we got decent amount of text
      console.log('OCR successful with standard settings');
      return text1;
    }
    console.log('Standard OCR returned minimal text, trying fallback...');
  } catch (error: any) {
    console.log('First OCR attempt failed:', error.message);
    
    // If image quality issue, don't try fallback
    if (error.message.includes('Image quality too poor') || 
        error.message.includes('Image too small') ||
        error.message.includes('corrupted')) {
      throw error; // Re-throw image quality errors
    }
  }
  
  // Second attempt: Different settings, but only if image seems valid
  console.log('Attempting OCR with fallback settings...');
  const worker = await createWorker('eng+heb');
  try {
    // Try with more permissive settings
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/.:-אבגדהוזחטיכלמנסעפצקרשתךםןףץ (),[]{}',
    });
    
    const { data } = await worker.recognize(imagePath);
    console.log(`OCR fallback extracted text: "${data.text}"`);
    return data.text;
  } catch (fallbackError: any) {
    console.log('Fallback OCR also failed:', fallbackError.message);
    throw new Error(`All OCR attempts failed. Image may be corrupted, too low quality, or contain no readable text. Last error: ${fallbackError.message}`);
  } finally {
    await worker.terminate();
  }
};

/**
 * Extract dates from OCR text using multiple approaches
 */
export const extractDatesFromText = (text: string): Date[] => {
  const extractedDates: Date[] = [];
  const currentYear = new Date().getFullYear();
  
  console.log(`Extracting dates from text: "${text}"`);
  
  // Method 1: Use regex patterns to find date-like strings
  for (const pattern of dateRegexPatterns) {
    const matches = Array.from(text.matchAll(pattern));
    console.log(`Pattern ${pattern.source} found ${matches.length} matches`);
    
    for (const match of matches) {
      const fullMatch = match[0];
      console.log(`Processing match: "${fullMatch}"`);
      
      // Try to parse the matched date string
      for (const format of dateFormats) {
        try {
          const date = parse(fullMatch, format, new Date());
          if (isValid(date)) {
            // Only accept dates from reasonable years (1900-2030)
            const year = date.getFullYear();
            if (year >= 1900 && year <= 2030) {
              console.log(`Valid date found: ${date.toISOString()} using format ${format}`);
              extractedDates.push(date);
              break; // Found valid date, no need to try other formats
            }
          }
        } catch (error) {
          // Skip invalid formats
        }
      }
    }
  }
  
  // Method 2: Try to find dates in individual words
  const words = text.split(/\s+/);
  for (const word of words) {
    // Skip very short words that can't be dates
    if (word.length < 6) continue;
    
    for (const format of dateFormats) {
      try {
        const date = parse(word, format, new Date());
        if (isValid(date)) {
          const year = date.getFullYear();
          if (year >= 1900 && year <= 2030) {
            console.log(`Valid date found from word "${word}": ${date.toISOString()}`);
            extractedDates.push(date);
          }
        }
      } catch (error) {
        // Just skip if not a valid date
      }
    }
  }
  
  // Method 3: Try ISO date format
  const isoDateRegex = /\d{4}-\d{2}-\d{2}/g;
  const isoMatches = text.match(isoDateRegex) || [];
  
  for (const match of isoMatches) {
    try {
      const date = parseISO(match);
      if (isValid(date)) {
        console.log(`Valid ISO date found: ${date.toISOString()}`);
        extractedDates.push(date);
      }
    } catch (error) {
      // Skip invalid dates
    }
  }
  
  // Remove duplicates by converting to string and back
  const uniqueDates = Array.from(
    new Set(extractedDates.map(d => d.toISOString()))
  ).map(dateStr => new Date(dateStr));
  
  console.log(`Total unique dates extracted: ${uniqueDates.length}`);
  return uniqueDates;
};

/**
 * Validate if any extracted date is within the acceptable range of installation date
 * Range: ±21 days from installation date
 */
export const validateInvoiceDateRange = (
  installationDate: Date,
  extractedDates: Date[]
): {
  isValid: boolean;
  status: 'APPROVED' | 'REJECTED' | 'IN_PROGRESS';
  matchingDate?: Date;
  daysDifference?: number;
} => {
  if (extractedDates.length === 0) {
    return {
      isValid: false,
      status: 'IN_PROGRESS' // No dates found, needs manual review
    };
  }

  // Check each extracted date against the installation date
  for (const extractedDate of extractedDates) {
    const daysDiff = Math.abs(differenceInDays(extractedDate, installationDate));
    
    // If within ±21 days range
    if (daysDiff <= 21) {
      return {
        isValid: true,
        status: 'APPROVED',
        matchingDate: extractedDate,
        daysDifference: daysDiff
      };
    }
  }

  // No dates within acceptable range
  return {
    isValid: false,
    status: 'REJECTED'
  };
};

/**
 * Compare dates ignoring time component
 */
export const datesMatch = (date1: Date, date2: Date): boolean => {
  return isEqual(
    new Date(date1.getFullYear(), date1.getMonth(), date1.getDate()),
    new Date(date2.getFullYear(), date2.getMonth(), date2.getDate())
  );
};

/**
 * Process an image and determine warranty status based on date validation
 * Returns APPROVED if invoice date is within ±21 days of installation date
 * Returns REJECTED if date is out of range
 * Returns IN_PROGRESS if OCR parsing failed or no dates found
 */
export const validateWarrantyByOCR = async (
  imagePath: string,
  installationDate: Date
): Promise<{
  status: 'APPROVED' | 'REJECTED' | 'IN_PROGRESS';
  extractedDates: Date[];
  ocrText: string;
  matchingDate?: Date;
  daysDifference?: number;
  error?: string;
}> => {
  try {    console.log(`Starting OCR validation for installation date: ${installationDate.toISOString()}`);
    
    // Extract text from image using fallback method
    const ocrText = await extractTextWithFallback(imagePath);
    console.log(`OCR text extracted (length: ${ocrText.length})`);
    
    // If we still have very little text, it might be a poor quality image
    if (ocrText.length < 5) {
      console.log('Very little text extracted, marking as IN_PROGRESS');
      return {
        status: 'IN_PROGRESS',
        extractedDates: [],
        ocrText,
        error: 'Insufficient text extracted from image - may be poor quality'
      };
    }
    
    // Extract dates from text
    const extractedDates = extractDatesFromText(ocrText);
    console.log(`Extracted ${extractedDates.length} dates from OCR text:`, extractedDates.map(d => d.toISOString()));
    
    // Validate date range
    const validation = validateInvoiceDateRange(installationDate, extractedDates);
    
    console.log(`OCR validation result: ${validation.status}`, {
      matchingDate: validation.matchingDate?.toISOString(),
      daysDifference: validation.daysDifference
    });
    
    return {
      status: validation.status,
      extractedDates,
      ocrText,
      matchingDate: validation.matchingDate,
      daysDifference: validation.daysDifference
    };  } catch (error: any) {
    console.error('Error during OCR validation:', error.message || error);
    
    // Provide specific error messages for different failure types
    let errorMessage = 'Unknown OCR error';
    
    if (error.message?.includes('Image validation failed')) {
      errorMessage = error.message;
    } else if (error.message?.includes('Image quality too poor') || 
               error.message?.includes('Image too small') || 
               error.message?.includes('corrupted')) {
      errorMessage = 'Image quality too poor for processing - please upload a clearer, higher resolution image';
    } else if (error.message?.includes('All OCR attempts failed')) {
      errorMessage = 'Unable to extract text from image - please check image quality and try again';
    } else {
      errorMessage = `OCR processing failed: ${error.message || 'Unknown error'}`;
    }
    
    return {
      status: 'IN_PROGRESS', // Error processing, needs manual review
      extractedDates: [],
      ocrText: '',
      error: errorMessage
    };
  }
};

/**
 * Process an image and determine if the claimed installation date matches
 * any date in the invoice image
 * @deprecated Use validateWarrantyByOCR instead
 */
export const verifyInstallationDate = async (
  imageUrl: string,
  claimedDate: Date
): Promise<{
  matches: boolean,
  status: 'APPROVED' | 'REJECTED' | 'IN_PROGRESS',
  extractedDates: Date[],
  ocrText: string
}> => {
  try {
    // Extract text from image
    const ocrText = await extractTextFromImage(imageUrl);
    
    // Extract dates from text
    const extractedDates = extractDatesFromText(ocrText);
    
    // No dates found
    if (extractedDates.length === 0) {
      return {
        matches: false,
        status: 'IN_PROGRESS', // Needs manual review
        extractedDates,
        ocrText
      };
    }
    
    // Check if any extracted date matches the claimed date
    const hasMatch = extractedDates.some(date => datesMatch(date, claimedDate));
    
    return {
      matches: hasMatch,
      status: hasMatch ? 'APPROVED' : 'REJECTED',
      extractedDates,
      ocrText
    };
  } catch (error) {
    console.error('Error processing image:', error);
    return {
      matches: false,
      status: 'IN_PROGRESS', // Error processing, needs manual review
      extractedDates: [],
      ocrText: ''
    };
  }
};

/**
 * Validate image file before OCR processing
 */
export const validateImageFile = async (imagePath: string): Promise<{
  isValid: boolean;
  error?: string;
  fileSize?: number;
  fileExists?: boolean;
}> => {
  try {
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return {
        isValid: false,
        error: 'Image file does not exist',
        fileExists: false
      };
    }
    
    // Get file stats
    const stats = fs.statSync(imagePath);
    const fileSize = stats.size;
    
    // Check file size (minimum 1KB, maximum 50MB)
    if (fileSize < 1024) {
      return {
        isValid: false,
        error: `Image file too small: ${fileSize} bytes (minimum 1KB)`,
        fileSize,
        fileExists: true
      };
    }
    
    if (fileSize > 50 * 1024 * 1024) {
      return {
        isValid: false,
        error: `Image file too large: ${Math.round(fileSize / 1024 / 1024)}MB (maximum 50MB)`,
        fileSize,
        fileExists: true
      };
    }
    
    // Check file extension
    const ext = path.extname(imagePath).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.pdf'];
    
    if (!allowedExtensions.includes(ext)) {
      return {
        isValid: false,
        error: `Unsupported file type: ${ext}. Allowed: ${allowedExtensions.join(', ')}`,
        fileSize,
        fileExists: true
      };
    }
    
    return {
      isValid: true,
      fileSize,
      fileExists: true
    };
    
  } catch (error) {
    return {
      isValid: false,
      error: `Error validating image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      fileExists: false
    };
  }
};

export default {
  extractTextFromImage,
  extractTextWithFallback,
  extractDatesFromText,
  validateInvoiceDateRange,
  validateWarrantyByOCR,
  verifyInstallationDate,
  validateImageFile
};

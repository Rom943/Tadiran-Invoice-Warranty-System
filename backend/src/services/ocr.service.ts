// filepath: src/services/ocr.service.ts
import { createWorker } from 'tesseract.js';
import { parseISO, isEqual, parse, isValid } from 'date-fns';
import fs from 'fs';
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
  // Add more formats as needed
];

/**
 * Extract text from image using Tesseract OCR
 */
export const extractTextFromImage = async (imagePath: string): Promise<string> => {
  const worker = await createWorker('eng+heb');
  
  try {
    const { data } = await worker.recognize(imagePath);
    return data.text;
  } finally {
    await worker.terminate();
  }
};

/**
 * Extract dates from OCR text
 */
export const extractDatesFromText = (text: string): Date[] => {
  const extractedDates: Date[] = [];
  
  // Try to find dates in various formats
  for (const format of dateFormats) {
    // Split text into words
    const words = text.split(/\s+/);
    
    for (const word of words) {
      try {
        const date = parse(word, format, new Date());
        if (isValid(date)) {
          extractedDates.push(date);
        }
      } catch (error) {
        // Just skip if not a valid date
      }
    }
  }
  
  // Also try to find dates formatted as YYYY-MM-DD using regex
  const isoDateRegex = /\d{4}-\d{2}-\d{2}/g;
  const isoMatches = text.match(isoDateRegex) || [];
  
  for (const match of isoMatches) {
    try {
      const date = parseISO(match);
      if (isValid(date)) {
        extractedDates.push(date);
      }
    } catch (error) {
      // Skip invalid dates
    }
  }
  
  return extractedDates;
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
 * Process an image and determine if the claimed installation date matches
 * any date in the invoice image
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

export default {
  extractTextFromImage,
  extractDatesFromText,
  verifyInstallationDate
};

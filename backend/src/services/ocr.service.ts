// filepath: src/services/ocr.service.ts
import { ImageAnnotatorClient } from '@google-cloud/vision';
import {  isEqual, parse, isValid, differenceInDays } from 'date-fns';
import fs from 'fs';
import path from 'path';
import config from '../config/env.config';

// Initialize Google Cloud Vision client
let visionClient: ImageAnnotatorClient;

try {
  // Check if we have base64-encoded credentials in the environment variable
  if (config.googleVision.keyFilePath) {
    try {
      // Try to decode base64 credentials
      const decodedCredentials = Buffer.from(config.googleVision.keyFilePath, 'base64').toString('utf-8');
      const credentials = JSON.parse(decodedCredentials);
      
      visionClient = new ImageAnnotatorClient({
        credentials: credentials,
        projectId: config.googleVision.projectId || credentials.project_id,
      });
      console.log('Google Cloud Vision initialized with base64-encoded credentials');
    } catch (base64Error) {
      // If base64 decoding fails, treat it as a file path
      if (fs.existsSync(config.googleVision.keyFilePath)) {
        visionClient = new ImageAnnotatorClient({
          keyFilename: config.googleVision.keyFilePath,
          projectId: config.googleVision.projectId,
        });
        console.log('Google Cloud Vision initialized with key file');
      } else {
        throw new Error(`Invalid base64 credentials or file not found: ${config.googleVision.keyFilePath}`);
      }
    }
  } else {
    // Use default credentials (for production environments)
    visionClient = new ImageAnnotatorClient({
      projectId: config.googleVision.projectId,
    });
    console.log('Google Cloud Vision initialized with default credentials');
  }
} catch (error) {
  console.error('Failed to initialize Google Cloud Vision:', error);
  throw new Error('Google Cloud Vision client initialization failed');
}

// Common date formats found in invoices - enhanced for handwritten content
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
  // Additional formats for single-digit days/months (common in handwriting)
  'd/M/yyyy',
  'M/d/yyyy',
  'd/MM/yyyy',
  'dd/M/yyyy',
  'd/M/yy',
  'M/d/yy',
];

// Regex patterns for date extraction - enhanced for handwritten content
const dateRegexPatterns = [
  /\b(\d{1,2})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{4})\b/g, // More flexible separators including spaces
  /\b(\d{4})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{1,2})\b/g,
  /\b(\d{1,2})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{2})\b/g,
  // Additional patterns for handwritten dates
  /(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})/g, // Flexible spacing around /
  /(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(20\d{2})/g, // 2020s with flexible spacing
  /(\d{1,2})\/(\d{1,2})\/(\d{4})/g, // Direct pattern match
];

/**
 * Extract text from image using Google Cloud Vision API
 */
export const extractTextFromImage = async (imagePath: string): Promise<string> => {
  // Validate image first
  const validation = await validateImageFile(imagePath);
  if (!validation.isValid) {
    throw new Error(`Image validation failed: ${validation.error}`);
  }
  
  console.log(`Processing image with Google Vision: ${path.basename(imagePath)} (${Math.round(validation.fileSize! / 1024)}KB)`);
  
  try {
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Perform text detection with language hints
    const [result] = await visionClient.textDetection({
      image: {
        content: imageBuffer,
      },
      imageContext: {
        languageHints: config.googleVision.languageHints,
      },
    });
    
    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      console.log('No text detected in image');
      return '';
    }
    
    // The first detection contains the full text
    const fullText = detections[0].description || '';
      // Log confidence if available
    if (result.fullTextAnnotation?.pages?.[0]?.blocks) {
      const blocks = result.fullTextAnnotation.pages[0].blocks;
      const avgConfidence = blocks.reduce((acc, block) => {
        const blockConfidence = block.confidence || 0;
        return acc + blockConfidence;
      }, 0) / blocks.length;
      
      console.log(`Vision API confidence: ${Math.round(avgConfidence * 100)}%`);
    }
    
    console.log(`Vision API extracted text: "${fullText}"`);
    return fullText;
  } catch (visionError: any) {
    // Handle specific Vision API errors
    if (visionError.code === 3) { // INVALID_ARGUMENT
      throw new Error('Image format not supported or image corrupted');
    } else if (visionError.code === 8) { // RESOURCE_EXHAUSTED
      throw new Error('Vision API quota exceeded. Please try again later');
    } else if (visionError.code === 14) { // UNAVAILABLE
      throw new Error('Vision API temporarily unavailable. Please try again later');
    }
    
    throw new Error(`Vision API processing failed: ${visionError.message || 'Unknown Vision API error'}`);
  }
};

/**
 * Extract text from image using multiple Vision API detection methods with different settings
 */
export const extractTextWithFallback = async (imagePath: string): Promise<string> => {
  console.log('Attempting Vision API with multiple detection methods...');
  
  // Validate image first
  const validation = await validateImageFile(imagePath);
  if (!validation.isValid) {
    throw new Error(`Image validation failed: ${validation.error}`);
  }
  
  const imageBuffer = fs.readFileSync(imagePath);
  
  // First attempt: Standard text detection
  try {
    console.log('Attempting standard text detection...');
    const [result] = await visionClient.textDetection({
      image: { content: imageBuffer },
      imageContext: {
        languageHints: config.googleVision.languageHints,
      },
    });
    
    const text = result.textAnnotations?.[0]?.description || '';
    if (text.length > 5) {
      console.log('Standard text detection successful');
      return text;
    }
    console.log('Standard text detection returned minimal text, trying document text detection...');
  } catch (error: any) {
    console.log('Standard text detection failed:', error.message);
  }
  
  // Second attempt: Document text detection (better for structured documents)
  try {
    console.log('Attempting document text detection...');
    const [result] = await visionClient.documentTextDetection({
      image: { content: imageBuffer },
      imageContext: {
        languageHints: config.googleVision.languageHints,
      },
    });
    
    const text = result.fullTextAnnotation?.text || '';
    if (text.length > 0) {
      console.log('Document text detection successful');
      return text;
    }
    console.log('Document text detection returned no text, trying with enhanced settings...');
  } catch (error: any) {
    console.log('Document text detection failed:', error.message);
  }
  
  // Third attempt: Text detection with enhanced image context
  try {
    console.log('Attempting enhanced text detection...');
    const [result] = await visionClient.textDetection({
      image: { content: imageBuffer },
      imageContext: {
        languageHints: ['en', 'he', 'ar', 'und'], // Add undefined language
        textDetectionParams: {
          enableTextDetectionConfidenceScore: true,
        },
      },
    });
    
    const text = result.textAnnotations?.[0]?.description || '';
    console.log(`Enhanced text detection result: "${text}"`);
    return text;
  } catch (finalError: any) {
    console.log('All Vision API detection methods failed:', finalError.message);
    throw new Error(`All Vision API detection methods failed. The image content may be too unclear to read. Last error: ${finalError.message}`);
  }
};

/**
 * Enhanced date extraction for handwritten and mixed-language content
 */
export const extractDatesFromText = (text: string): Date[] => {
  const extractedDates: Date[] = [];
  const currentYear = new Date().getFullYear();
  
  console.log(`Extracting dates from text: "${text}"`);
  
  // Method 1: Enhanced regex patterns for handwritten dates
  for (const pattern of dateRegexPatterns) {
    const matches = Array.from(text.matchAll(pattern));
    console.log(`Pattern ${pattern.source} found ${matches.length} matches`);
    
    for (const match of matches) {
      const fullMatch = match[0];
      console.log(`Processing match: "${fullMatch}"`);
      
      // Clean up the match (normalize separators and spacing)
      const cleanMatch = fullMatch.replace(/\s+/g, '/').replace(/[\-\.]/g, '/');
      console.log(`Cleaned match: "${cleanMatch}"`);
      
      // Try to parse with various formats
      for (const format of dateFormats) {
        try {
          const date = parse(cleanMatch, format, new Date());
          if (isValid(date)) {
            const year = date.getFullYear();
            if (year >= 1900 && year <= 2030) {
              console.log(`Valid date found: ${date.toISOString()} using format ${format} from "${cleanMatch}"`);
              extractedDates.push(date);
              break;
            }
          }
        } catch (error) {
          // Skip invalid formats
        }
      }
    }
  }
  
  // Method 2: Look for number sequences that might be dates (more aggressive)
  const numberSequences = text.match(/\d+[\/\-\.\s]*\d+[\/\-\.\s]*\d+/g) || [];
  console.log(`Found ${numberSequences.length} potential date sequences:`, numberSequences);
  
  for (const sequence of numberSequences) {
    const cleanSequence = sequence.replace(/\s+/g, '/').replace(/[\-\.]/g, '/');
    console.log(`Trying to parse sequence: "${cleanSequence}"`);
    
    // Try various interpretations with leading zeros
    const interpretations = [
      cleanSequence,
      cleanSequence.replace(/^(\d)\//, '0$1/'), // Add leading zero to day
      cleanSequence.replace(/\/(\d)\//, '/0$1/'), // Add leading zero to month
      cleanSequence.replace(/\/(\d)$/, '/0$1'), // Add leading zero to last part
      // Handle the specific case like "13/6/2025"
      cleanSequence.replace(/(\d{1,2})\/(\d{1})\/(\d{4})/, '$1/0$2/$3'), // 13/6/2025 -> 13/06/2025
      cleanSequence.replace(/(\d{1})\/(\d{1,2})\/(\d{4})/, '0$1/$2/$3'), // 3/16/2025 -> 03/16/2025
    ];
    
    for (const interpretation of interpretations) {
      console.log(`  Trying interpretation: "${interpretation}"`);
      
      for (const format of dateFormats) {
        try {
          const date = parse(interpretation, format, new Date());
          if (isValid(date)) {
            const year = date.getFullYear();
            if (year >= 1900 && year <= 2030) {
              console.log(`Valid date found from sequence: ${date.toISOString()} using format ${format} from "${interpretation}"`);
              extractedDates.push(date);
              break;
            }
          }
        } catch (error) {
          // Skip invalid formats
        }
      }
    }
  }
  
  // Method 3: Try to find specific pattern "dd/m/yyyy" or "d/mm/yyyy" directly
  const specificPatterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
    /(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})/g,
  ];
  
  for (const pattern of specificPatterns) {
    const matches = Array.from(text.matchAll(pattern));
    console.log(`Specific pattern ${pattern.source} found ${matches.length} matches`);
    
    for (const match of matches) {
      const day = match[1];
      const month = match[2];
      const year = match[3];
      
      console.log(`Found potential date parts: day=${day}, month=${month}, year=${year}`);
      
      // Try both dd/MM/yyyy and MM/dd/yyyy interpretations
      const dateStrings = [
        `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`, // dd/MM/yyyy
        `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`, // MM/dd/yyyy
      ];
      
      for (const dateStr of dateStrings) {
        for (const format of ['dd/MM/yyyy', 'MM/dd/yyyy']) {
          try {
            const date = parse(dateStr, format, new Date());
            if (isValid(date)) {
              const yearParsed = date.getFullYear();
              if (yearParsed >= 1900 && yearParsed <= 2030) {
                console.log(`Valid date found from parts: ${date.toISOString()} using format ${format} from "${dateStr}"`);
                extractedDates.push(date);
              }
            }
          } catch (error) {
            // Skip invalid formats
          }
        }
      }
    }
  }
  
  // Remove duplicates by converting to string and back
  const uniqueDates = Array.from(
    new Set(extractedDates.map(d => d.toISOString()))
  ).map(dateStr => new Date(dateStr));
  
  console.log(`Total unique dates extracted: ${uniqueDates.length}`);
  uniqueDates.forEach(date => {
    console.log(`- ${date.toLocaleDateString()} (${date.toISOString()})`);
  });
  
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
 * Process an image and determine warranty status based on date validation using Google Cloud Vision API
 * Returns APPROVED if invoice date is within ±21 days of installation date
 * Returns REJECTED if date is out of range
 * Returns IN_PROGRESS if Vision API parsing failed or no dates found
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
}> => {  try {    console.log(`Starting Vision API validation for installation date: ${installationDate.toISOString()}`);
    
    // Extract text from image using fallback method
    const ocrText = await extractTextWithFallback(imagePath);
    console.log(`Vision API text extracted (length: ${ocrText.length})`);
    
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
    console.log(`Extracted ${extractedDates.length} dates from Vision API text:`, extractedDates.map(d => d.toISOString()));
    
    // Validate date range
    const validation = validateInvoiceDateRange(installationDate, extractedDates);
    
    console.log(`Vision API validation result: ${validation.status}`, {
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
    console.error('Error during Vision API validation:', error.message || error);
    
    // Provide specific error messages for different failure types
    let errorMessage = 'Unknown Vision API error';
    
    if (error.message?.includes('Image validation failed')) {
      errorMessage = error.message;
    } else if (error.message?.includes('Image quality too poor') || 
               error.message?.includes('Image too small') || 
               error.message?.includes('corrupted') ||
               error.message?.includes('Image format not supported')) {
      errorMessage = 'Image quality too poor for processing - please upload a clearer, higher resolution image';
    } else if (error.message?.includes('All Vision API detection methods failed')) {
      errorMessage = 'Unable to extract text from image using Vision API - please check image quality and try again';
    } else if (error.message?.includes('quota exceeded')) {
      errorMessage = 'Vision API quota exceeded - please try again later';
    } else if (error.message?.includes('temporarily unavailable')) {
      errorMessage = 'Vision API temporarily unavailable - please try again later';
    } else {
      errorMessage = `Vision API processing failed: ${error.message || 'Unknown error'}`;
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

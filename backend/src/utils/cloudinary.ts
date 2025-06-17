// filepath: src/utils/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';
import config from '../config/env.config';

// Configure cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

export const uploadImage = async (filePath: string): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: config.cloudinary.folder,
      resource_type: 'image',
    });
    
    return result.secure_url;
  } catch (error) {
    throw error;
  }
};

export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw error;
  }
};

// Helper to get public ID from full URL
export const getPublicIdFromUrl = (url: string): string => {
  const urlParts = url.split('/');
  const filenameWithExtension = urlParts[urlParts.length - 1];
  const filename = filenameWithExtension.split('.')[0];
  const foldername = urlParts[urlParts.length - 2];
  return `${foldername}/${filename}`;
};

export default cloudinary;

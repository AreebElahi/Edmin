import path from 'path';
import { Request } from 'express';
import multer from 'multer';

type AllowedTypes = Record<string, string[]>;

/**
 * Factory for creating a multer fileFilter.
 * @param allowedTypes An object mapping allowed MIME types to arrays of allowed extensions.
 *                     Example: { 'application/pdf': ['.pdf'], 'image/png': ['.png'] }
 */
export const createFileFilter = (allowedTypes: AllowedTypes) => {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check if the mimetype is in our allowed list
    if (!allowedTypes[file.mimetype]) {
      const err = new Error(`File type not allowed: ${file.mimetype}`);
      (err as any).statusCode = 400;
      (err as any).errorCode = 'INVALID_FILE_TYPE';
      return cb(err);
    }

    // Extract the extension from the original filename
    const ext = path.extname(file.originalname).toLowerCase();

    // Check if the extension matches the allowed extensions for this mimetype
    if (!allowedTypes[file.mimetype].includes(ext)) {
      const err = new Error(`File extension mismatch: ${ext} does not match type ${file.mimetype}`);
      (err as any).statusCode = 400;
      (err as any).errorCode = 'INVALID_FILE_EXTENSION';
      return cb(err);
    }

    // Pass the file
    cb(null, true);
  };
};

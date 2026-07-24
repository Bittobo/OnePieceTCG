import multer from 'multer';

import { AppError } from '../errors/app-error.js';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export interface ImageUpload {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export function createImageUpload(maxUploadBytes: number): ReturnType<typeof multer> {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      files: 1,
      fileSize: maxUploadBytes,
    },
    fileFilter: (_request, file, callback) => {
      if (!allowedMimeTypes.has(file.mimetype)) {
        callback(
          new AppError(400, 'unsupported_image_type', 'Images must be JPEG, PNG, or WebP files'),
        );
        return;
      }

      callback(null, true);
    },
  });
}

export function hasValidImageSignature(file: ImageUpload): boolean {
  const { buffer, mimetype } = file;

  if (mimetype === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimetype === 'image/png') {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return (
      buffer.length >= signature.length && signature.every((byte, index) => buffer[index] === byte)
    );
  }

  if (mimetype === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    );
  }

  return false;
}

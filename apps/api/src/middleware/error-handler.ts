import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { ZodError } from 'zod';

import { AppError } from '../errors/app-error.js';

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new AppError(404, 'route_not_found', `No route matches ${request.method} ${request.path}`));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  void next;
  if (error instanceof AppError) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: 'validation_error',
        message: 'The request contains invalid data',
        details: error.flatten(),
      },
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    response.status(400).json({
      error: {
        code: error.code === 'LIMIT_FILE_SIZE' ? 'image_too_large' : 'upload_error',
        message:
          error.code === 'LIMIT_FILE_SIZE' ? 'The selected image is too large' : error.message,
      },
    });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    response.status(400).json({
      error: {
        code: 'database_validation_error',
        message: error.message,
      },
    });
    return;
  }

  if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
    const collectionNameConflict = Boolean(error.keyPattern?.normalizedName);
    response.status(409).json({
      error: {
        code: collectionNameConflict ? 'collection_name_exists' : 'duplicate_record',
        message: collectionNameConflict
          ? 'A collection with this name already exists'
          : 'This record already exists',
      },
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    error: {
      code: 'internal_error',
      message: 'An unexpected server error occurred',
    },
  });
};

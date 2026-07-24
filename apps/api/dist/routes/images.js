import { Router } from 'express';
import { Types } from 'mongoose';
import { AppError } from '../errors/app-error.js';
import { asyncHandler } from '../middleware/async-handler.js';
function parseObjectId(value) {
    if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) {
        throw new AppError(400, 'invalid_id', 'The supplied image ID is invalid');
    }
    return new Types.ObjectId(value);
}
export function createImagesRouter(imageStore) {
    const router = Router();
    router.get('/:fileId', asyncHandler(async (request, response, next) => {
        const fileId = parseObjectId(request.params.fileId);
        const file = await imageStore.find(fileId);
        if (!file) {
            throw new AppError(404, 'image_not_found', 'Image not found');
        }
        response.setHeader('Content-Type', file.metadata.mimeType);
        response.setHeader('Content-Length', file.length.toString());
        response.setHeader('Cache-Control', 'private, max-age=3600');
        response.setHeader('X-Content-Type-Options', 'nosniff');
        const stream = imageStore.openDownloadStream(fileId);
        stream.once('error', (error) => {
            if (response.headersSent) {
                response.destroy(error);
                return;
            }
            next(error);
        });
        stream.pipe(response);
    }));
    return router;
}
//# sourceMappingURL=images.js.map
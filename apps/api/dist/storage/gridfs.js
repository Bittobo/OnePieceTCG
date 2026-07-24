import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { mongo, Types } from 'mongoose';
export class GridFsImageStore {
    bucket;
    constructor(database, bucketName) {
        this.bucket = new mongo.GridFSBucket(database, { bucketName });
    }
    async upload(file, itemId) {
        const uploadStream = this.bucket.openUploadStream(randomUUID(), {
            metadata: {
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                itemId: new mongo.ObjectId(itemId.toHexString()),
                uploadedAt: new Date(),
            },
        });
        await pipeline(Readable.from(file.buffer), uploadStream);
        return {
            fileId: new Types.ObjectId(uploadStream.id.toHexString()),
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
        };
    }
    async find(fileId) {
        const file = await this.bucket.find({ _id: new mongo.ObjectId(fileId.toHexString()) }).next();
        if (!file) {
            return null;
        }
        return this.mapFile(file);
    }
    openDownloadStream(fileId) {
        return this.bucket.openDownloadStream(new mongo.ObjectId(fileId.toHexString()));
    }
    async delete(fileId) {
        const objectId = new mongo.ObjectId(fileId.toHexString());
        const exists = await this.bucket.find({ _id: objectId }).hasNext();
        if (exists) {
            await this.bucket.delete(objectId);
        }
    }
    async listFiles() {
        const files = await this.bucket.find().toArray();
        return files.map((file) => this.mapFile(file));
    }
    mapFile(file) {
        const metadata = file.metadata;
        return {
            id: file._id,
            length: file.length,
            metadata: {
                originalName: metadata?.originalName ?? file.filename,
                mimeType: metadata?.mimeType ?? 'application/octet-stream',
                size: metadata?.size ?? file.length,
                itemId: metadata?.itemId ?? new mongo.ObjectId(),
                uploadedAt: metadata?.uploadedAt ?? file.uploadDate,
            },
        };
    }
}
//# sourceMappingURL=gridfs.js.map
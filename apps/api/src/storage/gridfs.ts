import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { mongo, Types } from 'mongoose';

import type { ImageUpload } from '../middleware/upload.js';
import type { StoredImage } from '../models/item.js';

interface ImageMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  itemId: mongo.ObjectId;
  uploadedAt: Date;
}

export interface StoredGridFsFile {
  id: mongo.ObjectId;
  length: number;
  metadata: ImageMetadata;
}

export class GridFsImageStore {
  private readonly bucket: mongo.GridFSBucket;

  constructor(database: mongo.Db, bucketName: string) {
    this.bucket = new mongo.GridFSBucket(database, { bucketName });
  }

  async upload(file: ImageUpload, itemId: Types.ObjectId): Promise<StoredImage> {
    const uploadStream = this.bucket.openUploadStream(randomUUID(), {
      metadata: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        itemId: new mongo.ObjectId(itemId.toHexString()),
        uploadedAt: new Date(),
      } satisfies ImageMetadata,
    });

    await pipeline(Readable.from(file.buffer), uploadStream);

    return {
      fileId: new Types.ObjectId(uploadStream.id.toHexString()),
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async find(fileId: Types.ObjectId): Promise<StoredGridFsFile | null> {
    const file = await this.bucket.find({ _id: new mongo.ObjectId(fileId.toHexString()) }).next();
    if (!file) {
      return null;
    }

    return this.mapFile(file);
  }

  openDownloadStream(fileId: Types.ObjectId): mongo.GridFSBucketReadStream {
    return this.bucket.openDownloadStream(new mongo.ObjectId(fileId.toHexString()));
  }

  async delete(fileId: Types.ObjectId): Promise<void> {
    const objectId = new mongo.ObjectId(fileId.toHexString());
    const exists = await this.bucket.find({ _id: objectId }).hasNext();
    if (exists) {
      await this.bucket.delete(objectId);
    }
  }

  async listFiles(): Promise<StoredGridFsFile[]> {
    const files = await this.bucket.find().toArray();
    return files.map((file) => this.mapFile(file));
  }

  private mapFile(file: mongo.GridFSFile): StoredGridFsFile {
    const metadata = file.metadata as Partial<ImageMetadata> | undefined;

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

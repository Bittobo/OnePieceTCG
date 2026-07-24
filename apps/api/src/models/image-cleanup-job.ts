import mongoose, { Schema, Types } from 'mongoose';

export interface ImageCleanupJobRecord {
  fileId: Types.ObjectId;
  reason: string;
  attempts: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const imageCleanupJobSchema = new Schema<ImageCleanupJobRecord>(
  {
    fileId: { type: Schema.Types.ObjectId, required: true, unique: true },
    reason: { type: String, required: true },
    attempts: { type: Number, required: true, default: 0 },
    lastError: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const ImageCleanupJobModel =
  (mongoose.models.ImageCleanupJob as mongoose.Model<ImageCleanupJobRecord> | undefined) ??
  mongoose.model<ImageCleanupJobRecord>('ImageCleanupJob', imageCleanupJobSchema);

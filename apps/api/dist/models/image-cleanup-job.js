import mongoose, { Schema } from 'mongoose';
const imageCleanupJobSchema = new Schema({
    fileId: { type: Schema.Types.ObjectId, required: true, unique: true },
    reason: { type: String, required: true },
    attempts: { type: Number, required: true, default: 0 },
    lastError: { type: String },
}, {
    timestamps: true,
    versionKey: false,
});
export const ImageCleanupJobModel = mongoose.models.ImageCleanupJob ??
    mongoose.model('ImageCleanupJob', imageCleanupJobSchema);
//# sourceMappingURL=image-cleanup-job.js.map
import { ImageCleanupJobModel } from '../models/image-cleanup-job.js';
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
export async function queueImageCleanup(fileId, reason, error) {
    await ImageCleanupJobModel.updateOne({ fileId }, {
        $set: {
            reason,
            lastError: errorMessage(error),
        },
        $setOnInsert: {
            attempts: 0,
        },
    }, { upsert: true });
}
export async function deleteImageOrQueue(imageStore, fileId, reason) {
    try {
        await imageStore.delete(fileId);
        await ImageCleanupJobModel.deleteOne({ fileId });
        return false;
    }
    catch (error) {
        await queueImageCleanup(fileId, reason, error);
        return true;
    }
}
export async function processImageCleanupJobs(imageStore, limit = 25) {
    const jobs = await ImageCleanupJobModel.find().sort({ createdAt: 1 }).limit(limit).exec();
    for (const job of jobs) {
        try {
            await imageStore.delete(job.fileId);
            await job.deleteOne();
        }
        catch (error) {
            job.attempts += 1;
            job.lastError = errorMessage(error);
            await job.save();
        }
    }
}
//# sourceMappingURL=image-cleanup.js.map
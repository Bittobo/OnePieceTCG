import { Types } from 'mongoose';

import { loadEnvironmentFiles, parseConfig } from '../config/env.js';
import { connectDatabase, disconnectDatabase, getDatabase } from '../db/connection.js';
import { ItemModel } from '../models/item.js';
import { processImageCleanupJobs } from '../services/image-cleanup.js';
import { GridFsImageStore } from '../storage/gridfs.js';

loadEnvironmentFiles();

async function checkImages(): Promise<void> {
  const config = parseConfig();
  await connectDatabase(config.mongoUri);

  const imageStore = new GridFsImageStore(getDatabase(), config.gridFsBucketName);
  await processImageCleanupJobs(imageStore, 100);

  const [files, references] = await Promise.all([
    imageStore.listFiles(),
    ItemModel.distinct<'image.fileId', Types.ObjectId>('image.fileId'),
  ]);
  const referencedIds = new Set(references.map((id) => id.toHexString()));
  const orphans = files.filter((file) => !referencedIds.has(file.id.toHexString()));

  console.log(`GridFS files: ${files.length}`);
  console.log(`Referenced images: ${referencedIds.size}`);
  console.log(`Orphaned images: ${orphans.length}`);

  if (process.argv.includes('--delete')) {
    for (const orphan of orphans) {
      await imageStore.delete(new Types.ObjectId(orphan.id.toHexString()));
    }
    console.log(`Deleted ${orphans.length} orphaned images.`);
  } else if (orphans.length > 0) {
    console.log('Run npm run images:cleanup to remove the reported orphaned images.');
  }
}

checkImages()
  .catch((error: unknown) => {
    console.error('Image check failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });

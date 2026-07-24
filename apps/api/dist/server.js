import { createServer } from 'node:http';
import { createApp } from './app.js';
import { loadEnvironmentFiles, parseConfig } from './config/env.js';
import { connectDatabase, disconnectDatabase, getDatabase } from './db/connection.js';
import { assignLegacyCardsToCollection } from './services/collection-migration.js';
import { processImageCleanupJobs } from './services/image-cleanup.js';
import { GridFsImageStore } from './storage/gridfs.js';
loadEnvironmentFiles();
async function start() {
    const config = parseConfig();
    await connectDatabase(config.mongoUri);
    await assignLegacyCardsToCollection();
    const imageStore = new GridFsImageStore(getDatabase(), config.gridFsBucketName);
    await processImageCleanupJobs(imageStore);
    const app = createApp(config, imageStore);
    const server = createServer(app);
    server.listen(config.apiPort, config.apiHost, () => {
        console.log(`API listening at http://${config.apiHost}:${config.apiPort}`);
    });
    const shutdown = (signal) => {
        console.log(`Received ${signal}; shutting down`);
        server.close(() => {
            void disconnectDatabase().finally(() => process.exit(0));
        });
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
}
start().catch((error) => {
    console.error('API failed to start', error);
    process.exitCode = 1;
});
//# sourceMappingURL=server.js.map
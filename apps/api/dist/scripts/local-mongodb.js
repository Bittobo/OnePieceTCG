import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { z } from 'zod';
import { loadEnvironmentFiles } from '../config/env.js';
const localDatabaseEnvironmentSchema = z.object({
    MONGO_ROOT_USERNAME: z.string().trim().min(1),
    MONGO_ROOT_PASSWORD: z.string().min(1),
    MONGO_DATABASE: z.string().trim().min(1).default('one_piece_tcg'),
    MONGO_PORT: z.coerce.number().int().min(1).max(65_535).default(27017),
});
loadEnvironmentFiles();
async function startLocalDatabase() {
    const environment = localDatabaseEnvironmentSchema.parse(process.env);
    const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
    const projectRoot = path.resolve(scriptDirectory, '../../../..');
    const databasePath = path.join(projectRoot, '.local', 'mongodb');
    await mkdir(databasePath, { recursive: true });
    const server = await MongoMemoryServer.create({
        instance: {
            ip: '127.0.0.1',
            port: environment.MONGO_PORT,
            portGeneration: false,
            dbName: environment.MONGO_DATABASE,
            dbPath: databasePath,
            storageEngine: 'wiredTiger',
        },
        auth: {
            enable: true,
            customRootName: environment.MONGO_ROOT_USERNAME,
            customRootPwd: environment.MONGO_ROOT_PASSWORD,
        },
    });
    console.log(`Local MongoDB is running on 127.0.0.1:${environment.MONGO_PORT}`);
    console.log(`Persistent data directory: ${databasePath}`);
    const stop = async (signal) => {
        console.log(`Received ${signal}; stopping local MongoDB`);
        await server.stop({ doCleanup: false, force: false });
        process.exit(0);
    };
    process.once('SIGINT', () => void stop('SIGINT'));
    process.once('SIGTERM', () => void stop('SIGTERM'));
}
startLocalDatabase().catch((error) => {
    console.error('Local MongoDB failed to start', error);
    process.exitCode = 1;
});
//# sourceMappingURL=local-mongodb.js.map
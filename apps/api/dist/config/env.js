import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';
const environmentSchema = z.object({
    MONGODB_URI: z.string().trim().min(1, 'MONGODB_URI is required'),
    API_HOST: z.string().trim().default('127.0.0.1'),
    API_PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
    WEB_ORIGIN: z.string().url().default('http://127.0.0.1:5173'),
    GRIDFS_BUCKET_NAME: z.string().trim().min(1).default('itemImages'),
    MAX_UPLOAD_MB: z.coerce.number().positive().max(15).default(5),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});
export function loadEnvironmentFiles() {
    dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
    dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
}
export function parseConfig(environment = process.env) {
    const parsed = environmentSchema.parse(environment);
    return {
        mongoUri: parsed.MONGODB_URI,
        apiHost: parsed.API_HOST,
        apiPort: parsed.API_PORT,
        webOrigin: parsed.WEB_ORIGIN,
        gridFsBucketName: parsed.GRIDFS_BUCKET_NAME,
        maxUploadBytes: Math.floor(parsed.MAX_UPLOAD_MB * 1024 * 1024),
        nodeEnv: parsed.NODE_ENV,
    };
}
//# sourceMappingURL=env.js.map
import { Router } from 'express';
import { isDatabaseReady } from '../db/connection.js';
export function createHealthRouter() {
    const router = Router();
    router.get('/', (_request, response) => {
        const databaseReady = isDatabaseReady();
        response.status(databaseReady ? 200 : 503).json({
            status: databaseReady ? 'ok' : 'degraded',
            database: databaseReady ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString(),
        });
    });
    return router;
}
//# sourceMappingURL=health.js.map
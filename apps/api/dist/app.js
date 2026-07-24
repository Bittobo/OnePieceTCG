import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { createImageUpload } from './middleware/upload.js';
import { createCollectionsRouter } from './routes/collections.js';
import { createHealthRouter } from './routes/health.js';
import { createImagesRouter } from './routes/images.js';
import { createItemsRouter } from './routes/items.js';
import { createSealedSetsRouter } from './routes/sealed-sets.js';
import { createTcgplayerRouter } from './routes/tcgplayer.js';
import { TcgplayerClient } from './services/tcgplayer.js';
export function createApp(config, imageStore) {
    const app = express();
    const imageUpload = createImageUpload(config.maxUploadBytes);
    const tcgplayerClient = new TcgplayerClient(config.maxUploadBytes);
    app.disable('x-powered-by');
    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    app.use(cors({
        origin: config.webOrigin,
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    }));
    if (config.nodeEnv !== 'test') {
        app.use(morgan('dev'));
    }
    app.use(express.json({ limit: '1mb' }));
    app.use('/api/health', createHealthRouter());
    app.use('/api/collections', createCollectionsRouter());
    app.use('/api/sealed-sets', createSealedSetsRouter());
    app.use('/api/items', createItemsRouter(imageStore, imageUpload.single('image'), tcgplayerClient));
    app.use('/api/images', createImagesRouter(imageStore));
    app.use('/api/import/tcgplayer', createTcgplayerRouter(tcgplayerClient));
    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map
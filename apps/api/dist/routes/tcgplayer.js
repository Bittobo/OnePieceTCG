import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/async-handler.js';
const importRequestSchema = z.object({
    url: z.string().trim().min(1).max(2_000),
});
export function createTcgplayerRouter(client) {
    const router = Router();
    router.post('/', asyncHandler(async (request, response) => {
        const { url } = importRequestSchema.parse(request.body);
        response.json(await client.importProduct(url));
    }));
    return router;
}
//# sourceMappingURL=tcgplayer.js.map
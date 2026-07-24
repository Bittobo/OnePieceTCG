import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import { ItemModel, toInventoryItem } from '../models/item.js';
import { groupSealedItems } from '../services/sealed-sets.js';
export function createSealedSetsRouter() {
    const router = Router();
    router.get('/', asyncHandler(async (_request, response) => {
        const documents = await ItemModel.find({
            kind: { $in: ['box', 'pack'] },
        })
            .sort({ setName: 1, setCode: 1, kind: 1, updatedAt: -1 })
            .exec();
        const groups = groupSealedItems(documents.map(toInventoryItem));
        const payload = { groups };
        response.json(payload);
    }));
    return router;
}
//# sourceMappingURL=sealed-sets.js.map
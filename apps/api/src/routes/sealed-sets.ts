import type { SealedSetsResponse } from '@one-piece-tcg/shared';
import { Router } from 'express';

import { asyncHandler } from '../middleware/async-handler.js';
import { ItemModel, toInventoryItem } from '../models/item.js';
import { groupSealedItems } from '../services/sealed-sets.js';

export function createSealedSetsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (_request, response) => {
      const documents = await ItemModel.find({
        kind: { $in: ['box', 'pack'] },
      })
        .sort({ setName: 1, setCode: 1, kind: 1, updatedAt: -1 })
        .exec();
      const groups = groupSealedItems(documents.map(toInventoryItem));
      const payload: SealedSetsResponse = { groups };

      response.json(payload);
    }),
  );

  return router;
}

import type { CardCollection } from '@one-piece-tcg/shared';
import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';

import { AppError } from '../errors/app-error.js';
import { asyncHandler } from '../middleware/async-handler.js';
import {
  CardCollectionModel,
  normalizeCollectionName,
  type CardCollectionDocument,
} from '../models/card-collection.js';
import { ItemModel, toInventoryItem } from '../models/item.js';

const collectionInputSchema = z.object({
  name: z.string().trim().min(1, 'Collection name is required').max(80),
});

interface CollectionCountAggregate {
  _id: string;
  cardCount: number;
}

interface CollectionCoverAggregate {
  _id: string;
  coverFileId?: Types.ObjectId;
}

type CollectionAggregate = CollectionCountAggregate & Partial<CollectionCoverAggregate>;

function parseObjectId(value: string | string[] | undefined): Types.ObjectId {
  if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) {
    throw new AppError(400, 'invalid_id', 'The supplied collection ID is invalid');
  }
  return new Types.ObjectId(value);
}

async function collectionSummary(
  collection: CardCollectionDocument,
  aggregate?: CollectionAggregate,
): Promise<CardCollection> {
  return {
    id: collection._id.toHexString(),
    name: collection.name,
    cardCount: aggregate?.cardCount ?? 0,
    coverImageUrl: aggregate?.coverFileId
      ? `/api/images/${aggregate.coverFileId.toHexString()}`
      : undefined,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
  };
}

async function ensureUniqueName(name: string, excludedId?: Types.ObjectId): Promise<void> {
  const existing = await CardCollectionModel.exists({
    normalizedName: normalizeCollectionName(name),
    ...(excludedId ? { _id: { $ne: excludedId } } : {}),
  });
  if (existing) {
    throw new AppError(409, 'collection_name_exists', 'A collection with this name already exists');
  }
}

export function createCollectionsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (_request, response) => {
      const collections = await CardCollectionModel.find().sort({ name: 1 }).exec();
      const collectionIds = collections.map((collection) => collection._id.toHexString());
      const [counts, covers] =
        collectionIds.length === 0
          ? [[], []]
          : await Promise.all([
              ItemModel.aggregate<CollectionCountAggregate>([
                {
                  $match: {
                    kind: 'card',
                    collectionId: { $in: collectionIds },
                  },
                },
                {
                  $group: {
                    _id: '$collectionId',
                    cardCount: { $sum: 1 },
                  },
                },
              ]),
              ItemModel.aggregate<CollectionCoverAggregate>([
                {
                  $match: {
                    kind: 'card',
                    collectionId: { $in: collectionIds },
                    'image.fileId': { $exists: true, $ne: null },
                  },
                },
                { $sort: { createdAt: -1 } },
                {
                  $group: {
                    _id: '$collectionId',
                    coverFileId: { $first: '$image.fileId' },
                  },
                },
              ]),
            ]);
      const aggregatesById = new Map<string, CollectionAggregate>();
      for (const count of counts) {
        aggregatesById.set(count._id, count);
      }
      for (const cover of covers) {
        aggregatesById.set(cover._id, {
          ...(aggregatesById.get(cover._id) ?? { _id: cover._id, cardCount: 0 }),
          coverFileId: cover.coverFileId,
        });
      }

      response.json({
        collections: await Promise.all(
          collections.map((collection) =>
            collectionSummary(collection, aggregatesById.get(collection._id.toHexString())),
          ),
        ),
      });
    }),
  );

  router.get(
    '/:collectionId/cards',
    asyncHandler(async (request, response) => {
      const collection = await CardCollectionModel.findById(
        parseObjectId(request.params.collectionId),
      ).exec();
      if (!collection) {
        throw new AppError(404, 'collection_not_found', 'Card collection not found');
      }

      const cards = await ItemModel.find({
        kind: 'card',
        collectionId: collection._id.toHexString(),
      })
        .sort({ updatedAt: -1 })
        .exec();

      response.json({ items: cards.map(toInventoryItem) });
    }),
  );

  router.get(
    '/:collectionId',
    asyncHandler(async (request, response) => {
      const collection = await CardCollectionModel.findById(
        parseObjectId(request.params.collectionId),
      ).exec();
      if (!collection) {
        throw new AppError(404, 'collection_not_found', 'Card collection not found');
      }

      const cardCount = await ItemModel.countDocuments({
        kind: 'card',
        collectionId: collection._id.toHexString(),
      });
      response.json({
        collection: await collectionSummary(collection, {
          _id: collection._id.toHexString(),
          cardCount,
        }),
      });
    }),
  );

  router.post(
    '/',
    asyncHandler(async (request, response) => {
      const { name } = collectionInputSchema.parse(request.body);
      await ensureUniqueName(name);
      const collection = await CardCollectionModel.create({
        name,
        normalizedName: normalizeCollectionName(name),
      });
      response.status(201).json({ collection: await collectionSummary(collection) });
    }),
  );

  router.patch(
    '/:collectionId',
    asyncHandler(async (request, response) => {
      const collectionId = parseObjectId(request.params.collectionId);
      const { name } = collectionInputSchema.parse(request.body);
      await ensureUniqueName(name, collectionId);

      const collection = await CardCollectionModel.findById(collectionId).exec();
      if (!collection) {
        throw new AppError(404, 'collection_not_found', 'Card collection not found');
      }
      collection.name = name;
      await collection.save();

      const cardCount = await ItemModel.countDocuments({
        kind: 'card',
        collectionId: collection._id.toHexString(),
      });
      response.json({
        collection: await collectionSummary(collection, {
          _id: collection._id.toHexString(),
          cardCount,
        }),
      });
    }),
  );

  router.delete(
    '/:collectionId',
    asyncHandler(async (request, response) => {
      const collectionId = parseObjectId(request.params.collectionId);
      const collection = await CardCollectionModel.findById(collectionId).exec();
      if (!collection) {
        throw new AppError(404, 'collection_not_found', 'Card collection not found');
      }

      const hasCards = await ItemModel.exists({
        kind: 'card',
        collectionId: collection._id.toHexString(),
      });
      if (hasCards) {
        throw new AppError(
          409,
          'collection_not_empty',
          'Move or delete the cards before deleting this collection',
        );
      }

      await collection.deleteOne();
      response.json({ deleted: true });
    }),
  );

  return router;
}

import {
  cardGradingSchema,
  cardJapaneseSchema,
  itemInputSchema,
  itemKinds,
  itemOwnershipSchema,
  itemSortOptions,
  type ItemInput,
  type ItemSort,
} from "@one-piece-tcg/shared";
import { Router, type Request, type RequestHandler } from "express";
import { Types, type FilterQuery } from "mongoose";
import { z } from "zod";

import { AppError } from "../errors/app-error.js";
import { asyncHandler } from "../middleware/async-handler.js";
import {
  hasValidImageSignature,
  type ImageUpload,
} from "../middleware/upload.js";
import { CardCollectionModel } from "../models/card-collection.js";
import {
  ItemModel,
  type ItemDocument,
  type ItemRecord,
  type StoredImage,
  toInventoryItem,
} from "../models/item.js";
import { deleteImageOrQueue } from "../services/image-cleanup.js";
import type { TcgplayerClient } from "../services/tcgplayer.js";
import type { GridFsImageStore } from "../storage/gridfs.js";

const mutationPayloadSchema = z.object({
  item: itemInputSchema,
  removeImage: z.boolean().optional().default(false),
  remoteImageUrl: z.string().url().optional(),
});

const listKinds = [...itemKinds, "sealed"] as const;

const listQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  kind: z.enum(listKinds).optional(),
  collectionId: z.string().trim().max(60).optional(),
  setCode: z.string().trim().max(60).optional(),
  language: z.string().trim().max(60).optional(),
  condition: z.string().trim().max(60).optional(),
  sealed: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  sort: z.enum(itemSortOptions).default("updated-desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
});

const typeSpecificFields = [
  "collectionId",
  "cardNumber",
  "rarity",
  "colors",
  "cardType",
  "condition",
  "finish",
  "isGraded",
  "grader",
  "grade",
  "productCode",
  "isSealed",
  "packVariant",
  "boxType",
  "packsPerBox",
] as const;

function parseObjectId(value: string | string[] | undefined): Types.ObjectId {
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) {
    throw new AppError(400, "invalid_id", "The supplied item ID is invalid");
  }

  return new Types.ObjectId(value);
}

function parsePayload(request: Request): z.infer<typeof mutationPayloadSchema> {
  const rawPayload = request.body.payload ?? request.body;
  if (typeof rawPayload === "string") {
    try {
      return mutationPayloadSchema.parse(JSON.parse(rawPayload));
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new AppError(
          400,
          "invalid_json",
          "The item payload is not valid JSON",
        );
      }
      throw error;
    }
  }

  return mutationPayloadSchema.parse(rawPayload);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sortFor(sort: ItemSort): Record<string, 1 | -1> {
  switch (sort) {
    case "name-asc":
      return { name: 1, updatedAt: -1 };
    case "quantity-desc":
      return { quantity: -1, updatedAt: -1 };
    default:
      return { updatedAt: -1 };
  }
}

function validateImage(file: ImageUpload | undefined): void {
  if (file && !hasValidImageSignature(file)) {
    throw new AppError(
      400,
      "invalid_image_content",
      "The uploaded file content does not match its image type",
    );
  }
}

async function uploadImage(
  imageStore: GridFsImageStore,
  file: ImageUpload | undefined,
  itemId: Types.ObjectId,
): Promise<StoredImage | undefined> {
  if (!file) {
    return undefined;
  }

  validateImage(file);
  return imageStore.upload(file, itemId);
}

async function resolveImageUpload(
  localImage: Express.Multer.File | undefined,
  remoteImageUrl: string | undefined,
  item: ItemInput,
  tcgplayerClient: TcgplayerClient,
): Promise<ImageUpload | undefined> {
  if (localImage && remoteImageUrl) {
    throw new AppError(
      400,
      "conflicting_image_sources",
      "Choose either an uploaded image or the imported TCGplayer image",
    );
  }
  if (!remoteImageUrl) return localImage;
  if (item.source?.provider !== "tcgplayer") {
    throw new AppError(
      400,
      "invalid_remote_image",
      "A TCGplayer source is required to import its product image",
    );
  }

  return tcgplayerClient.downloadImage(remoteImageUrl, item.source.productId);
}

async function cleanFailedUpload(
  imageStore: GridFsImageStore,
  image: StoredImage | undefined,
  reason: string,
): Promise<void> {
  if (image) {
    await deleteImageOrQueue(imageStore, image.fileId, reason);
  }
}

function applyInput(document: ItemDocument, input: ItemInput): void {
  for (const field of typeSpecificFields) {
    document.set(field, undefined);
  }
  document.set(input);
}

async function ensureCardCollection(item: ItemInput): Promise<void> {
  if (item.kind !== "card") return;
  if (!Types.ObjectId.isValid(item.collectionId)) {
    throw new AppError(
      400,
      "invalid_collection",
      "Choose a valid card collection",
    );
  }

  const collectionExists = await CardCollectionModel.exists({
    _id: item.collectionId,
  });
  if (!collectionExists) {
    throw new AppError(
      404,
      "collection_not_found",
      "The selected card collection was not found",
    );
  }
}

export function createItemsRouter(
  imageStore: GridFsImageStore,
  uploadSingleImage: RequestHandler,
  tcgplayerClient: TcgplayerClient,
): Router {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (request, response) => {
      const query = listQuerySchema.parse(request.query);
      const filter: FilterQuery<ItemRecord> = {};

      if (query.kind === "sealed") filter.kind = { $in: ["pack", "box"] };
      else if (query.kind) filter.kind = query.kind;
      if (query.collectionId) filter.collectionId = query.collectionId;
      if (query.setCode)
        filter.setCode = new RegExp(`^${escapeRegExp(query.setCode)}$`, "i");
      if (query.language) filter.language = query.language;
      if (query.condition) filter.condition = query.condition;
      if (query.sealed !== undefined) filter.isSealed = query.sealed;
      if (query.search) {
        const search = new RegExp(escapeRegExp(query.search), "i");
        filter.$or = [
          { name: search },
          { setName: search },
          { setCode: search },
          { cardNumber: search },
          { tags: search },
        ];
      }

      const skip = (query.page - 1) * query.pageSize;
      const [documents, totalItems] = await Promise.all([
        ItemModel.find(filter)
          .sort(sortFor(query.sort))
          .skip(skip)
          .limit(query.pageSize)
          .exec(),
        ItemModel.countDocuments(filter),
      ]);

      response.json({
        items: documents.map(toInventoryItem),
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          totalItems,
          totalPages: Math.ceil(totalItems / query.pageSize),
        },
      });
    }),
  );

  router.get(
    "/:itemId",
    asyncHandler(async (request, response) => {
      const document = await ItemModel.findById(
        parseObjectId(request.params.itemId),
      ).exec();
      if (!document) {
        throw new AppError(404, "item_not_found", "Collection item not found");
      }

      response.json({ item: toInventoryItem(document) });
    }),
  );

  router.post(
    "/",
    uploadSingleImage,
    asyncHandler(async (request, response) => {
      const payload = parsePayload(request);
      if (payload.removeImage) {
        throw new AppError(
          400,
          "invalid_remove_image",
          "A new item cannot remove an image",
        );
      }

      await ensureCardCollection(payload.item);
      const itemId = new Types.ObjectId();
      const imageUpload = await resolveImageUpload(
        request.file,
        payload.remoteImageUrl,
        payload.item,
        tcgplayerClient,
      );
      const image = await uploadImage(imageStore, imageUpload, itemId);

      try {
        const document = await ItemModel.create({
          _id: itemId,
          ...payload.item,
          image,
        });
        response.status(201).json({ item: toInventoryItem(document) });
      } catch (error) {
        await cleanFailedUpload(imageStore, image, "create_item_failed");
        throw error;
      }
    }),
  );

  router.patch(
    "/:itemId",
    uploadSingleImage,
    asyncHandler(async (request, response) => {
      const itemId = parseObjectId(request.params.itemId);
      const document = await ItemModel.findById(itemId).exec();
      if (!document) {
        throw new AppError(404, "item_not_found", "Collection item not found");
      }

      const payload = parsePayload(request);
      if (payload.removeImage && (request.file || payload.remoteImageUrl)) {
        throw new AppError(
          400,
          "conflicting_image_change",
          "Choose either a replacement image or image removal",
        );
      }

      await ensureCardCollection(payload.item);
      const oldImage = document.image;
      const imageUpload = await resolveImageUpload(
        request.file,
        payload.remoteImageUrl,
        payload.item,
        tcgplayerClient,
      );
      const replacementImage = await uploadImage(
        imageStore,
        imageUpload,
        itemId,
      );

      applyInput(document, payload.item);
      document.image =
        replacementImage ?? (payload.removeImage ? undefined : oldImage);

      try {
        await document.save();
      } catch (error) {
        await cleanFailedUpload(
          imageStore,
          replacementImage,
          "update_item_failed",
        );
        throw error;
      }

      let imageCleanupPending = false;
      if (oldImage && (replacementImage || payload.removeImage)) {
        imageCleanupPending = await deleteImageOrQueue(
          imageStore,
          oldImage.fileId,
          "replaced_or_removed_image",
        );
      }

      response.json({
        item: toInventoryItem(document),
        imageCleanupPending,
      });
    }),
  );

  router.patch(
    "/:itemId/ownership",
    asyncHandler(async (request, response) => {
      const document = await ItemModel.findById(
        parseObjectId(request.params.itemId),
      ).exec();
      if (!document) {
        throw new AppError(404, "item_not_found", "Collection item not found");
      }

      const { isOwned } = itemOwnershipSchema.parse(request.body);
      document.isOwned = isOwned;
      await document.save();

      response.json({ item: toInventoryItem(document) });
    }),
  );

  router.patch(
    "/:itemId/japanese",
    asyncHandler(async (request, response) => {
      const document = await ItemModel.findById(
        parseObjectId(request.params.itemId),
      ).exec();
      if (!document) {
        throw new AppError(404, "item_not_found", "Collection item not found");
      }
      if (document.kind !== "card") {
        throw new AppError(
          400,
          "not_a_card",
          "Only cards can have Japanese status",
        );
      }

      const { isJapanese } = cardJapaneseSchema.parse(request.body);
      document.isJapanese = isJapanese;
      if (isJapanese) {
        document.language = "Japanese";
      } else if (document.language === "Japanese") {
        document.language = "English";
      }
      await document.save();

      response.json({ item: toInventoryItem(document) });
    }),
  );

  router.patch(
    "/:itemId/grading",
    asyncHandler(async (request, response) => {
      const document = await ItemModel.findById(
        parseObjectId(request.params.itemId),
      ).exec();
      if (!document) {
        throw new AppError(404, "item_not_found", "Collection item not found");
      }
      if (document.kind !== "card") {
        throw new AppError(
          400,
          "not_a_card",
          "Only cards can have grading details",
        );
      }

      const grading = cardGradingSchema.parse(request.body);
      document.isGraded = grading.isGraded;
      document.grader = grading.isGraded ? grading.grader : undefined;
      document.grade = grading.isGraded ? grading.grade : undefined;
      await document.save();

      response.json({ item: toInventoryItem(document) });
    }),
  );

  router.patch(
    "/:itemId/collection",
    asyncHandler(async (request, response) => {
      const itemId = parseObjectId(request.params.itemId);
      const { collectionId } = z
        .object({ collectionId: z.string().trim().min(1).max(60) })
        .parse(request.body);
      if (!Types.ObjectId.isValid(collectionId)) {
        throw new AppError(
          400,
          "invalid_collection",
          "Choose a valid card collection",
        );
      }

      const [document, collectionExists] = await Promise.all([
        ItemModel.findById(itemId).exec(),
        CardCollectionModel.exists({ _id: collectionId }),
      ]);
      if (!document) {
        throw new AppError(404, "item_not_found", "Collection item not found");
      }
      if (document.kind !== "card") {
        throw new AppError(
          400,
          "not_a_card",
          "Only cards can be moved between collections",
        );
      }
      if (!collectionExists) {
        throw new AppError(
          404,
          "collection_not_found",
          "The selected collection was not found",
        );
      }

      document.collectionId = collectionId;
      await document.save();
      response.json({ item: toInventoryItem(document) });
    }),
  );

  router.delete(
    "/:itemId",
    asyncHandler(async (request, response) => {
      const document = await ItemModel.findById(
        parseObjectId(request.params.itemId),
      ).exec();
      if (!document) {
        throw new AppError(404, "item_not_found", "Collection item not found");
      }

      const image = document.image;
      await document.deleteOne();

      const imageCleanupPending = image
        ? await deleteImageOrQueue(imageStore, image.fileId, "deleted_item")
        : false;

      response.json({ deleted: true, imageCleanupPending });
    }),
  );

  return router;
}

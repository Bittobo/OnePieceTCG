import type { SealedSetsResponse } from "@one-piece-tcg/shared";
import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";

import { AppError } from "../errors/app-error.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { ItemModel, toInventoryItem } from "../models/item.js";
import {
  normalizeSealedSetCode,
  SealedSetTrackerModel,
} from "../models/sealed-set-tracker.js";
import { groupSealedItems } from "../services/sealed-sets.js";

const trackerInputSchema = z.object({
  setName: z.string().trim().min(1).max(120),
  setCode: z.string().trim().min(1).max(40),
  releaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export function createSealedSetsRouter(): Router {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (_request, response) => {
      const [documents, trackers] = await Promise.all([
        ItemModel.find({
          kind: { $in: ["box", "pack"] },
        })
          .sort({ setName: 1, setCode: 1, kind: 1, updatedAt: -1 })
          .exec(),
        SealedSetTrackerModel.find().sort({ setCode: 1 }).exec(),
      ]);
      const groups = groupSealedItems(
        documents.map(toInventoryItem),
        trackers.map((tracker) => ({
          id: tracker._id.toHexString(),
          setName: tracker.setName,
          setCode: tracker.setCode,
        })),
      );
      const payload: SealedSetsResponse = { groups };

      response.json(payload);
    }),
  );

  router.post(
    "/",
    asyncHandler(async (request, response) => {
      const input = trackerInputSchema.parse(request.body);
      const normalizedCode = normalizeSealedSetCode(input.setCode);
      const existing = await SealedSetTrackerModel.findOne({
        normalizedCode,
      }).exec();
      const tracker =
        existing ??
        new SealedSetTrackerModel({
          ...input,
          normalizedCode,
        });

      tracker.setName = input.setName;
      tracker.setCode = input.setCode;
      tracker.releaseDate = input.releaseDate;
      await tracker.save();

      response.status(existing ? 200 : 201).json({
        tracker: {
          id: tracker._id.toHexString(),
          setName: tracker.setName,
          setCode: tracker.setCode,
          releaseDate: tracker.releaseDate,
        },
      });
    }),
  );

  router.delete(
    "/trackers/:trackerId",
    asyncHandler(async (request, response) => {
      const trackerId = request.params.trackerId;
      if (typeof trackerId !== "string" || !Types.ObjectId.isValid(trackerId)) {
        throw new AppError(
          400,
          "invalid_id",
          "The supplied set tracker ID is invalid",
        );
      }

      const deleted =
        await SealedSetTrackerModel.findByIdAndDelete(trackerId).exec();
      if (!deleted) {
        throw new AppError(
          404,
          "set_tracker_not_found",
          "Missing set tracker not found",
        );
      }
      response.json({ deleted: true });
    }),
  );

  return router;
}

import mongoose, { type HydratedDocument, Schema } from "mongoose";

export interface SealedSetTrackerRecord {
  setName: string;
  setCode: string;
  normalizedCode: string;
  releaseDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function normalizeSealedSetCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

const sealedSetTrackerSchema = new Schema<SealedSetTrackerRecord>(
  {
    setName: { type: String, required: true, trim: true },
    setCode: { type: String, required: true, trim: true },
    normalizedCode: { type: String, required: true, unique: true, index: true },
    releaseDate: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

sealedSetTrackerSchema.pre("validate", function normalizeTracker() {
  this.setName = this.setName.trim().replace(/\s+/g, " ");
  this.setCode = this.setCode.trim().toUpperCase();
  this.normalizedCode = normalizeSealedSetCode(this.setCode);
});

export const SealedSetTrackerModel =
  (mongoose.models.SealedSetTracker as
    mongoose.Model<SealedSetTrackerRecord> | undefined) ??
  mongoose.model<SealedSetTrackerRecord>(
    "SealedSetTracker",
    sealedSetTrackerSchema,
  );

export type SealedSetTrackerDocument = HydratedDocument<SealedSetTrackerRecord>;

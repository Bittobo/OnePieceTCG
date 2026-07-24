import mongoose, { type HydratedDocument, Schema } from 'mongoose';

export interface CardCollectionRecord {
  name: string;
  normalizedName: string;
  createdAt: Date;
  updatedAt: Date;
}

export function normalizeCollectionName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

const cardCollectionSchema = new Schema<CardCollectionRecord>(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, unique: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

cardCollectionSchema.pre('validate', function normalizeName() {
  this.name = this.name.trim().replace(/\s+/g, ' ');
  this.normalizedName = normalizeCollectionName(this.name);
});

export const CardCollectionModel =
  (mongoose.models.CardCollection as mongoose.Model<CardCollectionRecord> | undefined) ??
  mongoose.model<CardCollectionRecord>('CardCollection', cardCollectionSchema);

export type CardCollectionDocument = HydratedDocument<CardCollectionRecord>;

import { gradingCompanies, itemInputSchema, } from '@one-piece-tcg/shared';
import mongoose, { Schema } from 'mongoose';
const imageSchema = new Schema({
    fileId: { type: Schema.Types.ObjectId, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
}, { _id: false });
const sourceSchema = new Schema({
    provider: { type: String, enum: ['tcgplayer'], required: true },
    productId: { type: Number, required: true, min: 1 },
    url: { type: String, required: true },
    importedAt: { type: String, required: true },
}, { _id: false });
const itemSchema = new Schema({
    kind: { type: String, enum: ['card', 'pack', 'box'], required: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    setName: { type: String, required: true, trim: true },
    setCode: { type: String, trim: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    language: { type: String, required: true, index: true },
    storageLocation: { type: String, trim: true },
    tags: { type: [String], default: [], index: true },
    notes: { type: String, trim: true },
    source: sourceSchema,
    image: imageSchema,
    collectionId: { type: String, trim: true, index: true },
    cardNumber: { type: String, trim: true, index: true },
    rarity: { type: String, trim: true },
    colors: { type: [String] },
    cardType: { type: String },
    condition: { type: String, index: true },
    finish: { type: String },
    isGraded: { type: Boolean },
    grader: { type: String, enum: gradingCompanies, trim: true },
    grade: { type: String, trim: true },
    productCode: { type: String, trim: true },
    isSealed: { type: Boolean, index: true },
    packVariant: { type: String, trim: true },
    boxType: { type: String },
    packsPerBox: { type: Number, min: 1 },
}, {
    timestamps: true,
    versionKey: false,
});
itemSchema.index({ updatedAt: -1 });
itemSchema.index({ kind: 1, setCode: 1 });
itemSchema.index({ collectionId: 1, updatedAt: -1 });
itemSchema.pre('validate', function validateDomainModel() {
    const result = itemInputSchema.safeParse(this.toObject());
    if (result.success) {
        return;
    }
    for (const issue of result.error.issues) {
        this.invalidate(issue.path.join('.') || 'item', issue.message);
    }
});
export const ItemModel = mongoose.models.Item ??
    mongoose.model('Item', itemSchema);
function inputFromRecord(record) {
    const common = {
        kind: record.kind,
        name: record.name,
        setName: record.setName,
        setCode: record.setCode,
        quantity: record.quantity,
        language: record.language,
        storageLocation: record.storageLocation,
        tags: record.tags,
        notes: record.notes,
        source: record.source,
    };
    if (record.kind === 'card') {
        return itemInputSchema.parse({
            ...common,
            kind: 'card',
            collectionId: record.collectionId,
            cardNumber: record.cardNumber,
            rarity: record.rarity,
            colors: record.colors,
            cardType: record.cardType,
            condition: record.condition,
            finish: record.finish,
            isGraded: record.isGraded,
            grader: record.grader,
            grade: record.grade,
        });
    }
    if (record.kind === 'pack') {
        return itemInputSchema.parse({
            ...common,
            kind: 'pack',
            productCode: record.productCode,
            isSealed: record.isSealed,
            packVariant: record.packVariant,
        });
    }
    return itemInputSchema.parse({
        ...common,
        kind: 'box',
        productCode: record.productCode,
        boxType: record.boxType,
        isSealed: record.isSealed,
        packsPerBox: record.packsPerBox,
    });
}
export function toInventoryItem(document) {
    const input = inputFromRecord(document);
    const image = document.image
        ? {
            fileId: document.image.fileId.toHexString(),
            originalName: document.image.originalName,
            mimeType: document.image.mimeType,
            size: document.image.size,
            url: `/api/images/${document.image.fileId.toHexString()}`,
        }
        : undefined;
    return {
        ...input,
        id: document._id.toHexString(),
        image,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
    };
}
//# sourceMappingURL=item.js.map
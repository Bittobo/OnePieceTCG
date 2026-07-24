import mongoose, { Schema } from 'mongoose';
export function normalizeCollectionName(name) {
    return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}
const cardCollectionSchema = new Schema({
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, unique: true, index: true },
}, {
    timestamps: true,
    versionKey: false,
});
cardCollectionSchema.pre('validate', function normalizeName() {
    this.name = this.name.trim().replace(/\s+/g, ' ');
    this.normalizedName = normalizeCollectionName(this.name);
});
export const CardCollectionModel = mongoose.models.CardCollection ??
    mongoose.model('CardCollection', cardCollectionSchema);
//# sourceMappingURL=card-collection.js.map
import { z } from 'zod';
export const itemKinds = ['card', 'pack', 'box'];
export const languages = ['English', 'Japanese', 'Chinese', 'French', 'Other'];
export const cardColors = ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow', 'Other'];
export const cardTypes = ['Leader', 'Character', 'Event', 'Stage', 'Don', 'Other'];
export const cardConditions = [
    'Mint',
    'Near Mint',
    'Lightly Played',
    'Moderately Played',
    'Heavily Played',
    'Damaged',
];
export const cardFinishes = [
    'Regular',
    'Foil',
    'Parallel',
    'Alternate Art',
    'Manga',
    'Promo',
    'Other',
];
export const gradingCompanies = ['PSA', 'BGS', 'Other'];
export const psaGrades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
export const bgsGrades = [
    '1',
    '1.5',
    '2',
    '2.5',
    '3',
    '3.5',
    '4',
    '4.5',
    '5',
    '5.5',
    '6',
    '6.5',
    '7',
    '7.5',
    '8',
    '8.5',
    '9',
    '9.5',
    '10',
];
export const boxTypes = [
    'Booster Box',
    'Display',
    'Starter Deck',
    'Gift Collection',
    'Case',
    'Other',
];
export const itemSortOptions = ['updated-desc', 'name-asc', 'quantity-desc'];
const requiredText = (label, maximum = 120) => z.string().trim().min(1, `${label} is required`).max(maximum);
const optionalText = (maximum = 120) => z
    .string()
    .trim()
    .max(maximum)
    .optional()
    .transform((value) => value || undefined);
export const itemSourceSchema = z.object({
    provider: z.literal('tcgplayer'),
    productId: z.number().int().positive(),
    url: z.string().url(),
    importedAt: z.string().datetime(),
});
const commonFields = {
    name: requiredText('Name'),
    setName: requiredText('Set name'),
    setCode: optionalText(40),
    quantity: z.number().int().min(1).max(100_000),
    language: z.enum(languages),
    storageLocation: optionalText(120),
    tags: z.array(requiredText('Tag', 40)).max(20).default([]),
    notes: optionalText(2_000),
    source: itemSourceSchema.optional(),
};
const gradingFields = {
    isGraded: z.boolean(),
    grader: z.enum(gradingCompanies).optional(),
    grade: optionalText(12),
};
function validateCardGrading(grading, context) {
    if (!grading.isGraded)
        return;
    if (!grading.grader) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['grader'],
            message: 'Grading company is required for a graded card',
        });
    }
    if (!grading.grade) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['grade'],
            message: 'Grade is required for a graded card',
        });
        return;
    }
    if (grading.grader === 'PSA' &&
        !psaGrades.includes(grading.grade)) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['grade'],
            message: 'PSA grades must be whole numbers from 1 to 10',
        });
    }
    if (grading.grader === 'BGS' &&
        !bgsGrades.includes(grading.grade)) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['grade'],
            message: 'BGS grades must be from 1 to 10 in half-point steps',
        });
    }
}
export const cardGradingSchema = z.object(gradingFields).superRefine(validateCardGrading);
const cardInputSchema = z.object({
    ...commonFields,
    kind: z.literal('card'),
    collectionId: requiredText('Collection', 60),
    cardNumber: requiredText('Card number', 60),
    rarity: requiredText('Rarity', 60),
    colors: z.array(z.enum(cardColors)).min(1, 'Choose at least one color'),
    cardType: z.enum(cardTypes),
    condition: z.enum(cardConditions),
    finish: z.enum(cardFinishes),
    ...gradingFields,
});
const packInputSchema = z.object({
    ...commonFields,
    kind: z.literal('pack'),
    productCode: optionalText(60),
    isSealed: z.boolean(),
    packVariant: optionalText(120),
});
const boxInputSchema = z.object({
    ...commonFields,
    kind: z.literal('box'),
    productCode: optionalText(60),
    boxType: z.enum(boxTypes),
    isSealed: z.boolean(),
    packsPerBox: z.number().int().positive().max(1_000).optional(),
});
export const tcgplayerImportedItemSchema = z.discriminatedUnion('kind', [
    cardInputSchema.omit({ collectionId: true }),
    packInputSchema,
    boxInputSchema,
]);
export const itemInputSchema = z
    .discriminatedUnion('kind', [cardInputSchema, packInputSchema, boxInputSchema])
    .superRefine((item, context) => {
    if (item.kind === 'card')
        validateCardGrading(item, context);
});
export const imageReferenceSchema = z.object({
    fileId: z.string(),
    originalName: z.string(),
    mimeType: z.string(),
    size: z.number().int().nonnegative(),
    url: z.string(),
});
//# sourceMappingURL=inventory.js.map
import { z } from 'zod';
export declare const itemKinds: readonly ["card", "pack", "box"];
export declare const languages: readonly ["English", "Japanese", "Chinese", "French", "Other"];
export declare const cardColors: readonly ["Red", "Green", "Blue", "Purple", "Black", "Yellow", "Other"];
export declare const cardTypes: readonly ["Leader", "Character", "Event", "Stage", "Don", "Other"];
export declare const cardConditions: readonly ["Mint", "Near Mint", "Lightly Played", "Moderately Played", "Heavily Played", "Damaged"];
export declare const cardFinishes: readonly ["Regular", "Foil", "Parallel", "Alternate Art", "Manga", "Promo", "Other"];
export declare const gradingCompanies: readonly ["PSA", "BGS", "Other"];
export declare const psaGrades: readonly ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
export declare const bgsGrades: readonly ["1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"];
export declare const boxTypes: readonly ["Booster Box", "Display", "Starter Deck", "Gift Collection", "Case", "Other"];
export declare const itemSortOptions: readonly ["updated-desc", "name-asc", "quantity-desc"];
export declare const itemSourceSchema: z.ZodObject<{
    provider: z.ZodLiteral<"tcgplayer">;
    productId: z.ZodNumber;
    url: z.ZodString;
    importedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    provider: "tcgplayer";
    productId: number;
    url: string;
    importedAt: string;
}, {
    provider: "tcgplayer";
    productId: number;
    url: string;
    importedAt: string;
}>;
export declare const cardGradingSchema: z.ZodEffects<z.ZodObject<{
    isGraded: z.ZodBoolean;
    grader: z.ZodOptional<z.ZodEnum<["PSA", "BGS", "Other"]>>;
    grade: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
}, "strip", z.ZodTypeAny, {
    isGraded: boolean;
    grader?: "Other" | "PSA" | "BGS" | undefined;
    grade?: string | undefined;
}, {
    isGraded: boolean;
    grader?: "Other" | "PSA" | "BGS" | undefined;
    grade?: string | undefined;
}>, {
    isGraded: boolean;
    grader?: "Other" | "PSA" | "BGS" | undefined;
    grade?: string | undefined;
}, {
    isGraded: boolean;
    grader?: "Other" | "PSA" | "BGS" | undefined;
    grade?: string | undefined;
}>;
export declare const tcgplayerImportedItemSchema: z.ZodDiscriminatedUnion<"kind", [z.ZodObject<Omit<{
    isGraded: z.ZodBoolean;
    grader: z.ZodOptional<z.ZodEnum<["PSA", "BGS", "Other"]>>;
    grade: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    kind: z.ZodLiteral<"card">;
    collectionId: z.ZodString;
    cardNumber: z.ZodString;
    rarity: z.ZodString;
    colors: z.ZodArray<z.ZodEnum<["Red", "Green", "Blue", "Purple", "Black", "Yellow", "Other"]>, "many">;
    cardType: z.ZodEnum<["Leader", "Character", "Event", "Stage", "Don", "Other"]>;
    condition: z.ZodEnum<["Mint", "Near Mint", "Lightly Played", "Moderately Played", "Heavily Played", "Damaged"]>;
    finish: z.ZodEnum<["Regular", "Foil", "Parallel", "Alternate Art", "Manga", "Promo", "Other"]>;
    name: z.ZodString;
    setName: z.ZodString;
    setCode: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    quantity: z.ZodNumber;
    language: z.ZodEnum<["English", "Japanese", "Chinese", "French", "Other"]>;
    storageLocation: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    notes: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    source: z.ZodOptional<z.ZodObject<{
        provider: z.ZodLiteral<"tcgplayer">;
        productId: z.ZodNumber;
        url: z.ZodString;
        importedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    }, {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    }>>;
}, "collectionId">, "strip", z.ZodTypeAny, {
    isGraded: boolean;
    kind: "card";
    cardNumber: string;
    rarity: string;
    colors: ("Other" | "Red" | "Green" | "Blue" | "Purple" | "Black" | "Yellow")[];
    cardType: "Other" | "Leader" | "Character" | "Event" | "Stage" | "Don";
    condition: "Mint" | "Near Mint" | "Lightly Played" | "Moderately Played" | "Heavily Played" | "Damaged";
    finish: "Other" | "Regular" | "Foil" | "Parallel" | "Alternate Art" | "Manga" | "Promo";
    name: string;
    setName: string;
    quantity: number;
    language: "English" | "Japanese" | "Chinese" | "French" | "Other";
    tags: string[];
    grader?: "Other" | "PSA" | "BGS" | undefined;
    grade?: string | undefined;
    setCode?: string | undefined;
    storageLocation?: string | undefined;
    notes?: string | undefined;
    source?: {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    } | undefined;
}, {
    isGraded: boolean;
    kind: "card";
    cardNumber: string;
    rarity: string;
    colors: ("Other" | "Red" | "Green" | "Blue" | "Purple" | "Black" | "Yellow")[];
    cardType: "Other" | "Leader" | "Character" | "Event" | "Stage" | "Don";
    condition: "Mint" | "Near Mint" | "Lightly Played" | "Moderately Played" | "Heavily Played" | "Damaged";
    finish: "Other" | "Regular" | "Foil" | "Parallel" | "Alternate Art" | "Manga" | "Promo";
    name: string;
    setName: string;
    quantity: number;
    language: "English" | "Japanese" | "Chinese" | "French" | "Other";
    grader?: "Other" | "PSA" | "BGS" | undefined;
    grade?: string | undefined;
    setCode?: string | undefined;
    storageLocation?: string | undefined;
    tags?: string[] | undefined;
    notes?: string | undefined;
    source?: {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    } | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"pack">;
    productCode: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    isSealed: z.ZodBoolean;
    packVariant: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    name: z.ZodString;
    setName: z.ZodString;
    setCode: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    quantity: z.ZodNumber;
    language: z.ZodEnum<["English", "Japanese", "Chinese", "French", "Other"]>;
    storageLocation: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    notes: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    source: z.ZodOptional<z.ZodObject<{
        provider: z.ZodLiteral<"tcgplayer">;
        productId: z.ZodNumber;
        url: z.ZodString;
        importedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    }, {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    kind: "pack";
    name: string;
    setName: string;
    quantity: number;
    language: "English" | "Japanese" | "Chinese" | "French" | "Other";
    tags: string[];
    isSealed: boolean;
    setCode?: string | undefined;
    storageLocation?: string | undefined;
    notes?: string | undefined;
    source?: {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    } | undefined;
    productCode?: string | undefined;
    packVariant?: string | undefined;
}, {
    kind: "pack";
    name: string;
    setName: string;
    quantity: number;
    language: "English" | "Japanese" | "Chinese" | "French" | "Other";
    isSealed: boolean;
    setCode?: string | undefined;
    storageLocation?: string | undefined;
    tags?: string[] | undefined;
    notes?: string | undefined;
    source?: {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    } | undefined;
    productCode?: string | undefined;
    packVariant?: string | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"box">;
    productCode: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    boxType: z.ZodEnum<["Booster Box", "Display", "Starter Deck", "Gift Collection", "Case", "Other"]>;
    isSealed: z.ZodBoolean;
    packsPerBox: z.ZodOptional<z.ZodNumber>;
    name: z.ZodString;
    setName: z.ZodString;
    setCode: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    quantity: z.ZodNumber;
    language: z.ZodEnum<["English", "Japanese", "Chinese", "French", "Other"]>;
    storageLocation: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    notes: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    source: z.ZodOptional<z.ZodObject<{
        provider: z.ZodLiteral<"tcgplayer">;
        productId: z.ZodNumber;
        url: z.ZodString;
        importedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    }, {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    kind: "box";
    name: string;
    setName: string;
    quantity: number;
    language: "English" | "Japanese" | "Chinese" | "French" | "Other";
    tags: string[];
    isSealed: boolean;
    boxType: "Other" | "Booster Box" | "Display" | "Starter Deck" | "Gift Collection" | "Case";
    setCode?: string | undefined;
    storageLocation?: string | undefined;
    notes?: string | undefined;
    source?: {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    } | undefined;
    productCode?: string | undefined;
    packsPerBox?: number | undefined;
}, {
    kind: "box";
    name: string;
    setName: string;
    quantity: number;
    language: "English" | "Japanese" | "Chinese" | "French" | "Other";
    isSealed: boolean;
    boxType: "Other" | "Booster Box" | "Display" | "Starter Deck" | "Gift Collection" | "Case";
    setCode?: string | undefined;
    storageLocation?: string | undefined;
    tags?: string[] | undefined;
    notes?: string | undefined;
    source?: {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    } | undefined;
    productCode?: string | undefined;
    packsPerBox?: number | undefined;
}>]>;
export declare const itemInputSchema: z.ZodEffects<z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
    isGraded: z.ZodBoolean;
    grader: z.ZodOptional<z.ZodEnum<["PSA", "BGS", "Other"]>>;
    grade: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    kind: z.ZodLiteral<"card">;
    collectionId: z.ZodString;
    cardNumber: z.ZodString;
    rarity: z.ZodString;
    colors: z.ZodArray<z.ZodEnum<["Red", "Green", "Blue", "Purple", "Black", "Yellow", "Other"]>, "many">;
    cardType: z.ZodEnum<["Leader", "Character", "Event", "Stage", "Don", "Other"]>;
    condition: z.ZodEnum<["Mint", "Near Mint", "Lightly Played", "Moderately Played", "Heavily Played", "Damaged"]>;
    finish: z.ZodEnum<["Regular", "Foil", "Parallel", "Alternate Art", "Manga", "Promo", "Other"]>;
    name: z.ZodString;
    setName: z.ZodString;
    setCode: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    quantity: z.ZodNumber;
    language: z.ZodEnum<["English", "Japanese", "Chinese", "French", "Other"]>;
    storageLocation: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    notes: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    source: z.ZodOptional<z.ZodObject<{
        provider: z.ZodLiteral<"tcgplayer">;
        productId: z.ZodNumber;
        url: z.ZodString;
        importedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    }, {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    isGraded: boolean;
    kind: "card";
    collectionId: string;
    cardNumber: string;
    rarity: string;
    colors: ("Other" | "Red" | "Green" | "Blue" | "Purple" | "Black" | "Yellow")[];
    cardType: "Other" | "Leader" | "Character" | "Event" | "Stage" | "Don";
    condition: "Mint" | "Near Mint" | "Lightly Played" | "Moderately Played" | "Heavily Played" | "Damaged";
    finish: "Other" | "Regular" | "Foil" | "Parallel" | "Alternate Art" | "Manga" | "Promo";
    name: string;
    setName: string;
    quantity: number;
    language: "English" | "Japanese" | "Chinese" | "French" | "Other";
    tags: string[];
    grader?: "Other" | "PSA" | "BGS" | undefined;
    grade?: string | undefined;
    setCode?: string | undefined;
    storageLocation?: string | undefined;
    notes?: string | undefined;
    source?: {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    } | undefined;
}, {
    isGraded: boolean;
    kind: "card";
    collectionId: string;
    cardNumber: string;
    rarity: string;
    colors: ("Other" | "Red" | "Green" | "Blue" | "Purple" | "Black" | "Yellow")[];
    cardType: "Other" | "Leader" | "Character" | "Event" | "Stage" | "Don";
    condition: "Mint" | "Near Mint" | "Lightly Played" | "Moderately Played" | "Heavily Played" | "Damaged";
    finish: "Other" | "Regular" | "Foil" | "Parallel" | "Alternate Art" | "Manga" | "Promo";
    name: string;
    setName: string;
    quantity: number;
    language: "English" | "Japanese" | "Chinese" | "French" | "Other";
    grader?: "Other" | "PSA" | "BGS" | undefined;
    grade?: string | undefined;
    setCode?: string | undefined;
    storageLocation?: string | undefined;
    tags?: string[] | undefined;
    notes?: string | undefined;
    source?: {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    } | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"pack">;
    productCode: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    isSealed: z.ZodBoolean;
    packVariant: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    name: z.ZodString;
    setName: z.ZodString;
    setCode: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    quantity: z.ZodNumber;
    language: z.ZodEnum<["English", "Japanese", "Chinese", "French", "Other"]>;
    storageLocation: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    notes: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    source: z.ZodOptional<z.ZodObject<{
        provider: z.ZodLiteral<"tcgplayer">;
        productId: z.ZodNumber;
        url: z.ZodString;
        importedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    }, {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    kind: "pack";
    name: string;
    setName: string;
    quantity: number;
    language: "English" | "Japanese" | "Chinese" | "French" | "Other";
    tags: string[];
    isSealed: boolean;
    setCode?: string | undefined;
    storageLocation?: string | undefined;
    notes?: string | undefined;
    source?: {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    } | undefined;
    productCode?: string | undefined;
    packVariant?: string | undefined;
}, {
    kind: "pack";
    name: string;
    setName: string;
    quantity: number;
    language: "English" | "Japanese" | "Chinese" | "French" | "Other";
    isSealed: boolean;
    setCode?: string | undefined;
    storageLocation?: string | undefined;
    tags?: string[] | undefined;
    notes?: string | undefined;
    source?: {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    } | undefined;
    productCode?: string | undefined;
    packVariant?: string | undefined;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"box">;
    productCode: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    boxType: z.ZodEnum<["Booster Box", "Display", "Starter Deck", "Gift Collection", "Case", "Other"]>;
    isSealed: z.ZodBoolean;
    packsPerBox: z.ZodOptional<z.ZodNumber>;
    name: z.ZodString;
    setName: z.ZodString;
    setCode: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    quantity: z.ZodNumber;
    language: z.ZodEnum<["English", "Japanese", "Chinese", "French", "Other"]>;
    storageLocation: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    notes: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    source: z.ZodOptional<z.ZodObject<{
        provider: z.ZodLiteral<"tcgplayer">;
        productId: z.ZodNumber;
        url: z.ZodString;
        importedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    }, {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    kind: "box";
    name: string;
    setName: string;
    quantity: number;
    language: "English" | "Japanese" | "Chinese" | "French" | "Other";
    tags: string[];
    isSealed: boolean;
    boxType: "Other" | "Booster Box" | "Display" | "Starter Deck" | "Gift Collection" | "Case";
    setCode?: string | undefined;
    storageLocation?: string | undefined;
    notes?: string | undefined;
    source?: {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    } | undefined;
    productCode?: string | undefined;
    packsPerBox?: number | undefined;
}, {
    kind: "box";
    name: string;
    setName: string;
    quantity: number;
    language: "English" | "Japanese" | "Chinese" | "French" | "Other";
    isSealed: boolean;
    boxType: "Other" | "Booster Box" | "Display" | "Starter Deck" | "Gift Collection" | "Case";
    setCode?: string | undefined;
    storageLocation?: string | undefined;
    tags?: string[] | undefined;
    notes?: string | undefined;
    source?: {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    } | undefined;
    productCode?: string | undefined;
    packsPerBox?: number | undefined;
}>]>, {
    isGraded: boolean;
    kind: "card";
    collectionId: string;
    cardNumber: string;
    rarity: string;
    colors: ("Other" | "Red" | "Green" | "Blue" | "Purple" | "Black" | "Yellow")[];
    cardType: "Other" | "Leader" | "Character" | "Event" | "Stage" | "Don";
    condition: "Mint" | "Near Mint" | "Lightly Played" | "Moderately Played" | "Heavily Played" | "Damaged";
    finish: "Other" | "Regular" | "Foil" | "Parallel" | "Alternate Art" | "Manga" | "Promo";
    name: string;
    setName: string;
    quantity: number;
    language: "English" | "Japanese" | "Chinese" | "French" | "Other";
    tags: string[];
    grader?: "Other" | "PSA" | "BGS" | undefined;
    grade?: string | undefined;
    setCode?: string | undefined;
    storageLocation?: string | undefined;
    notes?: string | undefined;
    source?: {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    } | undefined;
} | {
    kind: "pack";
    name: string;
    setName: string;
    quantity: number;
    language: "English" | "Japanese" | "Chinese" | "French" | "Other";
    tags: string[];
    isSealed: boolean;
    setCode?: string | undefined;
    storageLocation?: string | undefined;
    notes?: string | undefined;
    source?: {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    } | undefined;
    productCode?: string | undefined;
    packVariant?: string | undefined;
} | {
    kind: "box";
    name: string;
    setName: string;
    quantity: number;
    language: "English" | "Japanese" | "Chinese" | "French" | "Other";
    tags: string[];
    isSealed: boolean;
    boxType: "Other" | "Booster Box" | "Display" | "Starter Deck" | "Gift Collection" | "Case";
    setCode?: string | undefined;
    storageLocation?: string | undefined;
    notes?: string | undefined;
    source?: {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    } | undefined;
    productCode?: string | undefined;
    packsPerBox?: number | undefined;
}, {
    isGraded: boolean;
    kind: "card";
    collectionId: string;
    cardNumber: string;
    rarity: string;
    colors: ("Other" | "Red" | "Green" | "Blue" | "Purple" | "Black" | "Yellow")[];
    cardType: "Other" | "Leader" | "Character" | "Event" | "Stage" | "Don";
    condition: "Mint" | "Near Mint" | "Lightly Played" | "Moderately Played" | "Heavily Played" | "Damaged";
    finish: "Other" | "Regular" | "Foil" | "Parallel" | "Alternate Art" | "Manga" | "Promo";
    name: string;
    setName: string;
    quantity: number;
    language: "English" | "Japanese" | "Chinese" | "French" | "Other";
    grader?: "Other" | "PSA" | "BGS" | undefined;
    grade?: string | undefined;
    setCode?: string | undefined;
    storageLocation?: string | undefined;
    tags?: string[] | undefined;
    notes?: string | undefined;
    source?: {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    } | undefined;
} | {
    kind: "pack";
    name: string;
    setName: string;
    quantity: number;
    language: "English" | "Japanese" | "Chinese" | "French" | "Other";
    isSealed: boolean;
    setCode?: string | undefined;
    storageLocation?: string | undefined;
    tags?: string[] | undefined;
    notes?: string | undefined;
    source?: {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    } | undefined;
    productCode?: string | undefined;
    packVariant?: string | undefined;
} | {
    kind: "box";
    name: string;
    setName: string;
    quantity: number;
    language: "English" | "Japanese" | "Chinese" | "French" | "Other";
    isSealed: boolean;
    boxType: "Other" | "Booster Box" | "Display" | "Starter Deck" | "Gift Collection" | "Case";
    setCode?: string | undefined;
    storageLocation?: string | undefined;
    tags?: string[] | undefined;
    notes?: string | undefined;
    source?: {
        provider: "tcgplayer";
        productId: number;
        url: string;
        importedAt: string;
    } | undefined;
    productCode?: string | undefined;
    packsPerBox?: number | undefined;
}>;
export type ItemKind = (typeof itemKinds)[number];
export type ItemInput = z.infer<typeof itemInputSchema>;
export type TcgplayerImportedItem = z.infer<typeof tcgplayerImportedItemSchema>;
export type CardGrading = z.infer<typeof cardGradingSchema>;
export declare const imageReferenceSchema: z.ZodObject<{
    fileId: z.ZodString;
    originalName: z.ZodString;
    mimeType: z.ZodString;
    size: z.ZodNumber;
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url: string;
    fileId: string;
    originalName: string;
    mimeType: string;
    size: number;
}, {
    url: string;
    fileId: string;
    originalName: string;
    mimeType: string;
    size: number;
}>;
export type ImageReference = z.infer<typeof imageReferenceSchema>;
export type InventoryItem = ItemInput & {
    id: string;
    image?: ImageReference;
    createdAt: string;
    updatedAt: string;
};
export type ItemSort = (typeof itemSortOptions)[number];
export interface ItemListFilters {
    search?: string;
    kind?: ItemKind | 'sealed';
    collectionId?: string;
    setCode?: string;
    language?: string;
    condition?: string;
    sealed?: boolean;
    sort?: ItemSort;
    page?: number;
    pageSize?: number;
}
export interface PaginatedItems {
    items: InventoryItem[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
    };
}
export interface CardCollection {
    id: string;
    name: string;
    cardCount: number;
    coverImageUrl?: string;
    createdAt: string;
    updatedAt: string;
}
export interface TcgplayerImportResult {
    item: TcgplayerImportedItem;
    imageUrl?: string;
    warnings: string[];
}
export interface SealedSetGroup {
    key: string;
    setName: string;
    setCode?: string;
    boxes: InventoryItem[];
    packs: InventoryItem[];
    isComplete: boolean;
}
export interface SealedSetsResponse {
    groups: SealedSetGroup[];
}
export interface ApiErrorPayload {
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}
//# sourceMappingURL=inventory.d.ts.map
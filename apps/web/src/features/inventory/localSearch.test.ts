import type { InventoryItem, SealedSetGroup } from "@one-piece-tcg/shared";
import { describe, expect, it } from "vitest";

import { filterCollectionCards, filterSealedSetGroups } from "./localSearch";

const card: InventoryItem = {
  id: "card-1",
  kind: "card",
  name: "Portgas.D.Ace",
  setName: "Legacy of the Master",
  setCode: "OP12",
  isOwned: true,
  quantity: 1,
  language: "English",
  tags: ["favorite"],
  collectionId: "collection-1",
  isJapanese: false,
  cardNumber: "ST13-011",
  rarity: "SR",
  colors: ["Yellow"],
  cardType: "Character",
  condition: "Near Mint",
  finish: "Alternate Art",
  isGraded: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("local inventory search", () => {
  it("filters a fetched card list without another API shape", () => {
    expect(filterCollectionCards([card], "st13")).toEqual([card]);
    expect(filterCollectionCards([card], "blue")).toEqual([]);
  });

  it("matches sealed groups by set and product details", () => {
    const pack: InventoryItem = {
      id: "pack-1",
      kind: "pack",
      name: "Legacy Booster Pack",
      setName: "Legacy of the Master",
      setCode: "OP12",
      isOwned: true,
      quantity: 1,
      language: "English",
      tags: [],
      productCode: "OP12",
      isSealed: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const group: SealedSetGroup = {
      key: "op12",
      setName: "Legacy of the Master",
      setCode: "OP12",
      boxes: [],
      packs: [pack],
      isComplete: false,
    };

    expect(filterSealedSetGroups([group], "legacy")).toEqual([group]);
    expect(filterSealedSetGroups([group], "OP12")).toEqual([group]);
    expect(filterSealedSetGroups([group], "romance")).toEqual([]);
  });
});

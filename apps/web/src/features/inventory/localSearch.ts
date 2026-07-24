import type { InventoryItem, SealedSetGroup } from '@one-piece-tcg/shared';

function normalized(value: string | undefined): string {
  return value?.trim().toLocaleLowerCase() ?? '';
}

function matches(values: Array<string | undefined>, search: string): boolean {
  const query = normalized(search);
  if (!query) return true;
  return values.some((value) => normalized(value).includes(query));
}

export function filterCollectionCards(items: InventoryItem[], search: string): InventoryItem[] {
  return items.filter(
    (item) =>
      item.kind === 'card' &&
      matches(
        [
          item.name,
          item.setName,
          item.setCode,
          item.cardNumber,
          item.rarity,
          item.cardType,
          item.finish,
          item.condition,
          ...item.colors,
          ...item.tags,
        ],
        search,
      ),
  );
}

export function filterSealedSetGroups(groups: SealedSetGroup[], search: string): SealedSetGroup[] {
  return groups.filter((group) =>
    matches(
      [
        group.setName,
        group.setCode,
        ...group.boxes.flatMap((item) =>
          item.kind === 'box' ? [item.name, item.productCode, item.boxType, ...item.tags] : [],
        ),
        ...group.packs.flatMap((item) =>
          item.kind === 'pack' ? [item.name, item.productCode, item.packVariant, ...item.tags] : [],
        ),
      ],
      search,
    ),
  );
}

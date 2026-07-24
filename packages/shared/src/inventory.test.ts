import { describe, expect, it } from 'vitest';

import { itemInputSchema } from './inventory.js';

const common = {
  name: 'Monkey D. Luffy',
  setName: 'Romance Dawn',
  quantity: 1,
  language: 'English' as const,
  tags: [],
};

describe('itemInputSchema', () => {
  it('accepts a complete card', () => {
    const item = itemInputSchema.parse({
      ...common,
      kind: 'card',
      collectionId: 'collection-1',
      cardNumber: 'OP01-003',
      rarity: 'Leader',
      colors: ['Red'],
      cardType: 'Leader',
      condition: 'Near Mint',
      finish: 'Alternate Art',
      isGraded: false,
    });

    expect(item.kind).toBe('card');
  });

  it('requires grader details when a card is graded', () => {
    const result = itemInputSchema.safeParse({
      ...common,
      kind: 'card',
      collectionId: 'collection-1',
      cardNumber: 'OP01-003',
      rarity: 'Leader',
      colors: ['Red'],
      cardType: 'Leader',
      condition: 'Near Mint',
      finish: 'Alternate Art',
      isGraded: true,
    });

    expect(result.success).toBe(false);
  });

  it('accepts PSA whole grades and BGS half grades', () => {
    const baseCard = {
      ...common,
      kind: 'card' as const,
      collectionId: 'collection-1',
      cardNumber: 'OP01-003',
      rarity: 'Leader',
      colors: ['Red'] as const,
      cardType: 'Leader' as const,
      condition: 'Near Mint' as const,
      finish: 'Alternate Art' as const,
      isGraded: true,
    };

    expect(itemInputSchema.safeParse({ ...baseCard, grader: 'PSA', grade: '10' }).success).toBe(
      true,
    );
    expect(itemInputSchema.safeParse({ ...baseCard, grader: 'BGS', grade: '9.5' }).success).toBe(
      true,
    );
    expect(itemInputSchema.safeParse({ ...baseCard, grader: 'PSA', grade: '9.5' }).success).toBe(
      false,
    );
  });

  it('accepts a type-specific box input', () => {
    const item = itemInputSchema.parse({
      ...common,
      kind: 'box',
      isSealed: true,
      boxType: 'Booster Box',
      packsPerBox: 24,
    });

    expect(item).toMatchObject({
      kind: 'box',
      boxType: 'Booster Box',
      packsPerBox: 24,
    });
    expect('cardNumber' in item).toBe(false);
  });
});

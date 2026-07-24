import { describe, expect, it } from 'vitest';

import { normalizeCollectionName } from './card-collection.js';

describe('normalizeCollectionName', () => {
  it('normalizes case and repeated whitespace for uniqueness', () => {
    expect(normalizeCollectionName('  Manga   Rares  ')).toBe('manga rares');
  });
});

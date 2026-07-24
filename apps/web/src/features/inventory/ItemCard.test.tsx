import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { ItemCard } from './ItemCard';

describe('ItemCard', () => {
  it('shows the identifying card information', () => {
    render(
      <MemoryRouter>
        <ItemCard
          item={{
            id: 'item-1',
            kind: 'card',
            name: 'Nami',
            setName: 'Romance Dawn',
            setCode: 'OP01',
            quantity: 2,
            language: 'English',
            tags: [],
            collectionId: 'collection-1',
            cardNumber: 'OP01-016',
            rarity: 'Rare',
            colors: ['Red'],
            cardType: 'Character',
            condition: 'Near Mint',
            finish: 'Foil',
            isGraded: false,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Nami')).toBeInTheDocument();
    expect(screen.getByText('OP01-016')).toBeInTheDocument();
    expect(screen.queryByText('Qty 2')).not.toBeInTheDocument();
  });

  it('shows the grading company and grade for a graded card', () => {
    render(
      <MemoryRouter>
        <ItemCard
          item={{
            id: 'item-2',
            kind: 'card',
            name: 'Portgas.D.Ace',
            setName: 'Legacy of the Master',
            setCode: 'OP12',
            quantity: 1,
            language: 'English',
            tags: [],
            collectionId: 'collection-1',
            cardNumber: 'ST13-011',
            rarity: 'SR',
            colors: ['Yellow'],
            cardType: 'Character',
            condition: 'Near Mint',
            finish: 'Alternate Art',
            isGraded: true,
            grader: 'PSA',
            grade: '10',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('PSA 10')).toBeInTheDocument();
  });
});

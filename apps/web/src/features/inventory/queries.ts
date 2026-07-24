import type { ItemListFilters } from '@one-piece-tcg/shared';
import { useQuery } from '@tanstack/react-query';

import {
  getCollection,
  getCollectionCards,
  getCollections,
  getItem,
  getItems,
  getSealedSets,
} from '../../api/collection';

export const collectionQueryKeys = {
  all: ['collection'] as const,
  items: (filters: ItemListFilters) => [...collectionQueryKeys.all, 'items', filters] as const,
  item: (itemId: string) => [...collectionQueryKeys.all, 'item', itemId] as const,
  collections: () => [...collectionQueryKeys.all, 'card-collections'] as const,
  cardCollection: (collectionId: string) =>
    [...collectionQueryKeys.collections(), collectionId] as const,
  collectionCards: (collectionId: string) =>
    [...collectionQueryKeys.cardCollection(collectionId), 'cards'] as const,
  sealedSets: () => [...collectionQueryKeys.all, 'sealed-sets'] as const,
};

export function useItems(filters: ItemListFilters) {
  return useQuery({
    queryKey: collectionQueryKeys.items(filters),
    queryFn: () => getItems(filters),
  });
}

export function useItem(itemId: string | undefined) {
  return useQuery({
    queryKey: collectionQueryKeys.item(itemId ?? ''),
    queryFn: () => getItem(itemId ?? ''),
    enabled: Boolean(itemId),
  });
}

export function useCollections() {
  return useQuery({
    queryKey: collectionQueryKeys.collections(),
    queryFn: getCollections,
  });
}

export function useCardCollection(collectionId: string | undefined) {
  return useQuery({
    queryKey: collectionQueryKeys.cardCollection(collectionId ?? ''),
    queryFn: () => getCollection(collectionId ?? ''),
    enabled: Boolean(collectionId),
  });
}

export function useCollectionCards(collectionId: string | undefined) {
  return useQuery({
    queryKey: collectionQueryKeys.collectionCards(collectionId ?? ''),
    queryFn: () => getCollectionCards(collectionId ?? ''),
    enabled: Boolean(collectionId),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
}

export function useSealedSets() {
  return useQuery({
    queryKey: collectionQueryKeys.sealedSets(),
    queryFn: getSealedSets,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
}

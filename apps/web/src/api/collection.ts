import type {
  CardGrading,
  CardCollection,
  InventoryItem,
  ItemInput,
  ItemListFilters,
  PaginatedItems,
  SealedSetsResponse,
  TcgplayerImportResult,
} from '@one-piece-tcg/shared';

import { apiRequest } from './client';

function appendIfPresent(
  searchParams: URLSearchParams,
  key: string,
  value: string | number | boolean | undefined,
): void {
  if (value !== undefined && value !== '') {
    searchParams.set(key, String(value));
  }
}

export async function getItems(filters: ItemListFilters): Promise<PaginatedItems> {
  const searchParams = new URLSearchParams();
  appendIfPresent(searchParams, 'search', filters.search);
  appendIfPresent(searchParams, 'kind', filters.kind);
  appendIfPresent(searchParams, 'collectionId', filters.collectionId);
  appendIfPresent(searchParams, 'setCode', filters.setCode);
  appendIfPresent(searchParams, 'language', filters.language);
  appendIfPresent(searchParams, 'condition', filters.condition);
  appendIfPresent(searchParams, 'sealed', filters.sealed);
  appendIfPresent(searchParams, 'sort', filters.sort);
  appendIfPresent(searchParams, 'page', filters.page);
  appendIfPresent(searchParams, 'pageSize', filters.pageSize);

  return apiRequest<PaginatedItems>(`/api/items?${searchParams.toString()}`);
}

export async function getItem(itemId: string): Promise<InventoryItem> {
  const response = await apiRequest<{ item: InventoryItem }>(`/api/items/${itemId}`);
  return response.item;
}

function mutationBody(
  item: ItemInput,
  image: File | undefined,
  remoteImageUrl: string | undefined,
): FormData {
  const formData = new FormData();
  formData.set('payload', JSON.stringify({ item, remoteImageUrl }));
  if (image) {
    formData.set('image', image);
  }
  return formData;
}

export async function createItem(
  item: ItemInput,
  image?: File,
  remoteImageUrl?: string,
): Promise<InventoryItem> {
  const response = await apiRequest<{ item: InventoryItem }>('/api/items', {
    method: 'POST',
    body: mutationBody(item, image, remoteImageUrl),
  });
  return response.item;
}

export async function deleteItem(itemId: string): Promise<void> {
  await apiRequest<{ deleted: true }>(`/api/items/${itemId}`, {
    method: 'DELETE',
  });
}

export async function importTcgplayerProduct(url: string): Promise<TcgplayerImportResult> {
  return apiRequest<TcgplayerImportResult>('/api/import/tcgplayer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
}

export async function getCollections(): Promise<CardCollection[]> {
  const response = await apiRequest<{ collections: CardCollection[] }>('/api/collections');
  return response.collections;
}

export async function getCollection(collectionId: string): Promise<CardCollection> {
  const response = await apiRequest<{ collection: CardCollection }>(
    `/api/collections/${collectionId}`,
  );
  return response.collection;
}

export async function getCollectionCards(collectionId: string): Promise<InventoryItem[]> {
  const response = await apiRequest<{ items: InventoryItem[] }>(
    `/api/collections/${collectionId}/cards`,
  );
  return response.items;
}

export async function createCollection(name: string): Promise<CardCollection> {
  const response = await apiRequest<{ collection: CardCollection }>('/api/collections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return response.collection;
}

export async function renameCollection(
  collectionId: string,
  name: string,
): Promise<CardCollection> {
  const response = await apiRequest<{ collection: CardCollection }>(
    `/api/collections/${collectionId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    },
  );
  return response.collection;
}

export async function deleteCollection(collectionId: string): Promise<void> {
  await apiRequest<{ deleted: true }>(`/api/collections/${collectionId}`, {
    method: 'DELETE',
  });
}

export async function moveCard(itemId: string, collectionId: string): Promise<InventoryItem> {
  const response = await apiRequest<{ item: InventoryItem }>(`/api/items/${itemId}/collection`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collectionId }),
  });
  return response.item;
}

export async function updateCardGrading(
  itemId: string,
  grading: CardGrading,
): Promise<InventoryItem> {
  const response = await apiRequest<{ item: InventoryItem }>(`/api/items/${itemId}/grading`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(grading),
  });
  return response.item;
}

export async function getSealedSets(): Promise<SealedSetsResponse> {
  return apiRequest<SealedSetsResponse>('/api/sealed-sets');
}

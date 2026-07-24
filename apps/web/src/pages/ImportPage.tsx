import ContentPasteSearchIcon from '@mui/icons-material/ContentPasteSearch';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type {
  ItemInput,
  TcgplayerImportResult,
  TcgplayerImportedItem,
} from '@one-piece-tcg/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';

import { ApiClientError } from '../api/client';
import { createItem, importTcgplayerProduct } from '../api/collection';
import { ItemImage } from '../components/ItemImage';
import { collectionQueryKeys, useCollections } from '../features/inventory/queries';
import { titleCase } from '../utils/format';

function importedDetails(item: TcgplayerImportedItem): string[] {
  if (item.kind === 'card') {
    return [item.cardNumber, item.rarity, item.cardType, item.colors.join(', '), item.finish];
  }
  if (item.kind === 'pack') {
    return [item.productCode, item.packVariant, item.isSealed ? 'Sealed' : 'Opened'].filter(
      (value): value is string => Boolean(value),
    );
  }
  return [
    item.productCode,
    item.boxType,
    item.packsPerBox ? `${item.packsPerBox} packs per box` : undefined,
    item.isSealed ? 'Sealed' : 'Opened',
  ].filter((value): value is string => Boolean(value));
}

export function ImportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const expectedKindValue = searchParams.get('expectedKind');
  const expectedKind =
    expectedKindValue === 'box' || expectedKindValue === 'pack' ? expectedKindValue : undefined;
  const expectedSetCode = searchParams.get('setCode') ?? undefined;
  const expectedSetName = searchParams.get('setName') ?? undefined;
  const collectionsQuery = useCollections();
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<TcgplayerImportResult>();
  const [collectionId, setCollectionId] = useState(searchParams.get('collectionId') ?? '');
  const [error, setError] = useState<string>();

  const lookupMutation = useMutation({
    mutationFn: importTcgplayerProduct,
    onSuccess: (importResult) => {
      setResult(importResult);
      setError(undefined);
    },
    onError: (lookupError) => {
      setResult(undefined);
      setError(
        lookupError instanceof ApiClientError
          ? lookupError.message
          : 'The TCGplayer product could not be imported.',
      );
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!result) throw new Error('No imported product');
      if (pairMismatch) {
        throw new Error('Import the matching product type and set for this missing pair.');
      }
      let item: ItemInput;
      if (result.item.kind === 'card') {
        if (!collectionId) {
          throw new Error('Choose a card collection');
        }
        item = { ...result.item, collectionId };
      } else {
        item = result.item;
      }

      return createItem(item, undefined, result.imageUrl);
    },
    onSuccess: async (savedItem) => {
      await queryClient.invalidateQueries({ queryKey: collectionQueryKeys.all });
      if (savedItem.kind === 'card') {
        navigate(`/collections/${savedItem.collectionId}`, {
          state: { notification: `${savedItem.name} was added to the collection.` },
        });
      } else {
        navigate('/sealed', {
          state: { notification: `${savedItem.name} was added to Boxes & Packs.` },
        });
      }
    },
    onError: (saveError) => {
      setError(
        saveError instanceof ApiClientError
          ? saveError.message
          : saveError instanceof Error
            ? saveError.message
            : 'The imported product could not be saved.',
      );
    },
  });

  const collections = collectionsQuery.data ?? [];
  const needsCollection = result?.item.kind === 'card';
  const pairMismatch = Boolean(
    result &&
    expectedKind &&
    (result.item.kind !== expectedKind ||
      (expectedSetCode
        ? result.item.setCode?.toLocaleLowerCase() !== expectedSetCode.toLocaleLowerCase()
        : expectedSetName
          ? result.item.setName.toLocaleLowerCase() !== expectedSetName.toLocaleLowerCase()
          : false)),
  );

  return (
    <Stack gap={3} sx={{ maxWidth: 900, mx: 'auto' }}>
      <Box>
        <Typography variant="h3">Import from TCGplayer</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          Paste a One Piece TCGplayer link. Cards go into a named collection; boxes and packs go
          directly to Boxes &amp; Packs.
        </Typography>
      </Box>

      {expectedKind ? (
        <Alert severity="info">
          Complete the pair for {expectedSetCode ?? expectedSetName ?? 'this set'} by importing a
          matching booster {expectedKind}.
        </Alert>
      ) : null}

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
            <TextField
              fullWidth
              label="TCGplayer product URL"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && url.trim()) {
                  event.preventDefault();
                  lookupMutation.mutate(url);
                }
              }}
            />
            <Button
              variant="contained"
              startIcon={<ContentPasteSearchIcon />}
              disabled={!url.trim() || lookupMutation.isPending}
              onClick={() => lookupMutation.mutate(url)}
              sx={{ minWidth: 165 }}
            >
              {lookupMutation.isPending ? 'Loading...' : 'Load product'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {result?.warnings.map((warning) => (
        <Alert key={warning} severity="warning">
          {warning}
        </Alert>
      ))}
      {pairMismatch ? (
        <Alert severity="warning">
          This product does not match the missing {expectedKind} for{' '}
          {expectedSetCode ?? expectedSetName}. Paste the matching TCGplayer link.
        </Alert>
      ) : null}

      {result ? (
        <Card sx={{ overflow: 'hidden' }}>
          <Stack direction={{ xs: 'column', md: 'row' }}>
            <Box sx={{ width: { xs: '100%', md: 360 }, flexShrink: 0 }}>
              <ItemImage src={result.imageUrl} alt={result.item.name} height={420} />
            </Box>
            <CardContent sx={{ flex: 1, p: { xs: 3, md: 4 } }}>
              <Chip label={titleCase(result.item.kind)} color="primary" variant="outlined" />
              <Typography variant="h4" sx={{ mt: 1.5 }}>
                {result.item.name}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                {result.item.setName}
                {result.item.setCode ? ` · ${result.item.setCode}` : ''}
              </Typography>

              <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 2 }}>
                {importedDetails(result.item).map((detail) => (
                  <Chip key={detail} label={detail} size="small" />
                ))}
              </Stack>

              {needsCollection ? (
                collections.length > 0 ? (
                  <FormControl fullWidth sx={{ mt: 3 }}>
                    <InputLabel>Card collection</InputLabel>
                    <Select
                      label="Card collection"
                      value={collectionId}
                      onChange={(event) => setCollectionId(event.target.value)}
                    >
                      {collections.map((collection) => (
                        <MenuItem key={collection.id} value={collection.id}>
                          {collection.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Alert severity="info" sx={{ mt: 3 }}>
                    Create a named collection before saving this card.{' '}
                    <Button component={RouterLink} to="/collections" size="small">
                      Create collection
                    </Button>
                  </Alert>
                )
              ) : null}

              <Button
                variant="contained"
                size="large"
                disabled={
                  saveMutation.isPending ||
                  collectionsQuery.isLoading ||
                  pairMismatch ||
                  (needsCollection && !collectionId)
                }
                onClick={() => saveMutation.mutate()}
                sx={{ mt: 3 }}
              >
                {saveMutation.isPending
                  ? 'Saving...'
                  : needsCollection
                    ? 'Add card to collection'
                    : 'Add to Boxes & Packs'}
              </Button>
            </CardContent>
          </Stack>
        </Card>
      ) : null}
    </Stack>
  );
}

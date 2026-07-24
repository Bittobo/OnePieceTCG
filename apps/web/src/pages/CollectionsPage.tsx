import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CardCollection } from '@one-piece-tcg/shared';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { ApiClientError } from '../api/client';
import { createCollection, deleteCollection, renameCollection } from '../api/collection';
import { ErrorState } from '../components/ErrorState';
import { ItemImage } from '../components/ItemImage';
import { LoadingState } from '../components/LoadingState';
import { collectionQueryKeys, useCollections } from '../features/inventory/queries';

interface CollectionDialogState {
  collection?: CardCollection;
  name: string;
}

export function CollectionsPage() {
  const queryClient = useQueryClient();
  const collectionsQuery = useCollections();
  const [dialog, setDialog] = useState<CollectionDialogState>();
  const [deleteTarget, setDeleteTarget] = useState<CardCollection>();
  const [error, setError] = useState<string>();

  const saveMutation = useMutation({
    mutationFn: async ({ collection, name }: CollectionDialogState) =>
      collection ? renameCollection(collection.id, name) : createCollection(name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: collectionQueryKeys.collections() });
      setDialog(undefined);
      setError(undefined);
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof ApiClientError
          ? mutationError.message
          : 'The collection could not be saved.',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (collectionId: string) => deleteCollection(collectionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: collectionQueryKeys.collections() });
      setDeleteTarget(undefined);
      setError(undefined);
    },
    onError: (mutationError) => {
      setDeleteTarget(undefined);
      setError(
        mutationError instanceof ApiClientError
          ? mutationError.message
          : 'The collection could not be deleted.',
      );
    },
  });

  if (collectionsQuery.isLoading) {
    return <LoadingState label="Loading card collections..." />;
  }
  if (collectionsQuery.isError || !collectionsQuery.data) {
    return (
      <ErrorState
        message="Card collections could not be loaded."
        onRetry={() => void collectionsQuery.refetch()}
      />
    );
  }

  return (
    <Stack gap={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        gap={2}
      >
        <Box>
          <Typography variant="h3">Card collections</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Organize imported cards into your own named collections.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ name: '' })}>
          New collection
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {collectionsQuery.data.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5">Create your first collection</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              Cards imported from TCGplayer must be assigned to a collection.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialog({ name: '' })}
              sx={{ mt: 2 }}
            >
              New collection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid2 container spacing={2}>
          {collectionsQuery.data.map((collection) => (
            <Grid2 key={collection.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card sx={{ height: '100%', overflow: 'hidden' }}>
                <ItemImage src={collection.coverImageUrl} alt={collection.name} height={210} />
                <CardContent>
                  <Typography variant="h5">{collection.name}</Typography>
                  <Stack direction="row" gap={1} sx={{ mt: 2 }} flexWrap="wrap">
                    <Button component={RouterLink} to={`/collections/${collection.id}`}>
                      Open collection
                    </Button>
                    <Button
                      startIcon={<EditIcon />}
                      onClick={() => setDialog({ collection, name: collection.name })}
                    >
                      Rename
                    </Button>
                    <Button
                      color="error"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={() => setDeleteTarget(collection)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid2>
          ))}
        </Grid2>
      )}

      <Dialog open={Boolean(dialog)} onClose={() => setDialog(undefined)} fullWidth maxWidth="xs">
        <DialogTitle>{dialog?.collection ? 'Rename collection' : 'New collection'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Collection name"
            value={dialog?.name ?? ''}
            onChange={(event) =>
              setDialog((current) => (current ? { ...current, name: event.target.value } : current))
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter' && dialog?.name.trim()) {
                event.preventDefault();
                saveMutation.mutate(dialog);
              }
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(undefined)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!dialog?.name.trim() || saveMutation.isPending}
            onClick={() => dialog && saveMutation.mutate(dialog)}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(undefined)}>
        <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
        <DialogContent>
          Only empty collections can be deleted. Move or delete any cards first.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(undefined)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

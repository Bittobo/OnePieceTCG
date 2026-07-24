import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid2,
  InputAdornment,
  Pagination,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';

import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { ItemCard } from '../features/inventory/ItemCard';
import { filterCollectionCards } from '../features/inventory/localSearch';
import { useCardCollection, useCollectionCards } from '../features/inventory/queries';

export function CollectionPage() {
  const { collectionId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const page = Number(searchParams.get('page') ?? 1);
  const collectionQuery = useCardCollection(collectionId);
  const cardsQuery = useCollectionCards(collectionId);
  const filteredCards = useMemo(
    () => filterCollectionCards(cardsQuery.data ?? [], search),
    [cardsQuery.data, search],
  );
  const pageSize = 24;
  const totalPages = Math.ceil(filteredCards.length / pageSize);
  const effectivePage = Math.min(page, Math.max(totalPages, 1));
  const displayedCards = filteredCards.slice(
    (effectivePage - 1) * pageSize,
    effectivePage * pageSize,
  );

  if (collectionQuery.isLoading || cardsQuery.isLoading) {
    return <LoadingState label="Opening collection..." />;
  }
  if (collectionQuery.isError || cardsQuery.isError || !collectionQuery.data || !cardsQuery.data) {
    return <ErrorState message="This card collection could not be loaded." />;
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
          <Typography variant="h3">{collectionQuery.data.name}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Cards imported into this collection.
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          to={`/import?collectionId=${collectionQuery.data.id}`}
          variant="contained"
          startIcon={<AddIcon />}
        >
          Import card
        </Button>
      </Stack>

      <TextField
        label="Search this collection"
        value={search}
        onChange={(event) => {
          const next = new URLSearchParams(searchParams);
          if (event.target.value) next.set('search', event.target.value);
          else next.delete('search');
          next.delete('page');
          setSearchParams(next);
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
        sx={{ maxWidth: 520 }}
      />

      {filteredCards.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5">
              {search ? 'No cards match this search' : 'This collection is empty'}
            </Typography>
            {!search ? (
              <Button
                component={RouterLink}
                to={`/import?collectionId=${collectionQuery.data.id}`}
                variant="contained"
                sx={{ mt: 2 }}
              >
                Import the first card
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Grid2 container spacing={2}>
          {displayedCards.map((item) => (
            <Grid2 key={item.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <ItemCard item={item} />
            </Grid2>
          ))}
        </Grid2>
      )}

      {totalPages > 1 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
          <Pagination
            page={effectivePage}
            count={totalPages}
            color="primary"
            onChange={(_event, nextPage) => {
              const next = new URLSearchParams(searchParams);
              next.set('page', String(nextPage));
              setSearchParams(next);
            }}
          />
        </Box>
      ) : null}
    </Stack>
  );
}

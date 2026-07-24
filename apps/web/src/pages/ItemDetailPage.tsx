import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid2,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bgsGrades, gradingCompanies, psaGrades, type CardGrading } from '@one-piece-tcg/shared';
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ApiClientError } from '../api/client';
import { deleteItem, moveCard, updateCardGrading } from '../api/collection';
import { ErrorState } from '../components/ErrorState';
import { GradingBadge } from '../components/GradingBadge';
import { ItemImage } from '../components/ItemImage';
import { LoadingState } from '../components/LoadingState';
import { collectionQueryKeys, useCollections, useItem } from '../features/inventory/queries';
import { formatDate, titleCase } from '../utils/format';

function Detail({ label, value }: { label: string; value: ReactNode }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" textTransform="uppercase">
        {label}
      </Typography>
      <Typography sx={{ mt: 0.25 }}>{value}</Typography>
    </Box>
  );
}

function CardGradingEditor({
  itemId,
  initialGrading,
}: {
  itemId: string;
  initialGrading: CardGrading;
}) {
  const queryClient = useQueryClient();
  const [isGraded, setIsGraded] = useState(initialGrading.isGraded);
  const [grader, setGrader] = useState<NonNullable<CardGrading['grader']>>(
    initialGrading.grader ?? 'PSA',
  );
  const [grade, setGrade] = useState(initialGrading.grade ?? '');
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    setIsGraded(initialGrading.isGraded);
    setGrader(initialGrading.grader ?? 'PSA');
    setGrade(initialGrading.grade ?? '');
  }, [initialGrading.grade, initialGrading.grader, initialGrading.isGraded]);

  const mutation = useMutation({
    mutationFn: () =>
      updateCardGrading(itemId, {
        isGraded,
        grader: isGraded ? grader : undefined,
        grade: isGraded ? grade : undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: collectionQueryKeys.all });
      setMessage(isGraded ? 'Grading details saved.' : 'Card marked as ungraded.');
      setError(undefined);
    },
    onError: (mutationError) => {
      setMessage(undefined);
      setError(
        mutationError instanceof ApiClientError
          ? mutationError.message
          : 'Grading details could not be saved.',
      );
    },
  });
  const gradeOptions = grader === 'PSA' ? psaGrades : bgsGrades;

  return (
    <Box
      sx={{
        mt: 3,
        p: 2.5,
        border: 1,
        borderColor: isGraded ? 'success.main' : 'divider',
        borderRadius: 2,
        bgcolor: isGraded ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
      }}
    >
      <Typography variant="h6">Grading</Typography>
      <FormControlLabel
        control={
          <Switch
            checked={isGraded}
            onChange={(_event, checked) => {
              setIsGraded(checked);
              setMessage(undefined);
              setError(undefined);
            }}
          />
        }
        label={isGraded ? 'This card is graded' : 'This card is not graded'}
        sx={{ mt: 0.5 }}
      />

      {isGraded ? (
        <Stack gap={2} sx={{ mt: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
            <FormControl fullWidth>
              <InputLabel>Grading company</InputLabel>
              <Select
                label="Grading company"
                value={grader}
                onChange={(event) => {
                  const company =
                    gradingCompanies.find((option) => option === event.target.value) ?? 'Other';
                  setGrader(company);
                  setGrade('');
                }}
              >
                {gradingCompanies.map((company) => (
                  <MenuItem key={company} value={company}>
                    {company}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {grader === 'Other' ? (
              <TextField
                fullWidth
                label="Grade"
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
              />
            ) : (
              <FormControl fullWidth>
                <InputLabel>Grade</InputLabel>
                <Select
                  label="Grade"
                  value={grade}
                  onChange={(event) => setGrade(event.target.value)}
                >
                  {gradeOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
          {grade ? <GradingBadge grader={grader} grade={grade} /> : null}
        </Stack>
      ) : null}

      {message ? (
        <Alert severity="success" sx={{ mt: 2 }}>
          {message}
        </Alert>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Button
        variant="contained"
        disabled={mutation.isPending || (isGraded && !grade.trim())}
        onClick={() => mutation.mutate()}
        sx={{ mt: 2 }}
      >
        {mutation.isPending ? 'Saving...' : 'Save grading'}
      </Button>
    </Box>
  );
}

export function ItemDetailPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const itemQuery = useItem(itemId);
  const collectionsQuery = useCollections();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string>();

  const deleteMutation = useMutation({
    mutationFn: () => deleteItem(itemId ?? ''),
    onSuccess: async () => {
      const item = itemQuery.data;
      await queryClient.invalidateQueries({ queryKey: collectionQueryKeys.all });
      navigate(item?.kind === 'card' ? `/collections/${item.collectionId}` : '/sealed', {
        state: { notification: 'Item deleted.' },
      });
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof ApiClientError
          ? mutationError.message
          : 'The item could not be deleted.',
      );
      setConfirmDelete(false);
    },
  });

  const moveMutation = useMutation({
    mutationFn: (collectionId: string) => moveCard(itemId ?? '', collectionId),
    onSuccess: async (updatedItem) => {
      await queryClient.invalidateQueries({ queryKey: collectionQueryKeys.all });
      navigate(`/collections/${updatedItem.kind === 'card' ? updatedItem.collectionId : ''}`, {
        state: { notification: `${updatedItem.name} was moved.` },
      });
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof ApiClientError
          ? mutationError.message
          : 'The card could not be moved.',
      );
    },
  });

  if (itemQuery.isLoading) return <LoadingState label="Opening item..." />;
  if (itemQuery.isError || !itemQuery.data) {
    return <ErrorState message="This item could not be found." />;
  }

  const item = itemQuery.data;

  return (
    <Stack gap={3}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        gap={2}
      >
        <Box>
          <Chip label={titleCase(item.kind)} color="primary" variant="outlined" />
          <Typography variant="h3" sx={{ mt: 1 }}>
            {item.name}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {item.setName}
            {item.setCode ? ` · ${item.setCode}` : ''}
          </Typography>
        </Box>
        <Button
          color="error"
          variant="outlined"
          startIcon={<DeleteIcon />}
          onClick={() => setConfirmDelete(true)}
        >
          Delete
        </Button>
      </Stack>

      <Grid2 container spacing={3}>
        <Grid2 size={{ xs: 12, md: 5, lg: 4 }}>
          <Card sx={{ overflow: 'hidden' }}>
            <ItemImage src={item.image?.url} alt={item.name} height={{ xs: 380, md: 520 }} />
          </Card>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 7, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h5">Product details</Typography>
              <Grid2 container spacing={3} sx={{ mt: 0.5 }}>
                <Grid2 size={{ xs: 6, sm: 4 }}>
                  <Detail label="Language" value={item.language} />
                </Grid2>

                {item.kind === 'card' ? (
                  <>
                    <Grid2 size={{ xs: 6, sm: 4 }}>
                      <Detail label="Card number" value={item.cardNumber} />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4 }}>
                      <Detail label="Rarity" value={item.rarity} />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4 }}>
                      <Detail label="Card type" value={item.cardType} />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4 }}>
                      <Detail label="Colors" value={item.colors.join(', ')} />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4 }}>
                      <Detail label="Condition" value={item.condition} />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4 }}>
                      <Detail label="Finish" value={item.finish} />
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                      <FormControl fullWidth>
                        <InputLabel>Card collection</InputLabel>
                        <Select
                          label="Card collection"
                          value={item.collectionId}
                          disabled={collectionsQuery.isLoading || moveMutation.isPending}
                          onChange={(event) => moveMutation.mutate(event.target.value)}
                        >
                          {(collectionsQuery.data ?? []).map((collection) => (
                            <MenuItem key={collection.id} value={collection.id}>
                              {collection.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                      <CardGradingEditor
                        itemId={item.id}
                        initialGrading={{
                          isGraded: item.isGraded,
                          grader: item.grader,
                          grade: item.grade,
                        }}
                      />
                    </Grid2>
                  </>
                ) : (
                  <>
                    <Grid2 size={{ xs: 6, sm: 4 }}>
                      <Detail label="Product code" value={item.productCode} />
                    </Grid2>
                    <Grid2 size={{ xs: 6, sm: 4 }}>
                      <Detail label="Status" value={item.isSealed ? 'Sealed' : 'Opened'} />
                    </Grid2>
                    {item.kind === 'pack' ? (
                      <Grid2 size={{ xs: 12, sm: 4 }}>
                        <Detail label="Pack variant" value={item.packVariant} />
                      </Grid2>
                    ) : (
                      <>
                        <Grid2 size={{ xs: 6, sm: 4 }}>
                          <Detail label="Box type" value={item.boxType} />
                        </Grid2>
                        <Grid2 size={{ xs: 6, sm: 4 }}>
                          <Detail label="Packs per box" value={item.packsPerBox} />
                        </Grid2>
                      </>
                    )}
                  </>
                )}

                <Grid2 size={{ xs: 12 }}>
                  <Detail label="Description" value={item.notes} />
                </Grid2>

                {item.source?.provider === 'tcgplayer' ? (
                  <Grid2 size={{ xs: 12 }}>
                    <Button
                      component="a"
                      href={item.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      endIcon={<OpenInNewIcon />}
                      sx={{ px: 0 }}
                    >
                      Open original TCGplayer product
                    </Button>
                  </Grid2>
                ) : null}
              </Grid2>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                Added {formatDate(item.createdAt)}
              </Typography>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Delete {item.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This removes the item and its GridFS image from MongoDB. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2,
  InputAdornment,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { InventoryItem, SealedSetGroup } from "@one-piece-tcg/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";

import { ApiClientError } from "../api/client";
import { trackMissingSealedSet } from "../api/collection";
import { ErrorState } from "../components/ErrorState";
import { ItemImage } from "../components/ItemImage";
import { LoadingState } from "../components/LoadingState";
import { filterSealedSetGroups } from "../features/inventory/localSearch";
import {
  collectionQueryKeys,
  useSealedSets,
} from "../features/inventory/queries";

function missingImportUrl(
  group: SealedSetGroup,
  expectedKind: "box" | "pack",
): string {
  const params = new URLSearchParams({
    expectedKind,
    setName: group.setName,
  });
  if (group.setCode) params.set("setCode", group.setCode);
  return `/import?${params.toString()}`;
}

function CompactProduct({ item }: { item: InventoryItem }) {
  return (
    <Card variant="outlined" sx={{ overflow: "hidden" }}>
      <CardActionArea component={RouterLink} to={`/items/${item.id}`}>
        <ItemImage src={item.image?.url} alt={item.name} height={132} />
        <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
          <Chip
            size="small"
            label={item.kind === "box" ? "Box" : "Pack"}
            color={item.kind === "box" ? "secondary" : "primary"}
            variant="outlined"
          />
          <Typography
            variant="subtitle2"
            sx={{
              mt: 0.75,
              minHeight: 40,
              lineHeight: 1.25,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.name}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function MissingHalf({
  group,
  expectedKind,
  trackedItem,
}: {
  group: SealedSetGroup;
  expectedKind: "box" | "pack";
  trackedItem?: InventoryItem;
}) {
  const label = expectedKind === "box" ? "Box" : "Pack";

  return (
    <Card
      variant="outlined"
      sx={{
        minHeight: 217,
        height: "100%",
        borderStyle: "dashed",
        borderWidth: 2,
        borderColor: "error.main",
        bgcolor: "rgba(127, 29, 29, 0.22)",
      }}
    >
      <CardContent
        sx={{
          height: "100%",
          p: 1.25,
          "&:last-child": { pb: 1.25 },
          display: "grid",
          placeItems: "center",
        }}
      >
        <Stack alignItems="center" textAlign="center" gap={0.75}>
          <Box sx={{ position: "relative", width: 78 }}>
            <Skeleton
              variant="rounded"
              width={78}
              height={98}
              animation="wave"
            />
            <Inventory2OutlinedIcon
              sx={{
                position: "absolute",
                inset: 0,
                m: "auto",
                fontSize: 34,
                color: "error.light",
              }}
            />
          </Box>
          <Chip label={`Missing ${label}`} size="small" color="error" />
          {trackedItem ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                maxWidth: 120,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {trackedItem.name}
            </Typography>
          ) : null}
          <Button
            component={RouterLink}
            to={
              trackedItem
                ? `/items/${trackedItem.id}`
                : missingImportUrl(group, expectedKind)
            }
            size="small"
            startIcon={<AddIcon />}
            color="error"
          >
            {trackedItem ? "View" : "Add"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SealedHalf({
  title,
  kind,
  items,
  group,
}: {
  title: string;
  kind: "box" | "pack";
  items: InventoryItem[];
  group: SealedSetGroup;
}) {
  const ownedItems = items.filter((item) => item.isOwned);
  const trackedMissingItems = items.filter((item) => !item.isOwned);

  return (
    <Stack gap={0.75} sx={{ height: "100%" }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700}>
        {title}
      </Typography>
      {ownedItems.length === 0 && trackedMissingItems.length === 0 ? (
        <MissingHalf group={group} expectedKind={kind} />
      ) : (
        <Stack gap={0.75}>
          {ownedItems.map((item) => (
            <CompactProduct key={item.id} item={item} />
          ))}
          {trackedMissingItems.map((item) => (
            <MissingHalf
              key={item.id}
              group={group}
              expectedKind={kind}
              trackedItem={item}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export function SealedProductsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [trackerName, setTrackerName] = useState("");
  const [trackerCode, setTrackerCode] = useState("");
  const [trackerError, setTrackerError] = useState<string>();
  const groupsQuery = useSealedSets();
  const visibleGroups = useMemo(
    () => filterSealedSetGroups(groupsQuery.data?.groups ?? [], search),
    [groupsQuery.data?.groups, search],
  );
  const trackerMutation = useMutation({
    mutationFn: () => trackMissingSealedSet(trackerName, trackerCode),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.sealedSets(),
      });
      setTrackerOpen(false);
      setTrackerName("");
      setTrackerCode("");
      setTrackerError(undefined);
    },
    onError: (error) => {
      setTrackerError(
        error instanceof ApiClientError
          ? error.message
          : "The missing set could not be saved.",
      );
    },
  });

  if (groupsQuery.isLoading) {
    return <LoadingState label="Pairing boxes and packs..." />;
  }
  if (groupsQuery.isError || !groupsQuery.data) {
    return (
      <ErrorState
        message="Boxes and packs could not be loaded."
        onRetry={() => void groupsQuery.refetch()}
      />
    );
  }

  return (
    <Stack gap={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        gap={2}
      >
        <Box>
          <Typography variant="h3">Boxes &amp; packs</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Scroll through sets in OP, EB, then PRB order. Complete pairs glow
            gold and green.
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
          <Button
            variant="outlined"
            startIcon={<PlaylistAddIcon />}
            onClick={() => setTrackerOpen(true)}
          >
            Track missing set
          </Button>
          <Button
            component={RouterLink}
            to="/import"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Import product
          </Button>
        </Stack>
      </Stack>

      <TextField
        label="Search sets"
        value={search}
        onChange={(event) => {
          const next = new URLSearchParams(searchParams);
          if (event.target.value) next.set("search", event.target.value);
          else next.delete("search");
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

      {visibleGroups.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5">
              {search
                ? "No sealed sets match this search"
                : "No boxes or packs yet"}
            </Typography>
            {!search ? (
              <Button
                component={RouterLink}
                to="/import"
                variant="contained"
                sx={{ mt: 2 }}
              >
                Import the first product
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Grid2 container spacing={2}>
          {visibleGroups.map((group) => {
            const ownsBox = group.boxes.some((item) => item.isOwned);
            const ownsPack = group.packs.some((item) => item.isOwned);
            const ownsNothing = !ownsBox && !ownsPack;

            return (
              <Grid2 key={group.key} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    borderWidth: group.isComplete || ownsNothing ? 2 : 1,
                    borderColor: group.isComplete
                      ? "#d9b84f"
                      : ownsNothing
                        ? "error.main"
                        : "warning.main",
                    background: group.isComplete
                      ? "radial-gradient(circle at 10% 0%, rgba(34,197,94,.14), transparent 35%), radial-gradient(circle at 90% 0%, rgba(250,204,21,.13), transparent 36%), #111827"
                      : ownsNothing
                        ? "radial-gradient(circle at 50% 0%, rgba(239,68,68,.18), transparent 42%), #111827"
                        : undefined,
                    boxShadow: group.isComplete
                      ? "0 0 0 1px rgba(217,184,79,.22), 0 0 22px rgba(34,197,94,.14)"
                      : ownsNothing
                        ? "0 0 20px rgba(239,68,68,.16)"
                        : undefined,
                  }}
                >
                  <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
                    <Stack
                      direction="row"
                      alignItems="flex-start"
                      justifyContent="space-between"
                      gap={1}
                      sx={{ mb: 1.25, minHeight: 55 }}
                    >
                      <Box>
                        <Typography variant="h6" sx={{ lineHeight: 1.15 }}>
                          {group.setName}
                        </Typography>
                        {group.setCode ? (
                          <Typography variant="body2" color="text.secondary">
                            {group.setCode}
                          </Typography>
                        ) : null}
                      </Box>
                      {group.isComplete ? (
                        <CheckCircleIcon
                          color="success"
                          titleAccess="Box and pack complete"
                        />
                      ) : ownsNothing ? (
                        <Chip
                          label="Nothing owned"
                          size="small"
                          color="error"
                        />
                      ) : (
                        <Chip
                          label="Pair incomplete"
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                    </Stack>

                    <Grid2 container spacing={1}>
                      <Grid2 size={6}>
                        <SealedHalf
                          title="BOOSTER BOX"
                          kind="box"
                          items={group.boxes}
                          group={group}
                        />
                      </Grid2>
                      <Grid2 size={6}>
                        <SealedHalf
                          title="BOOSTER PACK"
                          kind="pack"
                          items={group.packs}
                          group={group}
                        />
                      </Grid2>
                    </Grid2>
                  </CardContent>
                </Card>
              </Grid2>
            );
          })}
        </Grid2>
      )}

      <Dialog
        open={trackerOpen}
        onClose={() => setTrackerOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Track a missing set</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            The set will appear with red Box and Pack skeletons and no product
            records.
          </Typography>
          <Stack gap={2}>
            <TextField
              autoFocus
              label="Set code"
              placeholder="EB-01"
              value={trackerCode}
              onChange={(event) =>
                setTrackerCode(event.target.value.toUpperCase())
              }
            />
            <TextField
              label="Set name"
              placeholder="Extra Booster: Memorial Collection"
              value={trackerName}
              onChange={(event) => setTrackerName(event.target.value)}
            />
            {trackerError ? (
              <Alert severity="error">{trackerError}</Alert>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrackerOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={
              !trackerCode.trim() ||
              !trackerName.trim() ||
              trackerMutation.isPending
            }
            onClick={() => trackerMutation.mutate()}
          >
            {trackerMutation.isPending ? "Saving..." : "Track as missing"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

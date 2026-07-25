import ContentPasteSearchIcon from "@mui/icons-material/ContentPasteSearch";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
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
} from "@mui/material";
import {
  bgsGrades,
  gradingCompanies,
  psaGrades,
  type ItemInput,
  type TcgplayerCardSearchResponse,
  type TcgplayerImportResult,
  type TcgplayerImportedItem,
} from "@one-piece-tcg/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Link as RouterLink,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { ApiClientError } from "../api/client";
import {
  createItem,
  importTcgplayerProduct,
  searchTcgplayerCards,
} from "../api/collection";
import { GradingBadge } from "../components/GradingBadge";
import { ItemImage } from "../components/ItemImage";
import {
  collectionQueryKeys,
  useCollections,
} from "../features/inventory/queries";
import { titleCase } from "../utils/format";

function importedDetails(item: TcgplayerImportedItem): string[] {
  if (item.kind === "card") {
    return [
      item.cardNumber,
      item.rarity,
      item.cardType,
      item.colors.join(", "),
      item.finish,
    ];
  }
  if (item.kind === "pack") {
    return [
      item.productCode,
      item.packVariant,
      item.isSealed ? "Sealed" : "Opened",
    ].filter((value): value is string => Boolean(value));
  }
  return [
    item.productCode,
    item.boxType,
    item.packsPerBox ? `${item.packsPerBox} packs per box` : undefined,
    item.isSealed ? "Sealed" : "Opened",
  ].filter((value): value is string => Boolean(value));
}

function normalizedSetCode(value: string | undefined): string {
  return (
    value
      ?.trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "") ?? ""
  );
}

export function ImportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const expectedKindValue = searchParams.get("expectedKind");
  const expectedKind =
    expectedKindValue === "box" || expectedKindValue === "pack"
      ? expectedKindValue
      : undefined;
  const expectedSetCode = searchParams.get("setCode") ?? undefined;
  const expectedSetName = searchParams.get("setName") ?? undefined;
  const collectionsQuery = useCollections();
  const [url, setUrl] = useState("");
  const [cardCode, setCardCode] = useState("");
  const [cardSearch, setCardSearch] = useState<TcgplayerCardSearchResponse>();
  const [result, setResult] = useState<TcgplayerImportResult>();
  const [collectionId, setCollectionId] = useState(
    searchParams.get("collectionId") ?? "",
  );
  const [isOwned, setIsOwned] = useState(true);
  const [isJapanese, setIsJapanese] = useState(false);
  const [isGraded, setIsGraded] = useState(false);
  const [grader, setGrader] =
    useState<(typeof gradingCompanies)[number]>("PSA");
  const [grade, setGrade] = useState("");
  const [error, setError] = useState<string>();

  const selectResult = (importResult: TcgplayerImportResult) => {
    setResult(importResult);
    setError(undefined);
    setIsOwned(importResult.item.isOwned);
    if (importResult.item.kind === "card") {
      setIsJapanese(importResult.item.isJapanese);
      setIsGraded(importResult.item.isGraded);
      setGrader(importResult.item.grader ?? "PSA");
      setGrade(importResult.item.grade ?? "");
    } else {
      setIsJapanese(false);
      setIsGraded(false);
      setGrader("PSA");
      setGrade("");
    }
  };

  const lookupMutation = useMutation({
    mutationFn: importTcgplayerProduct,
    onSuccess: (importResult) => {
      setCardSearch(undefined);
      selectResult(importResult);
    },
    onError: (lookupError) => {
      setResult(undefined);
      setError(
        lookupError instanceof ApiClientError
          ? lookupError.message
          : "The TCGplayer product could not be imported.",
      );
    },
  });

  const cardSearchMutation = useMutation({
    mutationFn: searchTcgplayerCards,
    onSuccess: (response) => {
      setCardSearch(response);
      setResult(undefined);
      setError(undefined);
    },
    onError: (searchError) => {
      setCardSearch(undefined);
      setResult(undefined);
      setError(
        searchError instanceof ApiClientError
          ? searchError.message
          : "The card code could not be searched.",
      );
    },
  });

  const pairMismatch = Boolean(
    result &&
    expectedKind &&
    (result.item.kind !== expectedKind ||
      (expectedSetCode
        ? normalizedSetCode(result.item.setCode) !==
          normalizedSetCode(expectedSetCode)
        : expectedSetName
          ? result.item.setName.toLocaleLowerCase() !==
            expectedSetName.toLocaleLowerCase()
          : false)),
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!result) throw new Error("Choose a TCGplayer product first");
      if (pairMismatch) {
        throw new Error(
          "Import the matching product type and set for this missing pair.",
        );
      }

      let item: ItemInput;
      if (result.item.kind === "card") {
        if (!collectionId) {
          throw new Error("Choose a card collection");
        }
        if (isGraded && !grade) {
          throw new Error("Choose a grade");
        }
        item = {
          ...result.item,
          collectionId,
          isOwned,
          language:
            isJapanese || result.item.language !== "Japanese"
              ? isJapanese
                ? "Japanese"
                : result.item.language
              : "English",
          isJapanese,
          isGraded,
          grader: isGraded ? grader : undefined,
          grade: isGraded ? grade : undefined,
        };
      } else {
        item = { ...result.item, isOwned };
      }

      return createItem(item, undefined, result.imageUrl);
    },
    onSuccess: async (savedItem) => {
      await queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.all,
      });
      if (savedItem.kind === "card") {
        navigate(`/collections/${savedItem.collectionId}`, {
          state: {
            notification: `${savedItem.name} was added to the collection.`,
          },
        });
      } else {
        navigate("/sealed", {
          state: {
            notification: `${savedItem.name} was added to Boxes & Packs.`,
          },
        });
      }
    },
    onError: (saveError) => {
      setError(
        saveError instanceof ApiClientError
          ? saveError.message
          : saveError instanceof Error
            ? saveError.message
            : "The imported product could not be saved.",
      );
    },
  });

  const collections = collectionsQuery.data ?? [];
  const needsCollection = result?.item.kind === "card";
  const gradeOptions = grader === "PSA" ? psaGrades : bgsGrades;

  return (
    <Stack gap={3} sx={{ maxWidth: 1000, mx: "auto" }}>
      <Box>
        <Typography variant="h3">Import from TCGplayer</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          Search cards by exact code and choose a printing, or paste a TCGplayer
          product link.
        </Typography>
      </Box>

      {expectedKind ? (
        <Alert severity="info">
          Complete the pair for{" "}
          {expectedSetCode ?? expectedSetName ?? "this set"} by importing a
          matching booster {expectedKind}.
        </Alert>
      ) : null}

      {cardSearch?.warnings.map((warning) => (
        <Alert key={warning} severity="warning">
          {warning}
        </Alert>
      ))}

      {!expectedKind ? (
        <Card>
          <CardContent>
            <Typography variant="h5">Find a card by code</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Example: OP12-091. All matching base, release-event, and related
              printings are shown.
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              gap={1.5}
              sx={{ mt: 2 }}
            >
              <TextField
                fullWidth
                label="Card code"
                placeholder="OP12-091"
                value={cardCode}
                onChange={(event) =>
                  setCardCode(event.target.value.toUpperCase())
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" && cardCode.trim()) {
                    event.preventDefault();
                    cardSearchMutation.mutate(cardCode);
                  }
                }}
              />
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                disabled={!cardCode.trim() || cardSearchMutation.isPending}
                onClick={() => cardSearchMutation.mutate(cardCode)}
                sx={{ minWidth: 160 }}
              >
                {cardSearchMutation.isPending ? "Searching..." : "Search cards"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      {cardSearch ? (
        cardSearch.results.length === 0 ? (
          <Alert severity="info">
            No One Piece cards were found for {cardSearch.code}.
          </Alert>
        ) : (
          <Box>
            <Typography variant="h5">
              Choose a printing ({cardSearch.results.length} found)
            </Typography>
            <Grid2 container spacing={2} sx={{ mt: 0.5 }}>
              {cardSearch.results.map((candidate) => {
                const productId = candidate.item.source?.productId ?? 0;
                const selected = result?.item.source?.productId === productId;
                return (
                  <Grid2 key={productId} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: "100%",
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected ? "primary.main" : "divider",
                      }}
                    >
                      <ItemImage
                        src={candidate.imageUrl}
                        alt={candidate.item.name}
                        height={230}
                      />
                      <CardContent>
                        <Typography variant="h6">
                          {candidate.item.name}
                        </Typography>
                        <Typography color="text.secondary">
                          {candidate.item.setName}
                        </Typography>
                        <Stack
                          direction="row"
                          gap={0.75}
                          flexWrap="wrap"
                          sx={{ mt: 1 }}
                        >
                          {importedDetails(candidate.item).map(
                            (detail, index) => (
                              <Chip
                                key={`${index}-${detail}`}
                                label={detail}
                                size="small"
                              />
                            ),
                          )}
                        </Stack>
                        <Button
                          fullWidth
                          variant={selected ? "contained" : "outlined"}
                          onClick={() => selectResult(candidate)}
                          sx={{ mt: 2 }}
                        >
                          {selected ? "Selected" : "Choose this card"}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid2>
                );
              })}
            </Grid2>
          </Box>
        )
      ) : null}

      <Divider>OR USE A PRODUCT LINK</Divider>

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1.5}>
            <TextField
              fullWidth
              label="TCGplayer product URL"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && url.trim()) {
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
              {lookupMutation.isPending ? "Loading..." : "Load product"}
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
          This product does not match the missing {expectedKind} for{" "}
          {expectedSetCode ?? expectedSetName}. Paste the matching TCGplayer
          link.
        </Alert>
      ) : null}

      {result ? (
        <Card sx={{ overflow: "hidden" }}>
          <Stack direction={{ xs: "column", md: "row" }}>
            <Box sx={{ width: { xs: "100%", md: 340 }, flexShrink: 0 }}>
              <ItemImage
                src={result.imageUrl}
                alt={result.item.name}
                height={420}
              />
            </Box>
            <CardContent sx={{ flex: 1, p: { xs: 3, md: 4 } }}>
              <Chip
                label={titleCase(result.item.kind)}
                color="primary"
                variant="outlined"
              />
              <Typography variant="h4" sx={{ mt: 1.5 }}>
                {result.item.name}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                {result.item.setName}
                {result.item.setCode ? ` · ${result.item.setCode}` : ""}
              </Typography>

              <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 2 }}>
                {importedDetails(result.item).map((detail, index) => (
                  <Chip
                    key={`${index}-${detail}`}
                    label={detail}
                    size="small"
                  />
                ))}
              </Stack>

              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  border: 1,
                  borderColor: isOwned ? "success.main" : "error.main",
                  borderRadius: 2,
                  bgcolor: isOwned
                    ? "rgba(34, 197, 94, 0.05)"
                    : "rgba(239, 68, 68, 0.08)",
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={isOwned}
                      color={isOwned ? "success" : "error"}
                      onChange={(_event, checked) => setIsOwned(checked)}
                    />
                  }
                  label={isOwned ? "I own this item" : "Track as missing"}
                />
                {!isOwned ? (
                  <Typography variant="body2" color="error.light">
                    This item will stay visible with a red Missing status.
                  </Typography>
                ) : null}
              </Box>

              {needsCollection ? (
                collections.length > 0 ? (
                  <Stack gap={2} sx={{ mt: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Card collection</InputLabel>
                      <Select
                        label="Card collection"
                        value={collectionId}
                        onChange={(event) =>
                          setCollectionId(event.target.value)
                        }
                      >
                        {collections.map((collection) => (
                          <MenuItem key={collection.id} value={collection.id}>
                            {collection.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={isJapanese}
                          onChange={(_event, checked) => setIsJapanese(checked)}
                        />
                      }
                      label={
                        isJapanese
                          ? "Japanese card"
                          : "English / non-Japanese card"
                      }
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={isGraded}
                          onChange={(_event, checked) => {
                            setIsGraded(checked);
                            if (!checked) setGrade("");
                          }}
                        />
                      }
                      label={isGraded ? "Graded card" : "Ungraded card"}
                    />

                    {isGraded ? (
                      <>
                        <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
                          <FormControl fullWidth>
                            <InputLabel>Grading company</InputLabel>
                            <Select
                              label="Grading company"
                              value={grader}
                              onChange={(event) => {
                                setGrader(
                                  gradingCompanies.find(
                                    (company) => company === event.target.value,
                                  ) ?? "Other",
                                );
                                setGrade("");
                              }}
                            >
                              {gradingCompanies.map((company) => (
                                <MenuItem key={company} value={company}>
                                  {company}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          {grader === "Other" ? (
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
                                onChange={(event) =>
                                  setGrade(event.target.value)
                                }
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
                        {grade ? (
                          <GradingBadge grader={grader} grade={grade} />
                        ) : null}
                      </>
                    ) : null}
                  </Stack>
                ) : (
                  <Alert severity="info" sx={{ mt: 3 }}>
                    Create a named collection before saving this card.{" "}
                    <Button
                      component={RouterLink}
                      to="/collections"
                      size="small"
                    >
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
                  (needsCollection && (!collectionId || (isGraded && !grade)))
                }
                onClick={() => saveMutation.mutate()}
                sx={{ mt: 3 }}
              >
                {saveMutation.isPending
                  ? "Saving..."
                  : !isOwned
                    ? needsCollection
                      ? "Track missing card"
                      : "Track missing product"
                    : needsCollection
                      ? "Add card to collection"
                      : "Add to Boxes & Packs"}
              </Button>
            </CardContent>
          </Stack>
        </Card>
      ) : null}
    </Stack>
  );
}

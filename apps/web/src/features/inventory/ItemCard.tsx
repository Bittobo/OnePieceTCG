import type { InventoryItem } from "@one-piece-tcg/shared";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import { GradingBadge } from "../../components/GradingBadge";
import { ItemImage } from "../../components/ItemImage";
import { titleCase } from "../../utils/format";

export function ItemCard({ item }: { item: InventoryItem }) {
  const identifier =
    item.kind === "card"
      ? item.cardNumber
      : item.productCode ||
        (item.kind === "box" ? item.boxType : "Booster pack");

  return (
    <Card
      variant={item.isOwned ? undefined : "outlined"}
      sx={{
        height: "100%",
        overflow: "hidden",
        borderWidth: item.isOwned ? undefined : 2,
        borderColor: item.isOwned ? undefined : "error.main",
        bgcolor: item.isOwned ? undefined : "rgba(127, 29, 29, 0.24)",
        boxShadow: item.isOwned
          ? undefined
          : "0 0 18px rgba(239, 68, 68, 0.16)",
      }}
    >
      <CardActionArea
        component={RouterLink}
        to={`/items/${item.id}`}
        sx={{ height: "100%", alignItems: "stretch" }}
      >
        <ItemImage src={item.image?.url} alt={item.name} height={190} />
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Chip
              label={titleCase(item.kind)}
              size="small"
              color="primary"
              variant="outlined"
            />
            {!item.isOwned ? (
              <Chip label="Missing" size="small" color="error" />
            ) : null}
            {item.kind === "card" &&
            item.isGraded &&
            item.grader &&
            item.grade ? (
              <GradingBadge grader={item.grader} grade={item.grade} compact />
            ) : null}
            {item.kind === "card" && item.isJapanese ? (
              <Chip
                label="JP"
                size="small"
                color="secondary"
                variant="outlined"
              />
            ) : null}
          </Stack>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{ mt: 1, lineHeight: 1.2 }}
          >
            {item.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {item.setName}
          </Typography>
          <Box sx={{ minHeight: 20, mt: 0.75 }}>
            <Typography variant="caption" color="text.secondary">
              {identifier}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

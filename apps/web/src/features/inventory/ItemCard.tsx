import type { InventoryItem } from '@one-piece-tcg/shared';
import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { GradingBadge } from '../../components/GradingBadge';
import { ItemImage } from '../../components/ItemImage';
import { titleCase } from '../../utils/format';

export function ItemCard({ item }: { item: InventoryItem }) {
  const identifier =
    item.kind === 'card'
      ? item.cardNumber
      : item.productCode || (item.kind === 'box' ? item.boxType : 'Booster pack');

  return (
    <Card sx={{ height: '100%', overflow: 'hidden' }}>
      <CardActionArea
        component={RouterLink}
        to={`/items/${item.id}`}
        sx={{ height: '100%', alignItems: 'stretch' }}
      >
        <ItemImage src={item.image?.url} alt={item.name} />
        <CardContent>
          <Stack direction="row" alignItems="center" gap={1}>
            <Chip label={titleCase(item.kind)} size="small" color="primary" variant="outlined" />
            {item.kind === 'card' && item.isGraded && item.grader && item.grade ? (
              <GradingBadge grader={item.grader} grade={item.grade} compact />
            ) : null}
          </Stack>
          <Typography variant="h6" sx={{ mt: 1.5, lineHeight: 1.2 }}>
            {item.name}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            {item.setName}
          </Typography>
          <Box sx={{ minHeight: 24, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {identifier}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

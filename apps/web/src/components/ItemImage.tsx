import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import { Box, type BoxProps } from '@mui/material';

import { apiUrl } from '../api/client';

export function ItemImage({
  src,
  alt,
  height = 230,
}: {
  src?: string;
  alt: string;
  height?: BoxProps['height'];
}) {
  if (src) {
    return (
      <Box
        component="img"
        src={apiUrl(src)}
        alt={alt}
        loading="lazy"
        sx={{
          display: 'block',
          width: '100%',
          height,
          objectFit: 'contain',
          bgcolor: 'grey.950',
        }}
      />
    );
  }

  return (
    <Box
      aria-label={`${alt} has no image`}
      sx={{
        height,
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(145deg, #111827, #273449)',
        color: 'primary.light',
      }}
    >
      <CollectionsBookmarkIcon sx={{ fontSize: 64, opacity: 0.7 }} />
    </Box>
  );
}

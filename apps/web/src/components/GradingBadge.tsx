import VerifiedIcon from '@mui/icons-material/Verified';
import { Box, Chip, Stack, Typography } from '@mui/material';
import type { CardGrading } from '@one-piece-tcg/shared';

const logos: Partial<Record<NonNullable<CardGrading['grader']>, string>> = {
  PSA: '/grading/psa.svg',
  BGS: '/grading/bgs.svg',
};

export function GradingBadge({
  grader,
  grade,
  compact = false,
}: {
  grader: NonNullable<CardGrading['grader']>;
  grade: string;
  compact?: boolean;
}) {
  const logo = logos[grader];

  if (compact) {
    return (
      <Chip
        size="small"
        color="success"
        variant="outlined"
        icon={
          logo ? (
            <Box
              component="img"
              src={logo}
              alt=""
              sx={{ width: 27, height: 18, objectFit: 'contain' }}
            />
          ) : (
            <VerifiedIcon />
          )
        }
        label={`${grader} ${grade}`}
      />
    );
  }

  return (
    <Stack direction="row" gap={1.5} alignItems="center">
      {logo ? (
        <Box
          component="img"
          src={logo}
          alt={`${grader} grading badge`}
          sx={{ width: 82, height: 34, objectFit: 'contain', borderRadius: 1 }}
        />
      ) : (
        <VerifiedIcon color="success" sx={{ fontSize: 34 }} />
      )}
      <Box>
        <Typography variant="caption" color="text.secondary">
          Graded by {grader}
        </Typography>
        <Typography variant="h6">Grade {grade}</Typography>
      </Box>
    </Stack>
  );
}

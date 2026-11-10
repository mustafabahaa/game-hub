import { useId, useState } from 'react';
import { Box, Paper, Stack, Typography } from '@monochrome-ui/design-system';
import type { Game, Platform } from '@/domain/types';

const cases = {
  PlayStation: { label: 'PlayStation', shine: '#488bfb', shell: '#1753bb', rim: '#08265f', strip: '#153b84' },
  PS5: { label: 'PS5', shine: '#5795ff', shell: '#1554cc', rim: '#062a72', strip: '#f9fafc', wordmark: '/platforms/ps5.svg' },
  PS4: { label: 'PS4', shine: '#3786ef', shell: '#13469f', rim: '#082559', strip: '#123472', wordmark: '/platforms/ps4.svg' },
  Xbox: { label: 'Xbox', shine: '#70b947', shell: '#2e7b2e', rim: '#133f16', strip: '#215520' },
  PC: { label: 'PC', shine: '#68707c', shell: '#424853', rim: '#23272e', strip: '#30353e' },
};

export function GameCover({ game, platform }: { game?: Game; platform: Platform }) {
  const gradient = useId();
  const [failedUrl, setFailedUrl] = useState<string>();
  const frame = cases[platform === 'PlayStation' ? game?.coverConsole ?? platform : platform];
  const url = game?.imageUrl;

  return (
    <Box sx={{ position: 'relative', pt: 1, px: 0.75, pb: 1.25, isolation: 'isolate' }}>
      {/* The case is vector artwork. The poster and platform wordmark are separate layers. */}
      <Box component="svg" aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none"
        sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: -1 }}>
        <defs>
          <linearGradient id={gradient} x1="0" x2="1" y1="0" y2="0" gradientUnits="objectBoundingBox">
            <stop stopColor={frame.rim} />
            <stop offset=".015" stopColor={frame.shine} />
            <stop offset=".035" stopColor={frame.shell} />
            <stop offset=".95" stopColor={frame.shell} />
            <stop offset=".983" stopColor={frame.shine} />
            <stop offset="1" stopColor={frame.rim} />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="4.5" ry="3" fill={frame.rim} />
        <rect x=".4" y=".25" width="99.2" height="99.25" rx="4.2" ry="2.85" fill={`url(#${gradient})`} />
        <path d="M5 1H95M5 98.5H95" stroke="white" strokeOpacity=".45" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path d="M16 1.65H84M10 98H90" stroke={frame.rim} strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </Box>
      <Stack direction="row" alignItems="center" sx={{ position: 'relative', minHeight: 38, px: 1, isolation: 'isolate' }}>
        <Box component="svg" aria-hidden="true" viewBox="0 0 100 34" preserveAspectRatio="none"
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: -1 }}>
          <rect width="100" height="34" fill={frame.strip} />
          <path d="M0 33.5H100" stroke={frame.rim} strokeOpacity=".25" />
        </Box>
        {'wordmark' in frame
          ? <Box component="img" src={frame.wordmark} alt={frame.label} sx={{ display: 'block', width: 122, maxWidth: '78%' }} />
          : <Typography variant="sectionHeading" color="common.white">{frame.label}</Typography>}
      </Stack>
      {url && url !== failedUrl ? (
        <Box component="img" src={url} alt={`${game?.title} cover`}
          loading="lazy" decoding="async" onError={() => setFailedUrl(url)}
          sx={{ display: 'block', width: '100%', aspectRatio: '2 / 3', objectFit: 'contain' }} />
      ) : (
        <Paper variant="mediaSurface" elevation={0} sx={{ width: '100%', aspectRatio: '2 / 3', display: 'grid', placeItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">No cover</Typography>
        </Paper>
      )}
    </Box>
  );
}

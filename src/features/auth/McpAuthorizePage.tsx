import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@monochrome-ui/design-system';
import { CheckCircleIcon as Check, ShieldCheckIcon as ShieldCheck, CloseIcon as X } from '@/components/AppIcon';
import { authLib } from '@/libs/auth';

type ConsentRequest = { clientName: string; scopes: string[]; expiresAt: number };

export function McpAuthorizePage() {
  const requestId = new URLSearchParams(window.location.search).get('request') ?? '';
  const [request, setRequest] = useState<ConsentRequest | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<'approve' | 'deny' | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/mcp-auth/consent?request=${encodeURIComponent(requestId)}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message ?? 'This connection request is invalid or expired.');
        setRequest(data as ConsentRequest);
      })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not load this connection request.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [requestId]);

  const decide = async (decision: 'approve' | 'deny') => {
    setSubmitting(decision);
    setError('');
    try {
      const idToken = await authLib.getCurrentIdToken();
      if (!idToken) throw new Error('Sign in to GameHub to continue.');
      const response = await fetch('/mcp-auth/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ requestId, decision }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Could not complete the connection.');
      window.location.assign(data.redirectUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not complete the connection.');
      setSubmitting(null);
    }
  };

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Paper variant="contentPanel" sx={{ width: '100%', maxWidth: 480, p: { xs: 3, sm: 5 } }}>
        <Stack spacing={2.5}>
          <ShieldCheck size={28} />
          <Box>
            <Typography variant="h3">Connect to GameHub</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>Review what this app can access before continuing.</Typography>
          </Box>
          {loading ? <CircularProgress size={24} /> : error && !request ? <Alert severity="error">{error}</Alert> : request && <>
            <Paper variant="insetPanel">
              <Typography variant="h6">{request.clientName}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Requests access to your GameHub data:</Typography>
              <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                {request.scopes.map((scope) => <Typography key={scope} variant="body2">• {scope === 'gamehub:read' ? 'Read your accounts, games, and providers' : scope === 'gamehub:write' ? 'Create and update your GameHub data' : 'Stay connected between sessions'}</Typography>)}
              </Stack>
            </Paper>
            {error && <Alert severity="error">{error}</Alert>}
            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5}>
              <Button fullWidth variant="outlined" loading={submitting === 'deny'} disabled={Boolean(submitting)} onClick={() => void decide('deny')} startIcon={<X size={16} />}>Deny</Button>
              <Button fullWidth variant="contained" loading={submitting === 'approve'} disabled={Boolean(submitting)} onClick={() => void decide('approve')} startIcon={<Check size={16} />}>Approve</Button>
            </Stack>
          </>}
        </Stack>
      </Paper>
    </Box>
  );
}

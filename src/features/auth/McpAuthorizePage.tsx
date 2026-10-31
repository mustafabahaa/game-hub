import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Check, ShieldCheck, X } from 'lucide-react';
import { requireAuth } from '@/config/firebase';

type ConsentRequest = { clientName: string; scopes: string[]; expiresAt: number };

export function McpAuthorizePage() {
  const requestId = new URLSearchParams(window.location.search).get('request') ?? '';
  const [request, setRequest] = useState<ConsentRequest | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    setError('');
    try {
      const idToken = await requireAuth().currentUser?.getIdToken();
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
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 2, bgcolor: 'background.default' }}>
      <Box sx={{ width: '100%', maxWidth: 480, p: { xs: 3, sm: 5 }, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '16px' }}>
        <Stack spacing={2.5}>
          <ShieldCheck size={28} />
          <Box>
            <Typography variant="h3">Connect to GameHub</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>Review what this app can access before continuing.</Typography>
          </Box>
          {loading ? <CircularProgress size={24} /> : error && !request ? <Alert severity="error">{error}</Alert> : request && <>
            <Box sx={{ p: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <Typography fontWeight={700}>{request.clientName}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Requests access to your GameHub data:</Typography>
              <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                {request.scopes.map((scope) => <Typography key={scope} variant="body2">• {scope === 'gamehub:read' ? 'Read your accounts, games, and providers' : scope === 'gamehub:write' ? 'Create and update your GameHub data' : 'Stay connected between sessions'}</Typography>)}
              </Stack>
            </Box>
            {error && <Alert severity="error">{error}</Alert>}
            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5}>
              <Button fullWidth variant="outlined" disabled={submitting} onClick={() => void decide('deny')} startIcon={<X size={16} />}>Deny</Button>
              <Button fullWidth variant="contained" disabled={submitting} onClick={() => void decide('approve')} startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Check size={16} />}>Approve</Button>
            </Stack>
          </>}
        </Stack>
      </Box>
    </Box>
  );
}

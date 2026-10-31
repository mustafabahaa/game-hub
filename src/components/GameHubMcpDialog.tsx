import { useEffect, useState } from 'react';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, IconButton, MenuItem, Select, Stack, Tooltip, Typography } from '@mui/material';
import { Copy, KeyRound, X } from 'lucide-react';
import { firebaseApp } from '@/config/firebase';

type TokenScope = 'read' | 'write';
type McpToken = { id: string; scope: TokenScope; createdAt: string; expiresAt: number };

/** User-managed, short-lived MCP credentials. Raw tokens are shown only once. */
export function GameHubMcpDialog() {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<TokenScope>('read');
  const [tokens, setTokens] = useState<McpToken[]>([]);
  const [newToken, setNewToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const listTokens = async () => {
    if (!firebaseApp) return;
    const call = httpsCallable<void, { tokens: McpToken[] }>(getFunctions(firebaseApp), 'listGamehubMcpTokens');
    const result = await call();
    setTokens(result.data.tokens);
  };

  useEffect(() => {
    if (open) void listTokens().catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load MCP credentials.'));
  }, [open]);

  const createToken = async () => {
    if (!firebaseApp) return;
    setBusy(true); setError(''); setNewToken('');
    try {
      const call = httpsCallable<{ scope: TokenScope }, { id: string; token: string; scope: TokenScope }>(getFunctions(firebaseApp), 'createGamehubMcpToken');
      const result = await call({ scope });
      setNewToken(result.data.token);
      await listTokens();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create an MCP credential.');
    } finally { setBusy(false); }
  };

  const revoke = async (id: string) => {
    if (!firebaseApp) return;
    setBusy(true); setError('');
    try {
      const call = httpsCallable<{ id: string }, { revoked: boolean }>(getFunctions(firebaseApp), 'revokeGamehubMcpToken');
      await call({ id });
      setTokens((items) => items.filter((item) => item.id !== id));
      setNewToken('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not revoke the credential.');
    } finally { setBusy(false); }
  };

  return (
    <>
      <Tooltip title="MCP connections">
        <IconButton aria-label="Manage MCP connections" onClick={() => { setError(''); setOpen(true); }} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <KeyRound size={18} />
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={() => { setOpen(false); setNewToken(''); }} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1.5 }}>
          <KeyRound size={19} /><Box sx={{ flex: 1 }}>MCP connections</Box>
          <IconButton aria-label="Close MCP connections" onClick={() => { setOpen(false); setNewToken(''); }}><X size={18} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <Typography variant="body2">Connect a compatible MCP client to your GameHub data. Tokens expire after 30 days.</Typography>
            <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.default' }}>
              <Typography variant="caption">Server endpoint</Typography>
              <Typography sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere' }}>https://gamehub-app-11072026.web.app/mcp</Typography>
            </Box>
            {error && <Alert severity="error">{error}</Alert>}
            {newToken && <Alert severity="warning" sx={{ overflowWrap: 'anywhere' }}>
              Copy this token now. It will not be shown again.
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="code" sx={{ flex: 1, fontSize: 12 }}>{newToken}</Box>
                <IconButton aria-label="Copy MCP token" onClick={() => void navigator.clipboard.writeText(newToken)}><Copy size={16} /></IconButton>
              </Box>
            </Alert>}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Select size="small" value={scope} onChange={(event) => setScope(event.target.value as TokenScope)} aria-label="New token permission">
                <MenuItem value="read">Read only</MenuItem><MenuItem value="write">Read and write</MenuItem>
              </Select>
              <Button variant="contained" onClick={() => void createToken()} disabled={busy}>Create token</Button>
            </Stack>
            <Typography variant="overline">Active tokens</Typography>
            {tokens.length === 0 && <Typography variant="body2">No active tokens.</Typography>}
            {tokens.map((token) => <Stack key={token.id} direction="row" alignItems="center" spacing={1} sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.primary' }}>{token.scope === 'write' ? 'Read and write' : 'Read only'}</Typography>
                <Typography variant="caption">Expires {new Date(token.expiresAt).toLocaleDateString()}</Typography>
              </Box>
              <Button size="small" color="error" disabled={busy} onClick={() => void revoke(token.id)}>Revoke</Button>
            </Stack>)}
            <Typography variant="caption">Write tokens can change vault data. Deletions also require per-action confirmation.</Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}

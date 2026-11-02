import { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, IconButton, MenuItem, Paper, Select, Stack, Tooltip, Typography } from '@monochrome-ui/design-system';
import { ContentCopyIcon as Copy, KeyIcon as KeyRound, CloseIcon as X } from '@/components/AppIcon';
import { gamehubMcpLib, type McpToken, type TokenScope } from '@/libs/gamehubMcp';

/** User-managed, short-lived MCP credentials. Raw tokens are shown only once. */
export function GameHubMcpDialog() {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<TokenScope>('read');
  const [tokens, setTokens] = useState<McpToken[]>([]);
  const [newToken, setNewToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'create' | string | null>(null);
  const [copyingToken, setCopyingToken] = useState(false);

  const listTokens = async () => {
    const result = await gamehubMcpLib.listTokens();
    setTokens(result.tokens);
  };

  useEffect(() => {
    if (!open) return;
    let active = true;
    gamehubMcpLib.listTokens()
      .then(({ tokens: activeTokens }) => { if (active) setTokens(activeTokens); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load MCP credentials.'); });
    return () => { active = false; };
  }, [open]);

  const createToken = async () => {
    setBusy('create'); setError(''); setNewToken('');
    try {
      const result = await gamehubMcpLib.createToken(scope);
      setNewToken(result.token);
      await listTokens();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create an MCP credential.');
    } finally { setBusy(null); }
  };

  const revoke = async (id: string) => {
    setBusy(id); setError('');
    try {
      await gamehubMcpLib.revokeToken(id);
      setTokens((items) => items.filter((item) => item.id !== id));
      setNewToken('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not revoke the credential.');
    } finally { setBusy(null); }
  };

  const copyToken = async () => {
    if (!newToken) return;
    setCopyingToken(true);
    try {
      await navigator.clipboard.writeText(newToken);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not copy the token.');
    } finally {
      setCopyingToken(false);
    }
  };

  return (
    <>
      <Tooltip title="MCP connections">
        <IconButton aria-label="Manage MCP connections" onClick={() => { setError(''); setOpen(true); }} variant="utilityAction">
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
            <Paper elevation={0} variant="metadataPanel">
              <Typography variant="caption">Server endpoint</Typography>
              <Typography variant="technicalValue">https://gamehub-app-11072026.web.app/mcp</Typography>
            </Paper>
            {error && <Alert severity="error">{error}</Alert>}
            {newToken && <Alert severity="warning" sx={{ overflowWrap: 'anywhere' }}>
              Copy this token now. It will not be shown again.
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography component="code" variant="codeValue" sx={{ flex: 1 }}>{newToken}</Typography>
                <IconButton aria-label="Copy MCP token" onClick={() => void copyToken()} loading={copyingToken}><Copy size={16} /></IconButton>
              </Box>
            </Alert>}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Select size="small" value={scope} onChange={(event) => setScope(event.target.value as TokenScope)} aria-label="New token permission">
                <MenuItem value="read">Read only</MenuItem><MenuItem value="write">Read and write</MenuItem>
              </Select>
              <Button variant="contained" onClick={() => void createToken()} loading={busy === 'create'} disabled={Boolean(busy)}>Create token</Button>
            </Stack>
            <Typography variant="overline">Active tokens</Typography>
            {tokens.length === 0 && <Typography variant="body2">No active tokens.</Typography>}
            {tokens.map((token) => <Paper elevation={0} variant="listRow" key={token.id} component={Stack} direction="row" alignItems="center" spacing={1} sx={{ py: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">{token.scope === 'write' ? 'Read and write' : 'Read only'}</Typography>
                <Typography variant="caption">Expires {new Date(token.expiresAt).toLocaleDateString()}</Typography>
              </Box>
              <Button size="small" color="error" loading={busy === token.id} disabled={Boolean(busy)} onClick={() => void revoke(token.id)}>Revoke</Button>
            </Paper>)}
            <Typography variant="caption">Write tokens can change vault data. Deletions also require per-action confirmation.</Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}

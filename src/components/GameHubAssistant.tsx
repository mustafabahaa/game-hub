import { useEffect, useState, type FormEvent } from 'react';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Link, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { Check, ExternalLink, Send, Sparkles, X } from 'lucide-react';
import { firebaseApp } from '@/config/firebase';

type StreamChunk =
  | { type: 'text'; text: string }
  | { type: 'device'; verificationUrl: string; code: string; attemptId: string }
  | { type: 'approval'; approvalId: string; toolName: string; description: string; input: Record<string, unknown> }
  | { type: 'connected' | 'done' };

/** Connected Codex assistant backed by the shared, user-scoped GameHub tool registry. */
export function GameHubAssistant() {
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [device, setDevice] = useState<{ verificationUrl: string; code: string; attemptId: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<Extract<StreamChunk, { type: 'approval' }> | null>(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadConnection = async () => {
    if (!firebaseApp) return;
    try {
      const call = httpsCallable<{ provider: 'codex' }, { connected: boolean }>(getFunctions(firebaseApp), 'getGamehubAiConnection');
      setConnected((await call({ provider: 'codex' })).data.connected);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not check the Codex connection.'); }
  };

  useEffect(() => { if (open) void loadConnection(); }, [open]);

  const connect = async () => {
    if (!firebaseApp) return;
    setLoading(true); setError(''); setDevice(null);
    const controller = new AbortController();
    try {
      const call = httpsCallable<{ provider: 'codex' }, { connected: boolean }, StreamChunk>(
        getFunctions(firebaseApp), 'startGamehubAiConnection', { timeout: 600_000 },
      );
      const result = await call.stream({ provider: 'codex' }, { signal: controller.signal });
      for await (const chunk of result.stream) {
        if (chunk.type === 'device') setDevice(chunk);
        if (chunk.type === 'connected') { setConnected(true); setDevice(null); }
      }
      await result.data;
      setConnected(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not connect Codex.'); }
    finally { setLoading(false); }
  };

  const disconnect = async () => {
    if (!firebaseApp) return;
    setLoading(true); setError('');
    try {
      const call = httpsCallable<{ provider: 'codex' }, { connected: boolean }>(getFunctions(firebaseApp), 'disconnectGamehubAiConnection');
      await call({ provider: 'codex' }); setConnected(false); setDevice(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not disconnect Codex.'); }
    finally { setLoading(false); }
  };

  const resolveAction = async (decision: 'approved' | 'denied') => {
    if (!firebaseApp || !pendingAction || approvalLoading) return;
    setApprovalLoading(true);
    try {
      const call = httpsCallable<{ approvalId: string; decision: 'approved' | 'denied' }, { resolved: boolean }>(
        getFunctions(firebaseApp), 'resolveGamehubAiToolApproval',
      );
      await call({ approvalId: pendingAction.approvalId, decision });
      setPendingAction(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not resolve this assistant action.');
    } finally { setApprovalLoading(false); }
  };

  const ask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = question.trim();
    if (!value || !firebaseApp) return;
    setLoading(true); setError(''); setAnswer(''); setPendingAction(null);
    const controller = new AbortController();
    try {
      const call = httpsCallable<{ message: string }, { done: boolean }, StreamChunk>(getFunctions(firebaseApp), 'streamGamehubAiReply', { timeout: 240_000 });
      const result = await call.stream({ message: value }, { signal: controller.signal });
      for await (const chunk of result.stream) {
        if (chunk.type === 'text') setAnswer((previous) => previous + chunk.text);
        if (chunk.type === 'approval') setPendingAction(chunk);
      }
      await result.data;
      setQuestion('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The assistant could not answer right now.'); }
    finally { setLoading(false); }
  };

  return <>
    <Tooltip title="Ask GameHub">
      <IconButton aria-label="Ask GameHub" onClick={() => { setOpen(true); setError(''); }} sx={{ border: '1px solid', borderColor: 'divider' }}><Sparkles size={18} /></IconButton>
    </Tooltip>
    <Dialog open={open} onClose={() => { if (pendingAction) void resolveAction('denied'); setOpen(false); }} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1.5 }}><Sparkles size={19} /><Box sx={{ flex: 1 }}>GameHub assistant</Box><IconButton aria-label="Close assistant" onClick={() => { if (pendingAction) void resolveAction('denied'); setOpen(false); }}><X size={18} /></IconButton></DialogTitle>
      <DialogContent sx={{ pt: 1 }}><Stack spacing={2}>
        <Typography variant="body2">Connect your ChatGPT Codex account to get help with your GameHub data.</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {!connected ? <>
          <Button variant="contained" onClick={() => void connect()} disabled={loading}>{loading ? 'Waiting for Codex…' : 'Connect ChatGPT Codex'}</Button>
          {device && <Box sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
            <Typography fontWeight={700}>Finish connecting your account</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>Open the device sign-in page, enter this code, and approve access. Keep GameHub open while you do this.</Typography>
            <Link href={device.verificationUrl} target="_blank" rel="noreferrer" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, mt: 1.5 }}>Open device sign-in <ExternalLink size={14} /></Link>
            <Typography sx={{ mt: 1.5, fontFamily: 'monospace', fontWeight: 700, fontSize: 20, letterSpacing: '.08em' }}>{device.code}</Typography>
          </Box>}
        </> : <>
          <Alert severity="success" icon={<Check size={18} />}>ChatGPT Codex is connected.</Alert>
          {answer && <Box sx={{ p: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 3, whiteSpace: 'pre-wrap' }}>{answer}</Box>}
          {pendingAction && <Box role="alertdialog" aria-label="Approve assistant action" sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.default' }}>
            <Typography fontWeight={700}>Approve this change?</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{pendingAction.description}</Typography>
            <Typography variant="subtitle2" sx={{ mt: 1.5 }}>{pendingAction.toolName.replaceAll('_', ' ')}</Typography>
            <Box component="pre" sx={{ maxHeight: 180, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: 12, p: 1.25, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              {JSON.stringify(pendingAction.input, null, 2)}
            </Box>
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button color="inherit" onClick={() => void resolveAction('denied')} disabled={approvalLoading}>Decline</Button>
              <Button variant="contained" onClick={() => void resolveAction('approved')} disabled={approvalLoading}>{approvalLoading ? 'Saving…' : 'Approve'}</Button>
            </Stack>
          </Box>}
          <Box component="form" onSubmit={ask}><Stack spacing={1.5}>
            <TextField fullWidth multiline minRows={3} maxRows={6} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Which platform has the most accounts?" inputProps={{ maxLength: 4000, 'aria-label': 'Ask the GameHub assistant' }} />
            <Stack direction="row" justifyContent="space-between">
              <Button color="inherit" onClick={() => void disconnect()} disabled={loading}>Disconnect</Button>
              <Button type="submit" variant="contained" disabled={!question.trim() || loading} endIcon={<Send size={16} />}>{loading ? 'Thinking…' : 'Ask'}</Button>
            </Stack>
          </Stack></Box>
          <Typography variant="caption">The assistant can read your GameHub data and suggest updates. It will ask you to approve every change before it runs. Passwords and OTP secrets are not available to it.</Typography>
        </>}
      </Stack></DialogContent>
    </Dialog>
  </>;
}

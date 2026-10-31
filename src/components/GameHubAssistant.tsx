import { useEffect, useState, type SyntheticEvent } from 'react';
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Link, Paper, Stack, TextField, Tooltip, Typography } from '@monochrome-ui/design-system';
import { CheckCircleIcon as Check, ExternalLinkIcon as ExternalLink, SendIcon as Send, SparkleIcon as Sparkles, CloseIcon as X } from '@/components/AppIcon';
import { gamehubAssistantLib, type AssistantStreamChunk } from '@/libs/gamehubAssistant';

/** Connected Codex assistant backed by the shared, user-scoped GameHub tool registry. */
export function GameHubAssistant() {
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [device, setDevice] = useState<{ verificationUrl: string; code: string; attemptId: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<Extract<AssistantStreamChunk, { type: 'approval' }> | null>(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    gamehubAssistantLib.getConnection()
      .then(({ connected: isConnected }) => { if (active) setConnected(isConnected); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not check the Codex connection.'); });
    return () => { active = false; };
  }, [open]);

  const connect = async () => {
    setLoading(true); setError(''); setDevice(null);
    const controller = new AbortController();
    try {
      const result = await gamehubAssistantLib.startConnection(controller.signal);
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
    setLoading(true); setError('');
    try {
      await gamehubAssistantLib.disconnect(); setConnected(false); setDevice(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not disconnect Codex.'); }
    finally { setLoading(false); }
  };

  const resolveAction = async (decision: 'approved' | 'denied') => {
    if (!pendingAction || approvalLoading) return;
    setApprovalLoading(true);
    try {
      await gamehubAssistantLib.resolveAction(pendingAction.approvalId, decision);
      setPendingAction(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not resolve this assistant action.');
    } finally { setApprovalLoading(false); }
  };

  const ask = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = question.trim();
    if (!value) return;
    setLoading(true); setError(''); setAnswer(''); setPendingAction(null);
    const controller = new AbortController();
    try {
      const result = await gamehubAssistantLib.ask(value, controller.signal);
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
      <IconButton aria-label="Ask GameHub" onClick={() => { setOpen(true); setError(''); }} variant="utilityAction"><Sparkles size={18} /></IconButton>
    </Tooltip>
    <Dialog open={open} onClose={() => { if (pendingAction) void resolveAction('denied'); setOpen(false); }} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1.5 }}><Sparkles size={19} /><Box sx={{ flex: 1 }}>GameHub assistant</Box><IconButton aria-label="Close assistant" onClick={() => { if (pendingAction) void resolveAction('denied'); setOpen(false); }}><X size={18} /></IconButton></DialogTitle>
      <DialogContent sx={{ pt: 1 }}><Stack spacing={2}>
        <Typography variant="body2">Connect your ChatGPT Codex account to get help with your GameHub data.</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {!connected ? <>
          <Button variant="contained" onClick={() => void connect()} disabled={loading}>{loading ? 'Waiting for Codex…' : 'Connect ChatGPT Codex'}</Button>
          {device && <Paper elevation={0} variant="infoPanel">
            <Typography variant="panelTitle">Finish connecting your account</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>Open the device sign-in page, enter this code, and approve access. Keep GameHub open while you do this.</Typography>
            <Link href={device.verificationUrl} target="_blank" rel="noreferrer" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, mt: 1.5 }}>Open device sign-in <ExternalLink size={14} /></Link>
            <Typography variant="verificationCode" sx={{ mt: 1.5 }}>{device.code}</Typography>
          </Paper>}
        </> : <>
          <Alert severity="success" icon={<Check size={18} />}>ChatGPT Codex is connected.</Alert>
          {answer && <Paper elevation={0} variant="messagePanel">{answer}</Paper>}
          {pendingAction && <Paper elevation={0} component="section" role="alertdialog" aria-label="Approve assistant action" variant="approvalPanel">
            <Typography variant="panelTitle">Approve this change?</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{pendingAction.description}</Typography>
            <Typography variant="subtitle2" sx={{ mt: 1.5 }}>{pendingAction.toolName.replaceAll('_', ' ')}</Typography>
            <Paper elevation={0} component="pre" variant="codePanel">
              {JSON.stringify(pendingAction.input, null, 2)}
            </Paper>
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button color="inherit" onClick={() => void resolveAction('denied')} disabled={approvalLoading}>Decline</Button>
              <Button variant="contained" onClick={() => void resolveAction('approved')} disabled={approvalLoading}>{approvalLoading ? 'Saving…' : 'Approve'}</Button>
            </Stack>
          </Paper>}
          <Box component="form" onSubmit={ask}><Stack spacing={1.5}>
            <TextField fullWidth multiline minRows={3} maxRows={6} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Which platform has the most accounts?" slotProps={{ htmlInput: { maxLength: 4000, 'aria-label': 'Ask the GameHub assistant' } }} />
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

import { useEffect, useState } from 'react';
import { AssistantChat, Alert, Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Link, Paper, Stack, Tooltip, Typography, type AssistantChatMessage } from '@monochrome-ui/design-system';
import { CheckCircleIcon as Check, ExternalLinkIcon as ExternalLink, SendIcon as Send, SparkleIcon as Sparkles, CloseIcon as X } from '@/components/AppIcon';
import { gamehubAssistantLib, type AssistantStreamChunk } from '@/libs/gamehubAssistant';

/** Connected Codex assistant backed by the shared, user-scoped GameHub tool registry. */
export function GameHubAssistant() {
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
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
      await gamehubAssistantLib.resolveAction(pendingAction.id, decision);
      setPendingAction(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not resolve this assistant action.');
    } finally { setApprovalLoading(false); }
  };

  const ask = async () => {
    const value = draft.trim();
    if (!value) return;
    setLoading(true); setError(''); setPendingAction(null);
    const assistantId = crypto.randomUUID();
    setMessages((previous) => [
      ...previous,
      { id: crypto.randomUUID(), role: 'user', content: value },
      { id: assistantId, role: 'assistant', content: '', streaming: true, avatar: <Sparkles size={18} /> },
    ]);
    const controller = new AbortController();
    try {
      const result = await gamehubAssistantLib.ask(value, controller.signal);
      for await (const chunk of result.stream) {
        if (chunk.type === 'text') setMessages((previous) => previous.map((message) =>
          message.id === assistantId ? { ...message, content: `${String(message.content)}${chunk.text}` } : message,
        ));
        if (chunk.type === 'approval') setPendingAction(chunk);
      }
      await result.data;
      setDraft('');
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
          <AssistantChat
            messages={pendingAction ? [...messages, {
              id: pendingAction.id,
              role: 'assistant' as const,
              avatar: <Sparkles size={18} />,
              content: <Paper elevation={0} component="section" role="alertdialog" aria-label="Approve assistant action" variant="approvalPanel">
            <Typography variant="panelTitle">Approve this change?</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{pendingAction.description}</Typography>
            <Typography variant="subtitle2" sx={{ mt: 1.5 }}>{pendingAction.name.replaceAll('_', ' ')}</Typography>
            <Paper elevation={0} component="pre" variant="codePanel">
              {JSON.stringify(pendingAction.input, null, 2)}
            </Paper>
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button color="inherit" onClick={() => void resolveAction('denied')} disabled={approvalLoading}>Decline</Button>
              <Button variant="contained" onClick={() => void resolveAction('approved')} disabled={approvalLoading}>{approvalLoading ? 'Saving…' : 'Approve'}</Button>
            </Stack>
              </Paper>,
            }] : messages}
            value={draft}
            onChange={setDraft}
            onSubmit={ask}
            busy={loading}
            placeholder="Which platform has the most accounts?"
            inputLabel="Ask the GameHub assistant"
            sendAdornment={<Send size={16} />}
            emptyState={<Typography variant="body2" color="text.secondary">Ask about your saved accounts, games, and providers.</Typography>}
            startAdornment={<Button color="inherit" onClick={() => void disconnect()} disabled={loading}>Disconnect</Button>}
            footer={<Typography variant="caption" sx={{ px: 1.5, pb: 1.5 }}>The assistant can read your GameHub data and suggest updates. It will ask you to approve every change before it runs. Passwords and OTP secrets are not available to it.</Typography>}
          />
        </>}
      </Stack></DialogContent>
    </Dialog>
  </>;
}

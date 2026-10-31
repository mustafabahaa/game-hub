import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseApp } from '@/config/firebase';

export type AssistantStreamChunk =
  | { type: 'text'; text: string }
  | { type: 'device'; verificationUrl: string; code: string; attemptId: string }
  | { type: 'approval'; approvalId: string; toolName: string; description: string; input: Record<string, unknown> }
  | { type: 'connected' | 'done' };

function requireApp() {
  if (!firebaseApp) throw new Error('GameHub services are not configured.');
  return firebaseApp;
}

export const gamehubAssistantLib = {
  async getConnection() {
    const call = httpsCallable<{ provider: 'codex' }, { connected: boolean }>(getFunctions(requireApp()), 'getGamehubAiConnection');
    return (await call({ provider: 'codex' })).data;
  },
  async startConnection(signal: AbortSignal) {
    const call = httpsCallable<{ provider: 'codex' }, { connected: boolean }, AssistantStreamChunk>(
      getFunctions(requireApp()), 'startGamehubAiConnection', { timeout: 600_000 },
    );
    return call.stream({ provider: 'codex' }, { signal });
  },
  async disconnect() {
    const call = httpsCallable<{ provider: 'codex' }, { connected: boolean }>(getFunctions(requireApp()), 'disconnectGamehubAiConnection');
    return call({ provider: 'codex' });
  },
  async resolveAction(approvalId: string, decision: 'approved' | 'denied') {
    const call = httpsCallable<{ approvalId: string; decision: 'approved' | 'denied' }, { resolved: boolean }>(
      getFunctions(requireApp()), 'resolveGamehubAiToolApproval',
    );
    return call({ approvalId, decision });
  },
  async ask(message: string, signal: AbortSignal) {
    const call = httpsCallable<{ message: string }, { done: boolean }, AssistantStreamChunk>(
      getFunctions(requireApp()), 'streamGamehubAiReply', { timeout: 240_000 },
    );
    return call.stream({ message }, { signal });
  },
};

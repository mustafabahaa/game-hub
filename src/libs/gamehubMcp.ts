import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseApp } from '@/config/firebase';

export type TokenScope = 'read' | 'write';
export type McpToken = { id: string; scope: TokenScope; createdAt: string; expiresAt: number };

function requireFunctions() {
  if (!firebaseApp) throw new Error('GameHub services are not configured.');
  return getFunctions(firebaseApp);
}

export const gamehubMcpLib = {
  async listTokens() {
    const call = httpsCallable<void, { tokens: McpToken[] }>(requireFunctions(), 'listGamehubMcpTokens');
    return (await call()).data;
  },
  async createToken(scope: TokenScope) {
    const call = httpsCallable<{ scope: TokenScope }, { id: string; token: string; scope: TokenScope }>(requireFunctions(), 'createGamehubMcpToken');
    return (await call({ scope })).data;
  },
  async revokeToken(id: string) {
    const call = httpsCallable<{ id: string }, { revoked: boolean }>(requireFunctions(), 'revokeGamehubMcpToken');
    return call({ id });
  },
};

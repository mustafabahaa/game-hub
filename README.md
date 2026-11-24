# GameHub

GameHub is a private React, TypeScript, and Vite vault for managing game accounts, game libraries, and saved providers. It uses Firebase Authentication, Cloud Firestore, Firebase Storage, and Firebase Hosting.

## Local development

Requirements: Node.js 20 or newer and npm.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the Firebase web app configuration from the Firebase project.
3. Start the app with `npm run dev`.

The client reads `VITE_FIREBASE_*` variables. At minimum, set the API key and project ID or the app will show its Firebase configuration screen.

## Firebase

The Firebase project alias is `gamehub-app-11072026` in `.firebaserc`. Hosting serves the Vite `dist` directory and rewrites client routes to `index.html`. Firestore indexes and Firestore and Storage rules are kept in the repository.

GameHub is owner-only: the app and its Firebase resources require the server-provisioned `owner` custom claim. See [docs/owner-access.md](docs/owner-access.md) for granting or revoking access.

Build the client with `npm run build`. Deploy hosting with `npm run deploy:web`; deploy Functions with `npm run deploy:functions`; deploy Firestore rules and indexes with `npm run deploy:firestore`; deploy Storage rules with `npm run deploy:storage`. `npm run deploy` deploys all configured Firebase resources. Ensure the Firebase CLI is authenticated and the `VITE_FIREBASE_*` settings are available in the build environment.

Firebase Functions use Node.js 22 and require an active Firebase billing account. `GAMEHUB_PUBLIC_URL` defaults to this project's Firebase Hosting origin and can be set in the Functions environment for a custom domain.

## MCP

GameHub's MCP server supports OAuth 2.1 with PKCE and also offers manually managed 30-day bearer tokens. OAuth clients can discover authorization metadata from the Hosting origin and request `gamehub:read`, optional `gamehub:write`, and `offline_access`. The consent page is `/mcp/authorize`. Manual tokens default to read-only; write access is explicit and destructive actions require confirmation. Raw manual tokens are shown once and can be revoked from the GameHub MCP dialog.

The Hosting rewrites for `/mcp` and the OAuth routes are configured in `firebase.json`. After Firebase billing is enabled, deploy Functions and Hosting. Then set `VITE_GAMEHUB_FUNCTIONS_ENABLED=true` in the web build environment and rebuild/redeploy Hosting to enable MCP controls. The remote MCP server exposes private account, game, and provider management through a shared server-side tool registry. Password and OTP values are never available to MCP tools. MCP read credentials receive read tools only, while write credentials can use the registry's mutation tools. Destructive actions require an explicit `confirm: true` and user approval.

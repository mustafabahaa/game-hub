# GameHub owner-only access

GameHub requires the Firebase Authentication custom claim `owner: true`. The owner email is supplied only to the administrative script when granting or revoking access; it is not stored in app code or Firebase rules. Firestore, Storage, callable Functions, the MCP server, and the MCP OAuth consent endpoint enforce this claim.

## Initial setup

1. Sign in to the deployed GameHub app once with the Google account that should own it. An unauthorized sign-in creates the Firebase Authentication user but does not grant app access.
2. Authenticate Application Default Credentials for the Firebase project and select the same project with `firebase use <project-id>` if it is not already the default.
3. Grant the owner claim to that existing Firebase Authentication user:

   ```sh
   npm --prefix packages/functions run owner-access -- grant you@example.com
   ```

4. Sign out and back in, then deploy the client, Functions, Firestore rules, and Storage rules:

   ```sh
   npm run build
   npm run build:functions
   firebase deploy --only hosting,functions,firestore,storage
   ```

The active Application Default Credentials need permission to manage Firebase Authentication users in that project.

## Change owner

Grant the new owner, then revoke the old owner:

```sh
npm --prefix packages/functions run owner-access -- grant new-owner@example.com
npm --prefix packages/functions run owner-access -- revoke old-owner@example.com
```

The target account must already exist in Firebase Authentication. Revoking access blocks it once its ID token is refreshed; for immediate revocation, revoke that account's refresh tokens in Firebase Authentication too. Never grant the claim to an account you do not control.

// Neon Auth (Better Auth) client instance
// This will be configured once Neon Auth is set up in the console.
// Placeholder for the auth client that the passwordless helpers depend on.

import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});

import { authClient } from "@/lib/auth/client";

/**
 * Staff login: email magic link.
 * Neon Auth sends the link via email. Staff clicks to sign in.
 * No passwords, no SMS OTP.
 *
 * Requires the Magic Link plugin to be enabled in Neon Auth console.
 * POC: staff auth is not enforced on pages yet.
 */
export async function sendLoginLink(email: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (authClient.signIn as any).magicLink({
    email,
    callbackURL: "/dashboard",
  });
  if (error) throw error;
}

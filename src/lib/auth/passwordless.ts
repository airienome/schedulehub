import { authClient } from "@/lib/auth/client";

/**
 * Staff login: email magic link.
 * Neon Auth sends the link via email. Staff clicks to sign in.
 * No passwords, no SMS OTP.
 */
export async function sendLoginLink(email: string) {
  const { error } = await authClient.signIn.magicLink({
    email,
    callbackURL: "/dashboard",
  });
  if (error) throw error;
}

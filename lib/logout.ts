import { apiFetch } from "./api";
import { clearMockSession } from "./mockSession";

/**
 * Single place that signs the user out (POST /auth/logout, api-specification
 * §2), shared by the account menu and the forced password-change screen.
 *
 * The backend call is best-effort: the httpOnly cookie can only be cleared
 * by the server, so we always try it, but a failure (network error, already
 * expired session) must never leave the user stuck "logged in" — so the dev
 * mock session is cleared in `finally`, success or not. (Previously it was
 * only cleared when the request failed, so a stale mock session could
 * survive a successful real logout.)
 *
 * Callers are responsible for navigating to /login afterwards.
 */
export async function signOut(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {
    // Ignore — see above.
  } finally {
    clearMockSession();
  }
}
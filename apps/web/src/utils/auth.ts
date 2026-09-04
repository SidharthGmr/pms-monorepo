import { getSession } from "next-auth/react";

const ACCESS_TOKEN_KEY = "at";
const REFRESH_TOKEN_KEY = "refreshToken";
const REFRESH_BUFFER_MS = 90_000; // 90 sec before expiry
/** Never re-arm the timer tighter than this, so a token that fails to advance
 *  cannot turn into a refresh loop. */
const MIN_RESCHEDULE_MS = 15_000;

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let onRefreshFailedHandler: (() => void) | null = null;
let onRefreshSuccessHandler: (() => void) | null = null;

function clearRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

function decodeJwtExp(token: string): number | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  try {
    const decoded = JSON.parse(atob(padded)) as { exp?: number };
    return decoded.exp ?? null;
  } catch {
    return null;
  }
}

export function scheduleAccessTokenRefresh(accessToken: string, onRefreshFailed?: () => void, onRefreshSuccess?: () => void) {
  const exp = decodeJwtExp(accessToken);
  if (!exp) {
    console.warn("[auth] Token has no exp, not scheduling refresh");
    return;
  }

  const expMs = exp * 1000;
  const nowMs = Date.now();
  const remainingMs = expMs - nowMs;

  const refreshInMs = remainingMs - REFRESH_BUFFER_MS;

  // ✅ store failure handler and clear previous timer
  onRefreshFailedHandler = onRefreshFailed || null;
  onRefreshSuccessHandler = onRefreshSuccess || null;
  clearRefreshTimer();

  // ✅ if already near expiry, refresh immediately
  if (refreshInMs <= 0) {
    //console.log("[auth] Token near expiry, refreshing now...");
    void refreshAccessToken(onRefreshFailedHandler || undefined, onRefreshSuccessHandler || undefined);
    return;
  }

  //console.log(`[auth] Refresh scheduled in: ${Math.floor(refreshInMs / 1000)}s`);

  refreshTimer = setTimeout(() => {
    //console.log("[auth] Timer fired, refreshing now...");
    void refreshAccessToken(onRefreshFailedHandler || undefined, onRefreshSuccessHandler || undefined);
  }, Math.max(refreshInMs, MIN_RESCHEDULE_MS));
}

/**
 * Pre-emptively renews the access token *through NextAuth*.
 *
 * The API rotates refresh tokens on every use and revokes the session when an
 * already-spent one is replayed, so exactly one place may hold and spend it —
 * the `jwt` callback in `[...nextauth]/options.ts`. Calling `getSession()` runs
 * that callback; this function only mirrors the resulting access token into
 * localStorage, where HttpService picks it up.
 */
export async function refreshAccessToken(onRefreshFailed?: () => void, onRefreshSuccess?: () => void): Promise<string | undefined> {
  const at = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!at) {
    // console.warn("[auth] No access token found");
    return;
  }

  const failLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    if (onRefreshFailed) {
      try { onRefreshFailed(); } catch { }
    }
  };

  try {
    const session = await getSession();
    const newAccessToken = (session?.user as { token?: string } | undefined)?.token;

    if ((session as { error?: string } | null)?.error === "RefreshAccessTokenError" || !newAccessToken) {
      //console.error("[auth] Refresh failed");
      failLogout();
      return;
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);

    //console.log("[auth] Token refreshed ✅");
    if (newAccessToken !== at && onRefreshSuccess) {
      try { onRefreshSuccess(); } catch { }
    }

    // ✅ important: schedule again with new token
    scheduleAccessTokenRefresh(newAccessToken, onRefreshFailed, onRefreshSuccess);

    return newAccessToken;
  } catch (error) {
    //console.error("[auth] Error in refreshAccessToken", error);
    if (onRefreshFailed) {
      try { onRefreshFailed(); } catch { }
    }
    return;
  }
}

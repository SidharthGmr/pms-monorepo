import { container } from "@/config/ioc";
import { TYPES } from "@/config/types";
import IUnitOfService from "@/services/interfaces/IUnitOfService";

const ACCESS_TOKEN_KEY = "at";
const REFRESH_TOKEN_KEY = "refreshToken";
const REFRESH_BUFFER_MS = 90_000; // 90 sec before expiry

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

  const expiryDate = new Date(expMs);
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // console.log(`[auth] Token expires at: ${expiryDate.toLocaleString()}`);
  //console.log(`[auth] Token expires in: ${minutes}m ${seconds}s`);

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
  }, refreshInMs);
}

export async function refreshAccessToken(onRefreshFailed?: () => void, onRefreshSuccess?: () => void): Promise<string | undefined> {
  const at = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!at) {
    // console.warn("[auth] No access token found");
    return;
  }

  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  try {
    const refreshResponse = await unitOfService.AccountService.getRefreshToken(at);

    const newAccessToken = refreshResponse?.data?.data?.newToken as string | undefined;
    const newRefreshToken = refreshResponse?.data?.data?.refreshToken as string | undefined;

    if (refreshResponse.status !== 200 || !newAccessToken) {
      //console.error("[auth] Refresh failed", refreshResponse.status);

      // ✅ optional: logout if refresh fails
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      if (onRefreshFailed) {
        try { onRefreshFailed(); } catch { }
      }
      return;
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
    if (newRefreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

    //console.log("[auth] Token refreshed ✅");
    if (onRefreshSuccess) {
      try { onRefreshSuccess(); } catch { }
    }

    // ✅ important: schedule again with new token
    scheduleAccessTokenRefresh(newAccessToken);

    return newAccessToken;
  } catch (error) {
    //console.error("[auth] Error in refreshAccessToken", error);
    if (onRefreshFailed) {
      try { onRefreshFailed(); } catch { }
    }
    return;
  }
}

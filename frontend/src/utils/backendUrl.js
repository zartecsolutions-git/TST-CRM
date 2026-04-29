/**
 * Resolve the backend base URL.
 *
 * In a same-origin deployment (frontend + backend served from the same host
 * via Kubernetes ingress) we ALWAYS want to use the current page origin so
 * the build is deploy-target-agnostic. This avoids the classic "production
 * bundle baked with preview URL" problem when env vars don't get injected
 * at deploy time.
 *
 * Local development / split-host setups can still override via
 * REACT_APP_BACKEND_URL — but only when it matches the current host or when
 * the page is loaded over http://localhost (i.e. dev mode).
 */
export function resolveBackendUrl() {
  if (typeof window === 'undefined') {
    return process.env.REACT_APP_BACKEND_URL || '';
  }

  const envUrl = process.env.REACT_APP_BACKEND_URL || '';
  const origin = window.location.origin;
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  // In local dev, trust the env var verbatim (commonly points to a dev API on a different port)
  if (isLocalhost) {
    return envUrl || origin;
  }

  // In any deployed environment, prefer the current origin. This makes the bundle
  // portable across preview/production/custom domains regardless of what was
  // baked in at build time.
  try {
    if (envUrl) {
      const envHost = new URL(envUrl).host;
      const currentHost = window.location.host;
      if (envHost === currentHost) return envUrl;
    }
  } catch (_) {
    // Malformed env URL — fall through to origin
  }
  return origin;
}

export const BACKEND_URL = resolveBackendUrl();

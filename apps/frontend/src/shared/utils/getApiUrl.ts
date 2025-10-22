/**
 * Dynamic API URL resolution for mobile/PWA support
 * Handles both development and production environments
 */
export const getApiUrl = (): string => {
  // In development: use Vite proxy path
  if (import.meta.env.DEV) {
    return window.location.origin
  }

  // In production/PWA: construct URL from current window location
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
  const host = window.location.hostname
  const port = import.meta.env.VITE_API_PORT || (protocol === 'https:' ? 443 : 4001)

  return `${protocol}//${host}:${port}`
}

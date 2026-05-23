const LEGACY_SSL_MODES = new Set(['prefer', 'require', 'verify-ca']);

export function normalizeDatabaseUrl(databaseUrl: string): string {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    return databaseUrl;
  }

  const sslMode = parsedUrl.searchParams.get('sslmode')?.toLowerCase();
  const hasLibpqCompatFlag = parsedUrl.searchParams.has('uselibpqcompat');

  if (!sslMode || !LEGACY_SSL_MODES.has(sslMode) || hasLibpqCompatFlag) {
    return databaseUrl;
  }

  // Keep pg v8's current strict TLS behavior explicit before pg v9 changes it.
  parsedUrl.searchParams.set('sslmode', 'verify-full');
  return parsedUrl.toString();
}

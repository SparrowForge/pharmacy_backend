const LEGACY_SSL_MODES = new Set(['prefer', 'require', 'verify-ca']);

export function normalizeDatabaseUrl(databaseUrl) {
  let parsedUrl;

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

  parsedUrl.searchParams.set('sslmode', 'verify-full');
  return parsedUrl.toString();
}

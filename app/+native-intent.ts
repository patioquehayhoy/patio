// Validate incoming links before Expo Router / query-string decode them. Their
// legacy decoder is expensive on malformed percent-encoded UTF-8. Patio links
// carry route IDs and auth codes; malformed or excessive input has no valid use.
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    if (typeof path !== 'string' || path.length > 8192 || /[\u0000-\u001f\\]/.test(path)) return '/entrada';
    let decoded = path;
    for (let depth = 0; depth < 4; depth += 1) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) return path;
      decoded = next;
    }
    // Reject excessive nesting instead of passing it to a recursive decoder.
    return decoded.includes('%') ? '/entrada' : path;
  } catch {
    return '/entrada';
  }
}

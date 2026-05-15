// SHA-256 helpers for blob and canonical JSON.
// Used to fingerprint the appraisal PDF and its data payload.

const toHex = (buf: ArrayBuffer): string =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

export const sha256OfBlob = async (blob: Blob): Promise<string> => {
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return toHex(hash);
};

export const sha256OfString = async (text: string): Promise<string> => {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return toHex(hash);
};

// Canonical JSON: sorted keys to make the hash deterministic.
const canonicalize = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']';
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}';
};

export const sha256OfJson = async (value: unknown): Promise<string> => {
  return sha256OfString(canonicalize(value));
};

export const shortHash = (hash: string, head = 8, tail = 6) =>
  `${hash.slice(0, head)}…${hash.slice(-tail)}`;

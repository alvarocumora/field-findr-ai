/** Normalized fields consumed by public document and permit views. */
export interface LegalItem {
  type?: string;
  name?: string;
  title?: string;
  status?: string;
  url?: string;
  file_url?: string;
  verified_at?: string;
  reviewed_at?: string;
  verified_by?: string;
}

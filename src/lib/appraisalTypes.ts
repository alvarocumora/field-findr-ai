export interface AppraisalAnchor {
  protocol?: string;
  network?: string;
  digest?: string;
  submitted_at?: string;
  ok_count?: number;
  calendars?: { url: string; ok?: boolean; error?: string }[];
}
export interface AppraisalVerification {
  anchored?: boolean;
  aggregate?: string;
  confirmed_count?: number;
  pending_count?: number;
  error_count?: number;
  verify_hint?: string;
  checks?: { url: string; status: string; proof_bytes?: number; error?: string }[];
}

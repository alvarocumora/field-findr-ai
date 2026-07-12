/**
 * Map a stored notification to the shape the dashboard `ActivityFeed` renders.
 * Pure + testable; the team activity feed is just the owner's notifications
 * (reservations, payments, leads…) presented chronologically.
 */

export type FeedActivityType = 'sale' | 'lead' | 'meeting' | 'document' | 'payment' | 'alert';
export type FeedActivityStatus = 'success' | 'warning' | 'error' | 'info';

export interface FeedActivity {
  id: string;
  type: FeedActivityType;
  title: string;
  description?: string;
  project?: string;
  timestamp: Date;
  status: FeedActivityStatus;
}

export interface NotificationLike {
  id: string;
  type: string;
  title: string;
  message?: string | null;
  created_at: string;
}

export function notificationToActivity(n: NotificationLike): FeedActivity {
  let type: FeedActivityType;
  let status: FeedActivityStatus = 'info';
  switch (n.type) {
    case 'reservation':
      type = 'sale';
      status = 'success';
      break;
    case 'payment':
      type = 'payment';
      status = 'success';
      break;
    case 'lead':
      type = 'lead';
      break;
    case 'listing':
    case 'property':
    case 'approval':
      type = 'document';
      break;
    default:
      type = 'alert';
  }
  return {
    id: n.id,
    type,
    title: n.title,
    description: n.message ?? undefined,
    timestamp: new Date(n.created_at),
    status,
  };
}

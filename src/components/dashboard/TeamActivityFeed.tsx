import { ActivityFeed } from './ActivityFeed';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationToActivity } from '@/lib/activity/notificationToActivity';

/**
 * Data-connected team activity feed: turns the owner's notifications
 * (reservations, payments, leads…) into the presentational ActivityFeed.
 */
export const TeamActivityFeed = ({ maxItems = 6 }: { maxItems?: number }) => {
  const { data: notifications = [] } = useNotifications();
  const activities = notifications.map(notificationToActivity);
  return <ActivityFeed activities={activities} maxItems={maxItems} />;
};

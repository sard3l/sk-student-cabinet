import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session.js';
import { getNotifications } from '@/lib/db.js';
import NotificationsCenter from '@/components/NotificationsCenter.jsx';

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const notifications = user.role === 'staff' ? [] : getNotifications(user.id);

  return <NotificationsCenter notifications={notifications} />;
}

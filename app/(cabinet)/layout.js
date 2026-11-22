import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session.js';
import { getNotifications } from '@/lib/db.js';
import CabinetShell from '@/components/CabinetShell.jsx';

export default async function CabinetLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const notifications = user.role === 'staff' ? [] : getNotifications(user.id);
  return (
    <CabinetShell user={user} notifications={notifications}>
      {children}
    </CabinetShell>
  );
}

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session.js';
import { getAllRequests } from '@/lib/db.js';
import StaffRequests from '@/components/StaffRequests.jsx';

export default async function StaffRequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'staff') redirect('/');
  return <StaffRequests requests={getAllRequests()} />;
}

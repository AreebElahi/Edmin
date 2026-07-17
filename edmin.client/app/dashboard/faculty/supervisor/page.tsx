import { redirect } from 'next/navigation';

export default function SupervisorDashboardRedirect() {
    redirect('/dashboard/faculty/supervisor/analytics');
}

import { redirect } from 'next/navigation';

export default function StudentPageRedirect() {
    redirect('/dashboard/admin/student/directory');
}

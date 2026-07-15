import { redirect } from 'next/navigation';

export default function FacultyIndex() {
  redirect('/dashboard/admin/faculty/directory');
}

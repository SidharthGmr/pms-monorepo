import { redirect } from 'next/navigation';

// Email templates moved into Settings; the old URL keeps working.
export default function EmailTemplatesPage() {
  redirect('/admin/settings');
}

import { redirect } from 'next/navigation';

// Invoice templates moved into Settings; the old URL keeps working.
export default function InvoiceTemplatesPage() {
  redirect('/admin/settings');
}

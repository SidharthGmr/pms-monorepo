import ExpenseListingWrapper from '@/components/features/expenses/listing-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Expenses',
  description: 'Business expenses, approvals, payments and what each category cost.',
};

export default function ExpensesPage() {
  return (
    <div className="grid gap-5">
      <ExpenseListingWrapper />
    </div>
  );
}

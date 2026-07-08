'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { CreateStaffSalaryModel } from '@/models/staff-salary.model';
import StaffSalarySchema from '@/schema/staffSalarySchema';
import { useCreateStaffSalary, useGetStaffSalaryById, useUpdateStaffSalary } from '@/hooks/service-hooks/useStaffSalaryService';
import { SelectSearch } from '@/components/common/select-search';
import { PaymentStatus } from '@/enums/payment-status.enum';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';

interface ManageStaffSalaryProps {
  id?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

const statusData = Object.values(PaymentStatus).map((status) => ({
  label: status,
  value: status,
}));

const monthsData = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
];

const getCurrentYear = () => new Date().getFullYear();
const yearsData = Array.from({ length: 10 }, (_, i) => {
  const year = getCurrentYear() - i;
  return { label: year.toString(), value: year };
});

export default function ManageStaffSalary({ id, isOpen, onClose }: ManageStaffSalaryProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;

  const { currentUser } = useGetCurrentUser();
  const createStaffSalary = useCreateStaffSalary();
  const updateStaffSalary = useUpdateStaffSalary();
  const { data: staffSalaryResponse, isLoading: isFetching } = useGetStaffSalaryById(id ?? 0, isEdit);

  const form = useForm<CreateStaffSalaryModel>({
    resolver: yupResolver(StaffSalarySchema),
    defaultValues: {
      staffId: 0,
      month: new Date().getMonth() + 1,
      year: getCurrentYear(),
      baseSalary: 0,
      attendanceBonus: undefined,
      deductions: undefined,
      advanceDeduction: undefined,
      netPayable: 0,
      paidAmount: undefined,
      status: PaymentStatus.Pending,
      paymentDate: undefined,
      remarks: '',
      processedBy: undefined,
    },
  });

  const { handleSubmit, reset, setValue, watch } = form;

  // Auto-calculate net payable
  useEffect(() => {
    const subscription = watch((value) => {
      const baseSalary = value.baseSalary || 0;
      const attendanceBonus = value.attendanceBonus || 0;
      const deductions = value.deductions || 0;
      const advanceDeduction = value.advanceDeduction || 0;

      const netPayable = baseSalary + attendanceBonus - deductions - advanceDeduction;
      setValue('netPayable', Math.max(0, netPayable));
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  useEffect(() => {
    if (currentUser?.id) {
      setValue('processedBy', currentUser.id);
    }
  }, [currentUser, setValue]);

  useEffect(() => {
    if (isEdit && staffSalaryResponse?.data?.data) {
      const s = staffSalaryResponse.data.data;
      reset({
        staffId: s.staffId,
        month: s.month,
        year: s.year,
        baseSalary: s.baseSalary,
        attendanceBonus: s.attendanceBonus ?? undefined,
        deductions: s.deductions ?? undefined,
        advanceDeduction: s.advanceDeduction ?? undefined,
        netPayable: s.netPayable,
        paidAmount: s.paidAmount,
        status: s.status,
        paymentDate: s.paymentDate ? new Date(s.paymentDate).toISOString().split('T')[0] : undefined,
        remarks: s.remarks ?? '',
        processedBy: s.processedBy ?? undefined,
      });
    }
  }, [isEdit, staffSalaryResponse, reset]);

  const submitData = async (model: CreateStaffSalaryModel) => {
    let response;
    if (isEdit) {
      response = await updateStaffSalary.mutateAsync({ id: id!, model });
    } else {
      response = await createStaffSalary.mutateAsync(model);
    }

    if (response && (response.status === 200 || response.status === 201)) {
      toast({ variant: 'success', title: `Staff salary record ${isEdit ? 'updated' : 'created'} successfully` });
      onClose(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  const isLoading = createStaffSalary.isPending || updateStaffSalary.isPending || isFetching;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Staff Salary Record' : 'Add New Staff Salary Record'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="space-y-4">
            {/* Row 1: Staff ID, Month, Year */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="staffId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff ID *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter staff ID" {...field} onChange={(e) => field.onChange(+e.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month *</FormLabel>
                    <FormControl>
                      <SelectSearch
                        buttonClass="w-full"
                        placeholder="Select Month"
                        disableSearch={true}
                        items={monthsData}
                        value={field.value?.toString() ?? ''}
                        onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year *</FormLabel>
                    <FormControl>
                      <SelectSearch
                        buttonClass="w-full"
                        placeholder="Select Year"
                        disableSearch={true}
                        items={yearsData}
                        value={field.value?.toString() ?? ''}
                        onChange={(value) => field.onChange(value ? Number(value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: Base Salary, Attendance Bonus */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="baseSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Salary *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={(e) => field.onChange(+e.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="attendanceBonus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attendance Bonus</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Deductions, Advance Deduction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deductions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deductions</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="advanceDeduction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Advance Deduction</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 4: Net Payable (Auto-calculated), Paid Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="netPayable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Net Payable * (Auto-calculated)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} readOnly className="bg-muted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paid Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 5: Status, Payment Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <SelectSearch
                        buttonClass="w-full"
                        placeholder="Select Status"
                        disableSearch={true}
                        items={statusData}
                        value={field.value ?? ''}
                        onChange={(value) => field.onChange(value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 6: Remarks */}
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Add any notes or remarks..."
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onClose(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

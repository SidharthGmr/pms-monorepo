'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useCreateStaff, useGetStaffById, useUpdateStaff } from '@/hooks/service-hooks/useStaffService';
import { useGetAllUserList } from '@/hooks/service-hooks/useUserList.service.hook';
import { CreateStaffModel } from '@/models/staff.model';
import StaffSchema from '@/schema/staffSchema';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface ManageStaffProps {
  id?: number;
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
}

// These would typically come from your API
const departmentsData = [
  { label: 'Sales', value: 'Sales' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'IT', value: 'IT' },
  { label: 'HR', value: 'HR' },
  { label: 'Finance', value: 'Finance' },
  { label: 'Operations', value: 'Operations' },
];

const positionsData = [
  { label: 'Manager', value: 'Manager' },
  { label: 'Assistant Manager', value: 'Assistant Manager' },
  { label: 'Supervisor', value: 'Supervisor' },
  { label: 'Associate', value: 'Associate' },
  { label: 'Cashier', value: 'Cashier' },
  { label: 'Sales Representative', value: 'Sales Representative' },
];

export default function ManageStaff({ id, isOpen, onClose }: ManageStaffProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const isEdit = !!id && id > 0;
  const getAllUserResponse = useGetAllUserList();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const { data: staffResponse, isLoading: isFetching } = useGetStaffById(id ?? 0, isEdit);

  const form = useForm<CreateStaffModel>({
    resolver: yupResolver(StaffSchema),
    defaultValues: {
      position: null,
      department: null,
      hireDate: new Date(),
      salary: null,
      isActive: true,
    },
  });

  const { handleSubmit, reset } = form;

  useEffect(() => {
    if (isEdit && staffResponse?.data?.data) {
      const s = staffResponse.data.data;
      reset({
        position: s.position,
        department: s.department,
        hireDate: s.hireDate ? new Date(s.hireDate) : undefined,
        salary: s.salary,
        isActive: s.isActive,
      });
    }
  }, [isEdit, staffResponse, reset]);

  const submitData = async (model: CreateStaffModel) => {
    let response;
    if (isEdit) {
      response = await updateStaff.mutateAsync({ id: id!, model });
    } else {
      response = await createStaff.mutateAsync(model);
    }

    if (response && (response.status === 200 || response.status === 201)) {
      toast({ variant: 'success', title: `Staff member ${isEdit ? 'updated' : 'created'} successfully` });
      onClose(true);
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  const isLoading = createStaff.isPending || updateStaff.isPending || isFetching;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form autoComplete="off" onSubmit={handleSubmit(submitData)} className="space-y-4">
            {/* Removed Row 1: User ID, Store ID */}

            {/* Row 2: Department, Position */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <SelectSearch
                        buttonClass="w-full"
                        placeholder="Select Department"
                        disableSearch={false}
                        items={departmentsData}
                        value={field.value ?? ''}
                        onChange={(value) => field.onChange(value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <SelectSearch
                        buttonClass="w-full"
                        placeholder="Select Position"
                        disableSearch={false}
                        items={positionsData}
                        value={field.value ?? ''}
                        onChange={(value) => field.onChange(value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Hire Date, Salary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hire Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? null : +e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 4: Active Status */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">Set whether this staff member is currently active</div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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

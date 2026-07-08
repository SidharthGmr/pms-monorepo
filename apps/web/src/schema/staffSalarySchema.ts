import * as Yup from 'yup';
import { CreateStaffSalaryModel } from '@/models/staff-salary.model';

const StaffSalarySchema: Yup.ObjectSchema<CreateStaffSalaryModel> = Yup.object().shape({
    staffId: Yup.number().typeError('Staff ID must be a number').required('Staff ID is required'),
    month: Yup.number().typeError('Month must be a number').min(1, 'Month must be between 1-12').max(12, 'Month must be between 1-12').required('Month is required'),
    year: Yup.number().typeError('Year must be a number').min(2000, 'Year must be >= 2000').max(2100, 'Year must be <= 2100').required('Year is required'),
    baseSalary: Yup.number().typeError('Base salary must be a number').min(0, 'Base salary must be >= 0').required('Base salary is required'),
    attendanceBonus: Yup.number().typeError('Attendance bonus must be a number').min(0, 'Attendance bonus must be >= 0').optional(),
    deductions: Yup.number().typeError('Deductions must be a number').min(0, 'Deductions must be >= 0').optional(),
    advanceDeduction: Yup.number().typeError('Advance deduction must be a number').min(0, 'Advance deduction must be >= 0').optional(),
    netPayable: Yup.number().typeError('Net payable must be a number').min(0, 'Net payable must be >= 0').required('Net payable is required'),
    paidAmount: Yup.number().typeError('Paid amount must be a number').min(0, 'Paid amount must be >= 0').optional(),
    status: Yup.string().optional(),
    paymentDate: Yup.string().optional(),
    remarks: Yup.string().optional(),
    processedBy: Yup.number().typeError('Processed by must be a number').optional(),
});

export default StaffSalarySchema;

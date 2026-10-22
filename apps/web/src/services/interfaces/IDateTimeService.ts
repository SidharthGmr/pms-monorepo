import DropdownBasicDto from '@/types/dropdown-basic.dto';

export default interface IDateTimeService {
  convertToLocalDate(dateTimeOffset: Date | string, displayTime?: boolean, timezone?: string): string;
  convertTimeToAmPm(time: string | null): string;
  getMonths(): DropdownBasicDto[];
  calculateDateDiff(fromDate: Date | string, toDate: Date | string): { year: number; month: number; days: number };
  formatDate(date: Date | string): string;
}

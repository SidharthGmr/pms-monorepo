import DropdownBasicDto from '@/dtos/dropdown-basic.dto';

export default interface IDateTimeService {
  convertToLocalDate(dateTimeOffset: Date, displayTime?: boolean, timezone?: string): string;
  convertTimeToAmPm(time: string | null): string;
  getMonths(): DropdownBasicDto[];
  calculateDateDiff(fromDate: Date, toDate: Date): { year: number; month: number; days: number };
  formatDate(date: Date): string;
}

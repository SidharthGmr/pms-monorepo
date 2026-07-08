import { injectable } from 'inversify';
import IDateTimeService from './interfaces/IDateTimeService';
import moment from 'moment';
import 'moment-timezone';
import DropdownBasicDto from '@/dtos/dropdown-basic.dto';

@injectable()
export default class DateTimeService implements IDateTimeService {
  constructor() {}
  convertToLocalDate(dateTimeOffset: Date, displayTime?: boolean, timezone?: string): string {
    if (!timezone) {
      if (typeof window !== 'undefined') {
        const savedTimeZone = localStorage.getItem('utz') || '';
        if (!savedTimeZone) {
          timezone = 'US/Pacific';
        } else {
          timezone = savedTimeZone;
        }
      }
    }

    timezone = timezone || 'US/Pacific';

    // Parse the DateTimeOffset string and extract the relevant components
    const dateTime = new Date(dateTimeOffset as unknown as string);
    const year = dateTime.getFullYear();
    const month = dateTime.getMonth() + 1; // Months are zero-based, so add 1
    const day = dateTime.getDate();
    const hours = dateTime.getHours();
    const minutes = dateTime.getMinutes();
    const seconds = dateTime.getSeconds();

    // Create a new Date object using the DateTimeOffset components
    const date = new Date(year, month - 1, day, hours, minutes, seconds);
    //const utcDate = moment.utc(date, 'DD-MM-YYYY h:mm:ss A');

    const formattedDateString = displayTime
      ? moment.utc(date).tz(timezone).format('DD MMM, YYYY h:mm a')
      : moment.utc(date).tz(timezone).format('DD MMM, YYYY');

    // const formattedDateString = displayTime
    //   ? moment(date).locale('en').format('DD MMM, YYYY h:mm a')
    //   : moment(date).locale('en').format('DD MMM, YYYY');

    // // Convert the date to the user's timezone
    // const localDateString = date.toLocaleString('en-IN', {
    //   timeZone: timezone,
    //   dateStyle: 'medium',
    //   timeStyle: 'short',
    // });
    // const formattedDateString = displayTime ? localDateString.replace(' at', ',') : localDateString.split('at')[0];

    return formattedDateString;
  }

  convertTimeToAmPm(time: string | null): string {
    if (!time) return '';

    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(Number(hours));
    date.setMinutes(Number(minutes));

    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    };
    const formattedTime = date.toLocaleTimeString([], options);
    return formattedTime;
  }

  getMonths(): DropdownBasicDto[] {
    const months: DropdownBasicDto[] = [
      {
        value: 1,
        label: 'January',
      },
      {
        value: 2,
        label: 'February',
      },
      {
        value: 3,
        label: 'March',
      },
      {
        value: 4,
        label: 'April',
      },
      {
        value: 5,
        label: 'May',
      },
      {
        value: 6,
        label: 'June',
      },
      {
        value: 7,
        label: 'July',
      },
      {
        value: 8,
        label: 'August',
      },
      {
        value: 9,
        label: 'September',
      },
      {
        value: 10,
        label: 'October',
      },
      {
        value: 11,
        label: 'November',
      },
      {
        value: 12,
        label: 'December',
      },
    ];
    return months;
  }

  calculateDateDiff(fromDate: Date, toDate: Date): { year: number; month: number; days: number } {
    const diff = moment(toDate).diff(moment(fromDate), 'milliseconds');
    const duration = moment.duration(diff);
    return {
      year: duration.years(),
      month: duration.months(),
      days: duration.days(),
    };
  }

  formatDate(date: Date): string {
    const now = moment();
    const inputDate = moment(date);

    if (inputDate.isSame(now, 'day')) {
      const hoursDiff = now.diff(inputDate, 'hours');
      const minutesDiff = now.diff(inputDate, 'minutes');

      if (minutesDiff <= 0) {
        return 'just now';
      }

      if (minutesDiff < 60) {
        return `${minutesDiff} minutes ago`;
      }

      return `${hoursDiff} hours ago`;
    }

    if (inputDate.isSame(now.subtract(1, 'day'), 'day')) {
      return 'yesterday';
    }

    const hoursDiff = now.diff(inputDate, 'hours');

    if (hoursDiff < 24) {
      return inputDate.fromNow();
    }

    return inputDate.format('D MMM, YYYY h:mm a');
  }
}

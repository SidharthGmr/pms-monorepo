import { injectable } from "inversify";
import { IDateTimeService } from "./interfaces/idatetime.service";

@injectable()
export class DateTimeService implements IDateTimeService {
  now(): Date {
    return new Date();
  }

  nowISO(): string {
    return new Date().toISOString();
  }

  nowISTString(): string {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());
  }

  nowISTDbString(withSeconds: boolean = true): string {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(new Date());

    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? "";

    const yyyy = get("year");
    const mm = get("month");
    const dd = get("day");
    const hh = get("hour");
    const min = get("minute");
    const sec = get("second");

    return withSeconds
      ? `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`
      : `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  }

  addMinutes(minutes: number): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }
}

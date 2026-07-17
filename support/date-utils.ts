import { addBusinessDays, addWeeks, differenceInCalendarDays } from "date-fns";

export class DateUtils {

  /** Random integer in [min, max] inclusive
   * @param min Lower bound (inclusive).
   * @param max Upper bound (inclusive).
   * @returns A random integer between min and max.
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /** The next weekday after the given date (or today if none given). 
   * @param from The date from which to find the next weekday. Defaults to today.
   * @returns The next weekday date.
   */
  static nextWeekday(from: Date = new Date()): Date {
    return addBusinessDays(from, 1);
  }

  /** A weekday that is `weeksOut` weeks after the given date (or today if none given).
   * @param weeksOut The number of weeks to look ahead (e.g., 2 for two weeks from now)
   * @param from The date from which to calculate. Defaults to today.
   * @returns A weekday date that is `weeksOut` weeks after `from`.
   */
  static weekdayWeeksAhead(weeksOut: number, from: Date = new Date()): Date {
    return this.nextWeekday(addWeeks(from, weeksOut));
  }

  /**
   * Inclusive calendar-day count between two dates. For example, July 1 → July 3 is 3 days.
   * @param start The start date of the range.
   * @param end The end date of the range.
   * @returns The number of calendar days in the range, inclusive.
   */
  static calendarDaysInRange(start: Date, end: Date): number {
    // +1 because the range is inclusive of both endpoints.
    return differenceInCalendarDays(end, start) + 1;
  }

  /** Full month + year as shown in the picker header, e.g. "July 2026". 
   * @param date The date to format.
   * @returns The month + year label for the date.
  */
  static monthYear(date: Date): string {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  static dayOfMonth(date: Date): number {
    return date.getDate();
  }
}

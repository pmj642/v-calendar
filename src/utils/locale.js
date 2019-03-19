import { format, parse } from '@/utils/fecha';
import { isDate, isNumber, isString, isObject } from '@/utils/_';

const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export default class Locale {
  constructor({ id, firstDayOfWeek, masks }) {
    this.id = id;
    this.firstDayOfWeek = firstDayOfWeek;
    this.masks = masks;
    this.dayNames = this.getDayNames('long');
    this.dayNamesShort = this.getDayNames('short');
    this.dayNamesShorter = this.dayNamesShort.map(s => s.substring(0, 2));
    this.dayNamesNarrow = this.getDayNames('narrow');
    this.monthNames = this.getMonthNames('long');
    this.monthNamesShort = this.getMonthNames('short');
    this.monthData = {};
    // Bind methods
    this.parse = this.parse.bind(this);
    this.format = this.format.bind(this);
    this.toDate = this.toDate.bind(this);
  }

  parse(dateStr, mask) {
    return parse(dateStr, mask || this.masks.L, this);
  }

  format(date, mask) {
    return format(date, mask || this.masks.L, this);
  }

  toDate(d, mask) {
    if (isDate(d)) {
      return new Date(d.getTime());
    }
    if (isNumber(d)) {
      return new Date(d);
    }
    if (isString(d)) {
      return this.parse(d, mask);
    }
    if (isObject(d)) {
      const date = new Date();
      return new Date(
        d.year || date.getFullYear(),
        d.month || date.getMonth(),
        d.day || date.getDate(),
      );
    }
    return d;
  }

  getMonthDates(year = 2000) {
    const dates = [];
    for (let i = 0; i < 12; i++) {
      dates.push(new Date(year, i, 15));
    }
    return dates;
  }

  getMonthNames(length) {
    const dtf = new Intl.DateTimeFormat(this.id, {
      month: length,
      timezome: 'UTC',
    });
    return this.getMonthDates().map(d => dtf.format(d));
  }

  getWeekdayDates({ year = 2000, utc = false }) {
    const dates = [];
    for (let i = 1, j = 0; j < 7; i++) {
      const d = utc ? new Date(Date.UTC(year, 0, i)) : new Date(year, 0, i);
      const day = utc ? d.getUTCDay() : d.getDay();
      if (day === this.firstDayOfWeek - 1 || j > 0) {
        dates.push(d);
        j++;
      }
    }
    return dates;
  }

  getDayNames(length) {
    const dtf = new Intl.DateTimeFormat(this.id, {
      weekday: length,
      timeZone: 'UTC',
    });
    return this.getWeekdayDates({ utc: true }).map(d => dtf.format(d));
  }

  // Days/month/year components for a given month and year
  getMonthComps(month, year) {
    const key = `${month}.${year}`;
    let comps = this.monthData[key];
    if (!comps) {
      const inLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      const firstWeekday = new Date(year, month - 1, 1).getDay() + 1;
      const days = month === 2 && inLeapYear ? 29 : daysInMonths[month - 1];
      const weeks = Math.ceil(
        (days + Math.abs(firstWeekday - this.firstDayOfWeek)) / 7,
      );
      comps = {
        firstDayOfWeek: this.firstDayOfWeek,
        inLeapYear,
        firstWeekday,
        days,
        weeks,
        month,
        year,
      };
      this.monthData[key] = comps;
    }
    return comps;
  }

  // Days/month/year components for today's month
  getThisMonthComps() {
    const date = new Date();
    return this.getMonthComps(date.getMonth() + 1, date.getFullYear());
  }

  // Day/month/year components for previous month
  getPrevMonthComps(month, year) {
    if (month === 1) return this.getMonthComps(12, year - 1);
    return this.getMonthComps(month - 1, year);
  }

  // Day/month/year components for next month
  getNextMonthComps(month, year) {
    if (month === 12) return this.getMonthComps(1, year + 1);
    return this.getMonthComps(month + 1, year);
  }
}
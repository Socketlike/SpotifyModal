import { Injector, Logger } from 'replugged';

export * from './events';
export * from './react';
export * from './spotify';

export const injector = new Injector();

export const logger = Logger.plugin('SpotifyModal');

export const toClassNameString = (...args: string[]): string =>
  args
    .filter((className) => typeof className === 'string' && Boolean(className))
    .toString()
    .replace(/,/g, ' ');

export const toggleClass = (element: HTMLElement, className: string, toggle: boolean): void => {
  if (toggle && !element?.classList?.contains?.(className)) element.classList.add(className);
  else if (!toggle && element?.classList?.contains?.(className))
    element.classList.remove(className);
};

export function calculatePercentage(current: number, end: number): string {
  if (!end) return '0%';
  return `${((current / end) * 100).toFixed(4)}%`;
}

export function parseTime(ms: number): string {
  if (typeof ms !== 'number') return '';

  const dateObject = new Date(ms);
  const raw = {
    month: dateObject.getUTCMonth(),
    day: dateObject.getUTCDate(),
    hours: dateObject.getUTCHours(),
    minutes: dateObject.getUTCMinutes(),
    seconds: dateObject.getUTCSeconds(),
  };
  const parsedHours = raw.hours + (raw.day - 1) * 24 + raw.month * 30 * 24;

  return `${parsedHours > 0 ? `${parsedHours}:` : ''}${
    raw.minutes < 10 && parsedHours > 0 ? `0${raw.minutes}` : raw.minutes
  }:${raw.seconds < 10 ? `0${raw.seconds}` : raw.seconds}`;
}

export function overflowMitigation(element: HTMLElement): void {
  if (element.scrollWidth > element.offsetWidth + 10) {
    element.style.setProperty(
      '--scroll-space',
      `-${(element.scrollWidth - element.offsetWidth).toString()}px`,
    );

    element.style.setProperty(
      '--animation-duration',
      `${((element.scrollWidth - element.offsetWidth) * 50).toString()}ms`,
    );

    if (!element.classList.contains('overflow')) element.classList.add('overflow');
  } else if (element.classList.contains('overflow')) element.classList.remove('overflow');
}

export function filterObject<T extends Record<string, unknown>>(
  obj: T,
  predicate: (value: T[keyof T], key: keyof T) => boolean,
): T {
  return Object.entries(obj)
    .filter(([key, value]) => predicate(value as T[keyof T], key as keyof T))
    .reduce((acc, [key, value]): T => {
      acc[key as keyof T] = value as T[keyof T];
      return acc;
      // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
    }, {} as T);
}

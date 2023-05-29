/* eslint-disable no-implicit-coercion */
import { Logger } from 'replugged';

export const logger = Logger.plugin('SpotifyModal');

/* We need to check if class exists or not to ignore toggle request - just <element>.classList.toggle is not enough */
export const toggleClass = (element: HTMLElement, className: string, toggle: boolean): void => {
  if (toggle && !element.classList.contains(className)) element.classList.add(className);
  else if (!toggle && element.classList.contains(className)) element.classList.remove(className);
};

export const toClassString = (...classNames: string[]): string =>
  classNames
    .map((className) => className.trim())
    .filter((className) => !!className)
    .toString()
    .replaceAll(',', ' ');

export const logWithTag =
  (tag: string) =>
  (
    level: Omit<typeof logger, 'type' | 'name' | 'color'>[keyof Omit<
      typeof logger,
      'type' | 'name' | 'color'
    >],
    ...args: unknown[]
  ): void =>
    level.call(logger, tag, ...args);

export function calculatePercentage(current: number, end: number): string {
  if (!end) return '0%';
  return `${((current / end) * 100).toFixed(4)}%`;
}

// This is the best solution so far though not quite performant (I tried moment.js)
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

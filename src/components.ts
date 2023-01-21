import { Component, EventEmitter } from './common';
import { SpotifyTrack } from './types';

declare const DiscordNative: {
  clipboard: {
    copy: (content: string) => void;
  };
};

class PlayPauseIcon extends Component {
  public play = new Component('path', {
    classes: 'play-path',
    props: { fill: 'currentColor', d: 'M8,5.14V19.14L19,12.14L8,5.14Z' },
  });

  public pause = new Component('path', {
    classes: 'pause-path',
    props: { fill: 'currentColor', d: 'M14,19H18V5H14M6,19H10V5H6V19Z' },
  });

  public defaultColor = 'var(--text-normal)';
  public hoverColor = 'var(--brand-experiment-500)';
  #state = false;

  public constructor(
    defaultColor = 'var(--text-normal)',
    hoverColor = 'var(--brand-experiment-500)',
  ) {
    super('svg', {
      classes: 'play-pause-icon',
      props: { viewBox: '0 0 24 24' },
      style: { minWidth: '24px', height: '24px', margin: '0px 10px', transitionDuration: '400ms' },
    });

    this.defaultColor = typeof defaultColor === 'string' ? defaultColor : this.defaultColor;
    this.hoverColor = typeof hoverColor === 'string' ? hoverColor : this.hoverColor;
    this.addChildren(this.play);
    this.setStyle({ color: this.defaultColor });

    this.on('mouseenter', (): void => this.setStyle({ color: this.hoverColor }));
    this.on('mouseleave', (): void => this.setStyle({ color: this.defaultColor }));
  }

  get state(): boolean {
    return this.#state;
  }

  set state(state: boolean) {
    if (this.#state === state) return;
    this.#state = Boolean(state);
    this.updateIcon();
  }

  public reset(): void {
    this.state = false;
  }

  public updateIcon(): void {
    if ([...this.children.values()][0].classes.contains('play-path') && !this.#state) return;
    if ([...this.children.values()][0].classes.contains('pause-path') && this.#state) return;

    this.replaceChildren(this.#state ? this.pause : this.play);
  }

  public flipState(): void {
    this.state = !this.#state;
  }
}

class RepeatIcon extends Component {
  public all = new Component('path', {
    classes: 'repeat-all-path',
    props: {
      fill: 'currentColor',
      d: 'M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z',
    },
  });

  public one = new Component('path', {
    classes: 'repeat-one-path',
    props: {
      fill: 'currentColor',
      d: 'M13,15V9H12L10,10V11H11.5V15M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z',
    },
  });

  public title = new Component('title', {
    children: [document.createTextNode('Repeat off')],
    classes: 'repeat-icon-title',
  });

  public defaultColor = 'var(--text-normal)';
  public hoverColor = 'var(--brand-experiment-300)';
  public onColor = 'var(--brand-experiment-500)';
  #state = false;
  #mode: 'one' | 'all' = 'all';
  #realMode: 'off' | 'context' | 'track' = 'off';

  public constructor(
    defaultColor = 'var(--text-normal)',
    hoverColor = 'var(--brand-experiment-300)',
    onColor = 'var(--brand-experiment-500)',
  ) {
    super('svg', {
      classes: 'repeat-icon',
      props: { viewBox: '0 0 24 24' },
      style: {
        minWidth: '24px',
        height: '24px',
        margin: '0px 10px 0px auto',
        transitionDuration: '400ms',
      },
    });

    this.defaultColor = typeof defaultColor === 'string' ? defaultColor : this.defaultColor;
    this.hoverColor = typeof hoverColor === 'string' ? hoverColor : this.hoverColor;
    this.onColor = typeof onColor === 'string' ? onColor : this.onColor;
    this.addChildren(this.title, this.all);
    this.setStyle({ color: this.defaultColor });

    this.on('mouseenter', (): void => {
      this.setStyle({ color: this.hoverColor });
    });
    this.on('mouseleave', (): void => {
      this.setStyle({ color: this.#state ? this.onColor : this.defaultColor });
    });
  }

  public get state(): boolean {
    return this.#state;
  }

  public set state(state: boolean) {
    if (this.#state === state) return;
    this.#state = state;
    this.updateIconState();
  }

  public get mode(): string {
    return this.#mode;
  }

  public get realMode(): string {
    return this.#realMode;
  }

  public set mode(mode: 'off' | 'context' | 'track') {
    if (!['off', 'context', 'track'].includes(mode)) return;
    this.#mode = mode === 'track' ? 'one' : 'all';
    this.#realMode = mode;
    this.updateIconMode();
  }

  public set titleText(title: string) {
    if (typeof title !== 'string') return;
    this.title.replaceChildren(document.createTextNode(title));
  }

  public reset(): void {
    this.state = false;
    this.mode = 'off';
    this.titleText = 'Repeat off';
  }

  public updateIconState(): void {
    this.setStyle({ color: this.#state ? this.onColor : this.defaultColor });
  }

  public updateIconMode(): void {
    if ([...this.children.values()][0].classes.contains('repeat-all-path') && this.#mode === 'all')
      return;
    if ([...this.children.values()][0].classes.contains('repeat-one-path') && this.#mode === 'one')
      return;

    this.replaceChildren(this.#mode === 'all' ? this.all : this.one);
  }

  public flipState(): void {
    this.state = !this.#state;
  }

  public flipMode(): void {
    this.mode = this.#mode === 'all' ? 'one' : 'all';
  }
}

class ShuffleIcon extends Component {
  public path = new Component('path', {
    classes: 'shuffle-icon-path',
    props: {
      fill: 'currentColor',
      d: 'M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4L16.54,6.04L4,18.59L5.41,20L17.96,7.46L20,9.5V4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z',
    },
  });

  public title = new Component('title', {
    classes: 'shuffle-icon-title',
  });

  public defaultColor = 'var(--text-normal)';
  public hoverColor = 'var(--brand-experiment-300)';
  public onColor = 'var(--brand-experiment-500)';
  #state = false;

  public constructor(
    defaultColor = 'var(--text-normal)',
    hoverColor = 'var(--brand-experiment-300)',
    onColor: 'var(--brand-experiment-500)',
  ) {
    super('svg', {
      classes: 'shuffle-icon',
      props: { viewBox: '0 0 24 24' },
      style: { minWidth: '24px', height: '24px', transitionDuration: '400ms' },
    });

    this.defaultColor = typeof defaultColor === 'string' ? defaultColor : this.defaultColor;
    this.hoverColor = typeof hoverColor === 'string' ? hoverColor : this.hoverColor;
    this.onColor = typeof onColor === 'string' ? onColor : this.onColor;
    this.addChildren(this.title, this.path);
    this.setStyle({ color: this.defaultColor });

    this.on('mouseenter', (): void => {
      this.setStyle({ color: this.hoverColor });
    });
    this.on('mouseleave', (): void => {
      this.setStyle({ color: this.#state ? this.onColor : this.defaultColor });
    });
  }

  public get state(): boolean {
    return this.#state;
  }

  public set state(state: boolean) {
    if (this.#state === state) return;
    this.#state = state;
    this.updateIcon();
  }

  public set titleText(title: string) {
    if (typeof title !== 'string') return;
    this.title.replaceChildren(document.createTextNode(title));
  }

  public reset(): void {
    this.state = false;
    this.titleText = 'Shuffle off';
  }

  public updateIcon(): void {
    this.setStyle({ color: this.#state ? this.onColor : this.defaultColor });
  }

  public flipState(): void {
    this.state = !this.#state;
  }
}

class SkipPrevIcon extends Component {
  public path = new Component('path', {
    classes: 'skip-previous-icon-path',
    props: { fill: 'currentColor', d: 'M6,18V6H8V18H6M9.5,12L18,6V18L9.5,12Z' },
  });

  public defaultColor = 'var(--text-normal)';
  public hoverColor = 'var(--brand-experiment-500)';

  public constructor(
    defaultColor = 'var(--text-normal)',
    hoverColor = 'var(--brand-experiment-500)',
  ) {
    super('svg', {
      classes: 'skip-previous-icon',
      props: { viewBox: '0 0 24 24' },
      style: { minWidth: '24px', height: '24px', marginLeft: 'auto', transitionDuration: '400ms' },
    });

    this.defaultColor = typeof defaultColor === 'string' ? defaultColor : this.defaultColor;
    this.hoverColor = typeof hoverColor === 'string' ? hoverColor : this.hoverColor;
    this.addChildren(this.path);
    this.setStyle({ color: this.defaultColor });

    this.on('mouseenter', (): void => this.setStyle({ color: this.hoverColor }));
    this.on('mouseleave', (): void => this.setStyle({ color: this.defaultColor }));
  }
}

class SkipNextIcon extends Component {
  public path = new Component('path', {
    classes: 'skip-next-icon-path',
    props: { fill: 'currentColor', d: 'M16,18H18V6H16M6,18L14.5,12L6,6V18Z' },
  });

  public defaultColor = 'var(--text-normal)';
  public hoverColor = 'var(--brand-experiment-500)';

  public constructor(
    defaultColor = 'var(--text-normal)',
    hoverColor = 'var(--brand-experiment-500)',
  ) {
    super('svg', {
      classes: 'skip-next-icon',
      props: { viewBox: '0 0 24 24' },
      style: { minWidth: '24px', height: '24px', transitionDuration: '400ms' },
    });

    this.defaultColor = typeof defaultColor === 'string' ? defaultColor : this.defaultColor;
    this.hoverColor = typeof hoverColor === 'string' ? hoverColor : this.hoverColor;
    this.addChildren(this.path);
    this.setStyle({ color: this.defaultColor });

    this.on('mouseenter', (): void => this.setStyle({ color: this.hoverColor }));
    this.on('mouseleave', (): void => this.setStyle({ color: this.defaultColor }));
  }
}

export const icons = {
  PlayPauseIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipPrevIcon,
  SkipNextIcon,
};

class DockIcons extends Component {
  public shuffle = new ShuffleIcon();
  public skipPrevious = new SkipPrevIcon();
  public playPause = new PlayPauseIcon();
  public skipNext = new SkipNextIcon();
  public repeat = new RepeatIcon();

  public fade = {
    _: {
      display: 'flex',
      fadein: this.addAnimation({ opacity: [0, 1] }, 700),
      fadeout: this.addAnimation({ opacity: [1, 0] }, 700),
    },
    fadein: (): void => {
      if (this.element.style.display === 'none') {
        this.setStyle({ display: this.fade._.display });
        this.fade._.fadein.play();
      }
    },
    fadeout: (): void => {
      if (this.element.style.display !== 'none') {
        this.fade._.fadeout.play();
        this.fade._.fadeout.onfinish = (): void => {
          this.setStyle({ display: 'none' });
        };
      }
    },
  };

  public constructor() {
    super('div', {
      classes: 'dock-icons',
      style: {
        paddingTop: '5px',
        paddingLeft: '5px',
        height: '24px',
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
      },
    });

    this.addChildren(this.shuffle, this.skipPrevious, this.playPause, this.skipNext, this.repeat);
  }

  public reset(): void {
    this.shuffle.reset();
    this.repeat.reset();
  }
}

class Title extends Component {
  public _scrollingAnimation(): void {
    if (this.#animation && this.#animation?.playState === 'running') {
      this.animations = [] as Animations[];
      this.#animation.cancel();
    }

    this.#animation = this.addAnimation(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(0)', offset: 0.2 },
        {
          transform: `translateX(-${this.element.scrollWidth - this.element.offsetWidth}px)`,
          offset: 0.8,
        },
        { transform: `translateX(-${this.element.scrollWidth - this.element.offsetWidth}px)` },
      ],
      {
        iterations: Infinity,
        duration: (this.element.scrollWidth - this.element.offsetWidth) * 50,
        direction: 'alternate-reverse',
        easing: 'linear',
      },
    );

    this.#animation.play();
  }

  public color = 'var(--text-normal)';
  public defaultText = 'None';
  public textOverflowClass = '';
  #lastScrollWidth = this.scrollWidth;
  #animation: Animation | undefined = undefined;

  public constructor(
    color = 'var(--text-normal)',
    defaultText = 'None',
    textOverflowClass?: string,
  ) {
    super('a', {
      classes: 'song-title',
      props: { target: '_blank' },
      style: { fontSize: '14px' },
    });

    this.color = typeof color === 'string' ? color : this.color;
    this.defaultText = typeof defaultText === 'string' ? defaultText : this.defaultText;
    this.textOverflowClass = typeof textOverflowClass === 'string' ? textOverflowClass : '';
    this.addChildren(document.createTextNode(this.defaultText));
    this.setStyle({ color: this.color });

    this.on('contextmenu', () => {
      if (this.element.href) DiscordNative.clipboard.copy(this.element.href);
    });
  }

  public get scrollWidth(): number {
    return this.element.scrollWidth;
  }

  public setInnerText(text?: string, id?: string) {
    if (typeof text !== 'string' || !text) {
      this.setProps({ innerText: this.defaultText, title: '', href: '' });
      this.setStyle({
        textDecoration: 'none',
        cursor: 'default',
      });
      if (this.#animation?.playState === 'running') this.#animation.cancel();
      if (this.classes.contains(this.textOverflowClass)) this.removeClasses(this.textOverflowClass);
    } else {
      this.setProps({
        innerText: text,
        title: text,
        href: typeof id === 'string' ? `https://open.spotify.com/track/${id}` : '',
      });
      this.setStyle({
        textDecoration: typeof id === 'string' ? '' : 'none',
        cursor: typeof id === 'string' ? '' : 'default',
      });
      if (this.element.scrollWidth > (this.element.offsetWidth as number) + 10) {
        if (this.classes.contains(this.textOverflowClass))
          this.removeClasses(this.textOverflowClass);
        if (this.#animation?.playState !== 'running') this._scrollingAnimation();
        else if (
          this.#animation?.playState === 'running' &&
          this.#lastScrollWidth !== this.scrollWidth
        ) {
          this.#lastScrollWidth = this.scrollWidth;
          this._scrollingAnimation();
        }
      } else {
        this.addClasses(this.textOverflowClass);
        if (this.#animation?.playState === 'running') this.#animation.cancel();
      }
    }
  }

  public reset(): void {
    this.setInnerText();
  }
}

class Artists extends Component {
  public _scrollingAnimation(): void {
    if (this.#animation && this.#animation?.playState === 'running') {
      this.animations = [] as Animations[];
      this.#animation.cancel();
    }

    this.#animation = this.addAnimation(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(0)', offset: 0.2 },
        {
          transform: `translateX(-${this.element.scrollWidth - this.element.offsetWidth}px)`,
          offset: 0.8,
        },
        { transform: `translateX(-${this.element.scrollWidth - this.element.offsetWidth}px)` },
      ],
      {
        iterations: Infinity,
        duration: (this.element.scrollWidth - this.element.offsetWidth) * 50,
        direction: 'alternate-reverse',
        easing: 'linear',
      },
    );

    this.#animation.play();
  }

  public textOverflowClass = '';
  public defaultText = 'None';
  public color = 'var(--header-secondary)';
  #animation: Animation | undefined = undefined;
  #lastScrollWidth: number | undefined = undefined;

  public constructor(
    color = 'var(--header-secondary)',
    defaultText = 'None',
    textOverflowClass?: string,
  ) {
    super('span', {
      classes: 'song-artists',
      props: { target: '_blank' },
      style: { fontSize: '13px' },
    });

    this.color = typeof color === 'string' ? color : this.color;
    this.defaultText = typeof defaultText === 'string' ? defaultText : this.defaultText;
    this.textOverflowClass = typeof textOverflowClass === 'string' ? textOverflowClass : '';
    this.addChildren(document.createTextNode(this.defaultText));
    this.setStyle({ color: this.color });
  }

  public get scrollWidth(): number {
    return this.element.scrollWidth;
  }

  public setInnerText(
    artists: SpotifyUser[],
    anchorClasses?: string,
    enableTooltip?: boolean,
    onRightClick?: (mouseEvent: MouseEvent) => any,
  ): void {
    if (typeof artists !== 'object' || !Array.isArray(artists)) {
      this.setInnerText([{ name: this.default }]);
      return;
    }

    const elements = [] as Array<HTMLAnchorElement | Node>;

    artists.forEach(({ name, id }, index) => {
      let el: Node | HTMLAnchorElement;

      if (typeof id === 'string') {
        el = document.createElement('a') as HTMLAnchorElement;

        el.target = '_blank';
        el.href = `https://open.spotify.com/artist/${id}`;
        el.style.color = 'var(--header-secondary)';
        if (typeof anchorClasses === 'string') el.classList.add(...anchorClasses.split(' '));
        if (enableTooltip) el.title = name;
        if (typeof onRightClick === 'function') el.onrightclick = onRightClick;
        el.appendChild(document.createTextNode(name));
      } else {
        el = document.createTextNode(name) as Node;
      }

      elements.push(el);
      if (artists.length - 1 !== index) elements.push(document.createTextNode(', '));
    });

    if (!elements.length) elements.push(document.createTextNode('Unknown'));

    this.replaceChildren(...elements);

    if (this.element.scrollWidth > (this.element.offsetWidth as number) + 10) {
      if (this.classes.contains(this.textOverflowClass)) this.removeClasses(this.textOverflowClass);
      if (this.#animation?.playState !== 'running') this._scrollingAnimation();
      else if (
        this.#animation?.playState === 'running' &&
        this.#lastScrollWidth !== this.scrollWidth
      ) {
        this.#lastScrollWidth = this.scrollWidth;
        this._scrollingAnimation();
      }
    } else {
      this.addClasses(this.textOverflowClass);
      if (this.#animation?.playState === 'running') this.#animation.cancel();
    }
  }

  public reset(): void {
    this.setInnerText();
  }
}

class Metadata extends Component {
  public title = new Title();
  public artists = new Artists();

  public fade = {
    _: {
      display: 'flex',
      fadein: this.addAnimation({ opacity: [0, 1] }, 700),
      fadeout: this.addAnimation({ opacity: [1, 0] }, 700),
    },
    fadein: (): void => {
      if (this.element.style.display === 'none') {
        this.setStyle({ display: this.fade._.display });
        this.fade._.fadein.play();
      }
    },
    fadeout: (): void => {
      if (this.element.style.display !== 'none') {
        this.fade._.fadeout.play();
        this.fade._.fadeout.onfinish = (): void => {
          this.setStyle({ display: 'none' });
        };
      }
    },
  };

  public constructor() {
    super('div', {
      classes: 'metadata',
      style: {
        margin: '10px',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '145px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      },
    });

    this.addChildren(this.title, this.artists);
  }

  public reset(): void {
    this.title.reset();
    this.artists.reset();
  }
}

function parseTime(ms: number): string {
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

class PlaybackTimeCurrent extends Component {
  public constructor() {
    super('span', {
      classes: 'playback-time-current',
    });

    this.reset();
  }

  public update(timeInMS: number): void {
    if (typeof timeInMS !== 'number') return;
    const time = parseTime(timeInMS);
    if (time !== this.element.innerText) this.setProps({ innerText: time });
  }

  public reset(): void {
    this.setProps({ innerText: '0:00' });
  }
}

class PlaybackTimeDuration extends Component {
  public constructor() {
    super('span', {
      classes: 'playback-time-duration',
      style: { marginLeft: 'auto', marginRight: '16px' },
    });

    this.reset();
  }

  public update(timeInMS: number): void {
    if (typeof timeInMS !== 'number') return;
    const time = parseTime(timeInMS);
    if (time !== this.element.innerText) this.setProps({ innerText: time });
  }

  public reset(): void {
    this.setProps({ innerText: '0:00' });
  }
}

class PlaybackTimeDisplay extends Component {
  public current = new PlaybackTimeCurrent();
  public duration = new PlaybackTimeDuration();

  public fade = {
    _: {
      display: 'flex',
      fadein: this.addAnimation({ opacity: [0, 1] }, 700),
      fadeout: this.addAnimation({ opacity: [1, 0] }, 700),
    },
    fadein: (): void => {
      if (this.element.style.display === 'none') {
        this.setStyle({ display: this.fade._.display });
        this.fade._.fadein.play();
      }
    },
    fadeout: (): void => {
      if (this.element.style.display !== 'none') {
        this.fade._.fadeout.play();
        this.fade._.fadeout.onfinish = (): void => {
          this.setStyle({ display: 'none' });
        };
      }
    },
  };

  public color = 'var(--text-normal)';

  public constructor(color = 'var(--text-normal)') {
    super('div', {
      classes: 'playback-time',
      style: {
        display: 'flex',
        position: 'relative',
        top: '-5px',
        left: '8px',
        height: '16px',
        fontSize: '12px',
      },
    });

    this.color = typeof color === 'string' ? color : this.color;
    this.addChildren(this.current, this.duration);
    this.setStyle({ color: this.color });
  }

  public update(currentTime: number, durationTime: number): void {
    this.current.update(currentTime);
    this.duration.update(durationTime);
  }

  public reset(): void {
    this.current.reset();
    this.duration.reset();
  }
}

class ProgressBarInner extends Component {
  public color = 'var(--text-normal)';

  public constructor(color = 'var(--text-normal)') {
    super('div', {
      classes: 'progressbar-inner',
      style: {
        height: '4px',
        width: '0%',
        maxWidth: '100%',
        borderRadius: '8px',
      },
    });

    this.color = typeof color === 'string' ? color : this.color;
    this.setStyle({ backgroundColor: this.color });
  }

  public update(current: number, end: number): void {
    if (typeof current !== 'number' || typeof end !== 'number') return;
    if (!end) this.reset();
    else this.setStyle({ width: `${((current / end) * 100).toFixed(4)}%` });
  }

  public reset(): void {
    this.setStyle({ width: '0%' });
  }
}

class ProgressBarEventEmitter extends EventEmitter {}

class ProgressBar extends Component {
  public inner = new ProgressBarInner();

  public fade = {
    _: {
      display: '',
      fadein: this.addAnimation({ opacity: [0, 1] }, 700),
      fadeout: this.addAnimation({ opacity: [1, 0] }, 700),
    },
    fadein: (): void => {
      if (this.element.style.display === 'none') {
        this.setStyle({ display: this.fade._.display });
        this.fade._.fadein.play();
      }
    },
    fadeout: (): void => {
      if (this.element.style.display !== 'none') {
        this.fade._.fadeout.play();
        this.fade._.fadeout.onfinish = (): void => {
          this.setStyle({ display: 'none' });
        };
      }
    },
  };

  public color = 'var(--background-modifier-accent)';
  public events = new ProgressBarEventEmitter();

  public constructor(color = 'var(--background-modifier-accent)') {
    super('div', {
      classes: 'progressbar',
      style: {
        height: '4px',
        borderRadius: '8px',
        width: 'calc(100% - 10px)',
        position: 'relative',
        left: '5px',
        top: '-3px',
      },
    });

    this.color = typeof color === 'string' ? color : this.color;
    this.addChildren(this.inner);
    this.setStyle({ backgroundColor: this.color });

    this.on('click', (mouseEvent: MouseEvent): void => {
      this.events.emit('scrub', mouseEvent.offsetX / this.element.offsetWidth);
    });
  }

  public reset(): void {
    this.inner.reset();
  }
}

class CoverArt extends Component {
  public fade = {
    _: {
      display: '',
      fadein: this.addAnimation({ opacity: [0, 1] }, 700),
      fadeout: this.addAnimation({ opacity: [1, 0] }, 700),
    },
    fadein: (): void => {
      if (this.element.style.display === 'none') {
        this.setStyle({ display: this.fade._.display });
        this.fade._.fadein.play();
      }
    },
    fadeout: (): void => {
      if (this.element.style.display !== 'none') {
        this.fade._.fadeout.play();
        this.fade._.fadeout.onfinish = (): void => {
          this.setStyle({ display: 'none' });
        };
      }
    },
  };

  #albumId = '';

  public constructor() {
    super('img', {
      classes: 'cover-art',
      style: {
        maxHeight: '80%',
        maxWidth: '80%',
        borderRadius: '8px',
        objectFit: 'contain',
      },
    });

    this.on('click', () => {
      if (this.#albumId) window.open(`https://open.spotify.com/album/${this.#albumId}`, '_blank');
    });

    this.on('contextmenu', () => {
      if (this.#albumId)
        DiscordNative.clipboard.copy(`https://open.spotify.com/album/${this.#albumId}`);
    });
  }

  public update(url: string, albumName?: string, albumId?: string): void {
    if (typeof url !== 'string') return;
    this.setProps({ src: url });
    this.#albumId = typeof albumId === 'string' ? albumId : '';
    this.setProps({ title: typeof albumName === 'string' ? albumName : '' });
    this.setStyle({ cursor: this.#albumId ? 'pointer' : '' });
  }

  public reset(): void {
    this.update('');
  }
}

class Dock extends Component {
  public playbackTimeDisplay = new PlaybackTimeDisplay();
  public progressBar = new ProgressBar();
  public dockIcons = new DockIcons();

  public fade = {
    _: {
      display: 'flex',
      fadein: this.addAnimation({ opacity: [0, 1] }, 700),
      fadeout: this.addAnimation({ opacity: [1, 0] }, 700),
    },
    fadein: (): void => {
      if (this.element.style.display === 'none') {
        this.setStyle({ display: this.fade._.display });
        this.fade._.fadein.play();
      }
    },
    fadeout: (): void => {
      if (this.element.style.display !== 'none') {
        this.fade._.fadeout.play();
        this.fade._.fadeout.onfinish = (): void => {
          this.setStyle({ display: 'none' });
        };
      }
    },
  };

  public constructor() {
    super('div', {
      classes: 'dock',
      style: {
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: '6px',
      },
    });

    this.addChildren(this.playbackTimeDisplay, this.progressBar, this.dockIcons);
  }

  public reset(): void {
    this.playbackTimeDisplay.reset();
    this.progressBar.reset();
    this.dockIcons.reset();
  }
}

class ModalHeader extends Component {
  public coverArt = new CoverArt();
  public metadata = new Metadata();

  public fade = {
    _: {
      display: 'flex',
      fadein: this.addAnimation({ opacity: [0, 1] }, 700),
      fadeout: this.addAnimation({ opacity: [1, 0] }, 700),
    },
    fadein: (): void => {
      if (this.element.style.display === 'none') {
        this.setStyle({ display: this.fade._.display });
        this.fade._.fadein.play();
      }
    },
    fadeout: (): void => {
      if (this.element.style.display !== 'none') {
        this.fade._.fadeout.play();
        this.fade._.fadeout.onfinish = (): void => {
          this.setStyle({ display: 'none' });
        };
      }
    },
  };

  public constructor() {
    super('div', {
      classes: 'modal-header',
      style: {
        display: 'flex',
        height: '60px',
        marginTop: '6px',
        paddingBottom: '10px',
        paddingLeft: '8px',
      },
    });

    this.addChildren(this.coverArt, this.metadata);
  }

  public reset(): void {
    this.coverArt.reset();
    this.metadata.reset();
  }
}

class ModalContainer extends Component {
  public header = new ModalHeader();
  public dock = new Dock();

  public fade = {
    _: {
      display: 'flex',
      fadein: this.addAnimation({ opacity: [0, 1] }, 700),
      fadeout: this.addAnimation({ opacity: [1, 0] }, 700),
    },
    fadein: (): void => {
      if (this.element.style.display === 'none') {
        this.setStyle({ display: this.fade._.display });
        this.fade._.fadein.play();
      }
    },
    fadeout: (): void => {
      if (this.element.style.display !== 'none') {
        this.fade._.fadeout.play();
        this.fade._.fadeout.onfinish = (): void => {
          this.setStyle({ display: 'none' });
        };
      }
    },
  };

  public constructor() {
    super('div', {
      classes: 'spotify-modal',
      style: {
        display: 'flex',
        flexDirection: 'column',
      },
    });

    this.addChildren(this.header, this.dock);
    this.setStyle({ display: 'none' });
  }

  public reset(): void {
    this.header.reset();
    this.dock.reset();
  }
}

export const components = {
  Artists,
  CoverArt,
  Dock,
  DockIcons,
  Metadata,
  ModalHeader,
  ModalContainer,
  PlaybackTimeCurrent,
  PlaybackTimeDuration,
  PlaybackTimeDisplay,
  ProgressBarInner,
  ProgressBar,
  Title,
};

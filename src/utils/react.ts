import { common } from 'replugged';
import type { Root, RootOptions } from 'react-dom/client';
import { defaultConfig } from '@utils/config';

const { React, ReactDOM } = common;

const { createRoot } = ReactDOM as unknown as {
  createRoot: (container: Element | DocumentFragment, options?: RootOptions) => Root;
};

const rootElement = document.createElement('div');

rootElement.id = 'spotify-modal-root';
rootElement.classList.add('spotify-modal-root');

export const root = {
  element: rootElement,
  fiber: createRoot(rootElement),
};

export const useGuardedRef = <T>(
  initialValue: T,
  guard: (newValue: unknown | T) => boolean,
): React.MutableRefObject<T> =>
  new Proxy(React.useRef<T>(initialValue), {
    set: (_, prop, newValue, __): boolean => {
      if (prop !== 'current' || (prop === 'current' && guard(newValue)))
        return Reflect.set(_, prop, newValue, __);

      /* should have been false - but we don't want errors galore */
      return true;
    },
  });

export const useTrappedRef = <T>(
  initialValue: T,
  trap: (newValue: T) => void,
): React.MutableRefObject<T> =>
  new Proxy(React.useRef<T>(initialValue), {
    set: (_, prop, newValue, __): boolean => {
      if (prop === 'current') trap(newValue);
      return Reflect.set(_, prop, newValue, __);
    },
  });

export const useTrappedSettingsState = <T, D extends keyof typeof defaultConfig>(
  useSettingRes: { value: T; onChange: (newValue: T) => void },
  key: D,
  trap: (key: D, newValue: T) => void,
): { value: T; onChange: (newValue: T) => void } => ({
  value: useSettingRes.value,
  onChange: (newValue): void => {
    trap(key, newValue);
    useSettingRes.onChange(newValue);
  },
});

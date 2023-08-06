import { common } from 'replugged';
import { DefaultConfigKeys } from '@config';

const { React } = common;

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

export const useTrappedSettingsState = <T extends DefaultConfigKeys, D>(
  useSettingRes: { value: D; onChange: (newValue: D) => void },
  key: T,
  trap: (key: T, newValue: D) => void,
): { value: D; onChange: (newValue: D) => void } => ({
  value: useSettingRes.value,
  onChange: (newValue): void => {
    trap(key, newValue);
    useSettingRes.onChange(newValue);
  },
});

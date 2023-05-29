import { common } from 'replugged';
import type { Root, RootOptions } from 'react-dom/client';

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

export const mapRefValues = <Value>(refs: {
  [key: string]: React.MutableRefObject<Value>;
}): {
  [key: string]: Value | null;
} => {
  const res = {};

  for (const [key, ref] of Object.entries(refs)) res[key] = ref.current;

  return res;
};

export function useRefWithTrigger<Value>(
  initialValue: Value | null,
  trigger: (newValue: Value | null) => void,
): [React.MutableRefObject<Value>, (newValue: Value | null) => void] {
  const ref = React.useRef(initialValue);

  return [
    ref,
    (newValue: Value | null): void => {
      ref.current = newValue;
      trigger(newValue);
    },
  ];
}

export function useLinkedRefs<Value>(
  refs: Array<[React.MutableRefObject<Value>, (newValue: Value | null) => boolean]>,
): Array<[React.MutableRefObject<Value>, (newValue: Value | null) => void]> {
  return refs.map(([ref, shouldUpdate]) => [
    ref,
    (newValue: Value | null): void => {
      if (shouldUpdate(newValue)) ref.current = newValue;
    },
  ]);
}

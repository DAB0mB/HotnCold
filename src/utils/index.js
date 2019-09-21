import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const useInterval = (callback, delay, asap) => {
  const savedCallback = useRef();

  useEffect(
    () => {
      if (asap) {
        callback(true);
      }
    },
    [true]
  )

  useEffect(
    () => {
      savedCallback.current = callback;
    },
    [callback]
  );

  useEffect(
    () => {
      const handler = () => savedCallback.current(false);

      if (delay !== null) {
        const id = setInterval(handler, delay);
        return () => clearInterval(id);
      }
    },
    [delay]
  );
};

export const useRenderer = () => {
  const [key, setKey] = useState(0);
  const render = useCallback(() => setKey(key + 1), [key, setKey]);

  return [key, render];
}

export const defHook = (obj, value) => {
  return Object.defineProperty(obj, 'use', {
    value,
    configurable: true,
    writable: true,
  });
};

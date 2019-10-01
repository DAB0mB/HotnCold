import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export { default as once } from './once';

export const useInterval = (callback, delay, asap) => {
  const savedCallback = useRef();

  useEffect(() => {
    if (asap) {
      callback(true);
    }
  }, [true]);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = () => savedCallback.current(false);

    if (delay !== null) {
      const id = setInterval(handler, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

export const useRenderer = (callback) => {
  const [key, setKey] = useState(0);
  const callbackRef = useRef(callback);

  const render = useCallback((callback) => {
    callbackRef.current = callback;
    setKey(key + 1);
  }, [key, setKey]);

  useEffect(() => {
    if (key && callbackRef.current) {
      callbackRef.current();
    }
  }, [key, callbackRef]);

  return [key, render];
};

export const useSet = (arr) => {
  const [, forceRender] = useRenderer();
  const set = useMemo(() => new Set(arr), [true]);

  return useMemo(() => ({
    add(obj) {
      const size = set.size;
      set.add(obj);

      if (set.size != size) {
        forceRender();
      }
    },

    has(obj) {
      return set.has(obj);
    },

    delete() {
      const size = set.size;
      set.delete(obj);

      if (set.size != size) {
        forceRender();
      }
    },

    get size() {
      return set.size;
    },
  }), [true]);
};

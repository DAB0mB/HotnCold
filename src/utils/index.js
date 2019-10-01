import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export { default as Once } from './once';

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
  const [set, setSet] = useState(() => new Set(arr));

  return useMemo(() => ({
    add(obj) {
      const size = set.size;
      set.add(obj);

      if (set.size != size) {
        setSet(set);
      }
    },

    has(obj) {
      return set.has(obj);
    },

    delete() {
      const size = set.size;
      set.delete(obj);

      if (set.size != size) {
        setSet(set);
      }
    },

    get size() {
      return set.size;
    },
  }), [set, setSet]);
};

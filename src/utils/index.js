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

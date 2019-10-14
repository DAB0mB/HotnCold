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
    setKey(key => ++key);
  }, [setKey]);

  useEffect(() => {
    if (key && callbackRef.current) {
      callbackRef.current();
    }
  }, [key, callbackRef]);

  return [key, render];
};

export const useAsyncEffect = (generator, input) => {
  const iteratorRef = useRef(generator);
  const [cbQueue, setCbQueue] = useState([]);
  const [key, render] = useRenderer();

  const next = useCallback((value = iteratorRef.current.value) => {
    iteratorRef.current.next(value);
    render();
  }, [key]);

  const dispose = useCallback(async () => {
    for (let callback of cbQueue) {
      await callback();
    }
  }, [cbQueue]);

  useEffect(() => {
    iteratorRef.current = generator();
  }, [true]);

  useEffect(() => {
    const iterator = iteratorRef.current;

    if (typeof iterator.value == 'function') {
      setCbQueue([...cbQueue, iterator.value]);
    }

    if (iterator.done) {
      return dispose;
    }

    if (iterator.value instanceof Promise) {
      iterator.value.then((value) => {
        next(value);
      });

      return dispose;
    }

    next();

    return dispose;
  }, [key]);
};

// Will invoke callback as soon as all input params are ready
export const useCallbackTask = (callback, input) => {
  const [shouldInvoke, setShouldInvoke] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    for (let i of input) {
      if (i == null) {
        setIsReady(false);

        return;
      }
    }

    setIsReady(true);

    if (shouldInvoke) {
      callback();
      setShouldInvoke(false);
    }
  }, input);

  return useCallback(() => {
    if (isReady) {
      callback();
    } else {
      setShouldInvoke(true);
    }
  }, [isReady]);
};

export const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

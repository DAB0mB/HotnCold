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

export const useAsyncEffect = (fn, input) => {
  const [initial, setInitial] = useState(true);
  const [generator, setGenerator] = useState(fn);
  const [iterator, setIterator] = useState(null);
  const cbQueueRef = useRef([]);

  const dispose = useCallback(() => {
    for (let callback of cbQueueRef.current) {
      callback();
    }
  }, [generator]);

  const next = useCallback((value) => {
    if (iterator && iterator.done) {
      return;
    }

    setIterator(generator.next(value));
  }, [iterator]);

  const genThrow = useCallback((error) => {
    if (iterator && iterator.done) {
      return;
    }

    setIterator(generator.throw(value));
  }, [iterator]);

  useEffect(() => {
    if (initial) {
      return () => {
        setInitial(false);
      };
    }

    setGenerator(fn);
    setIterator(null);
    cbQueueRef.current = [];
  }, input);

  useEffect(() => {
    next();

    return dispose;
  }, [generator]);

  useEffect(() => {
    if (!iterator) return;

    let mounted = true;

    if (typeof iterator.value == 'function') {
      cbQueueRef.current.push(iterator.value);
      next(iterator.value);

      return;
    }

    if (iterator.value instanceof Promise) {
      iterator.value.then((value) => {
        if (mounted) {
          next(value);
        }
      }).catch((error) => {
        if (mounted) {
          genThrow(error);
        }
      });

      return;
    }

    next(iterator.value);

    return () => {
      mounted = false;
    };
  }, [iterator]);
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

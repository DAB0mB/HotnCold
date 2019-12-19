import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

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

  const restore = useCallback((callback) => {
    callbackRef.current = callback;
    setKey(0);
  }, [setKey]);

  useEffect(() => {
    if (key && typeof callbackRef.current == 'function') {
      callbackRef.current();
    }
  }, [key, callbackRef]);

  return [key, render, restore];
};

export const useImmediate = () => {
  const immediateRef = useRef();
  const isMountedRef = useMountedRef();

  const _clearImmediate = useCallback(() => {
    clearImmediate(immediateRef.current);
  }, [true]);

  const _setImmediate = useCallback((cb) => {
    _clearImmediate();

    setImmediate(() => {
      if (isMountedRef.current) {
        cb();
      }
    });
  }, [true]);

  return [_setImmediate, _clearImmediate];
};

export const useMountedRef = () => {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, [true]);

  return isMountedRef;
};

export const useAsyncEffect = (fn, input) => {
  const cbQueueRef = useRef([]);
  const [iterator, setIterator] = useState(null);
  const [generator, setGenerator] = useState(null);

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
  }, [iterator, generator]);

  const genThrow = useCallback((error) => {
    if (iterator && iterator.done) {
      return;
    }

    setIterator(generator.throw(error));
  }, [iterator]);

  useEffect(() => {
    cbQueueRef.current = [];
    setIterator(null);
    setGenerator(fn);
  }, input);

  useEffect(() => {
    if (!generator) return;

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

export const useAsyncCallback = (fn, input) => {
  const isMountedRef = useMountedRef();

  return useCallback(async () => {
    const generator = fn();
    let iterator = generator.next();

    while (!iterator.done) {
      try {
        const result = await iterator.value;

        if (isMountedRef.current) {
          iterator = generator.next(result);
        }
      }
      catch (e) {
        if (isMountedRef.current) {
          iterator = generator.throw(e);
        }
      }
    }

    return iterator.value;
  }, input);
};

export const useCbQueue = (input = [true]) => {
  const [cbQueue, setCbQueue] = useState([]);

  const call = useCallback(() => {
    for (let callback of cbQueue) {
      callback();
    }
  }, [cbQueue]);

  const usePush = useCallback((callback, cbInput = [true]) => {
    useEffect(() => {
      cbQueue.push(callback);
    }, [cbQueue]);

    useEffect(() => {
      return () => {
        setCbQueue([]);
      };
    }, [...input, ...cbInput]);
  }, [...input, cbQueue]);

  return [call, usePush];
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
    }
    else {
      setShouldInvoke(true);
    }
  }, [isReady, ...input]);
};

export const useRootLayoutEffect = (() => {
  let rootObj = null;

  return (callback) => {
    const obj = {};

    if (!rootObj) {
      rootObj = obj;
    }

    useEffect(() => {
      rootObj = null;
    });

    useLayoutEffect(() => {
      if (rootObj === obj) {
        callback();
      }
    });
  };
})();

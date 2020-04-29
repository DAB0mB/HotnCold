import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

export const useConst = (init = {}) => {
  return useRef(init).current;
};

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
  const mountState = useMountState();

  const _clearImmediate = useCallback(() => {
    clearImmediate(immediateRef.current);
  }, [true]);

  const _setImmediate = useCallback((cb) => {
    _clearImmediate();

    setImmediate(() => {
      if (mountState.current) {
        cb();
      }
    });
  }, [true]);

  return [_setImmediate, _clearImmediate];
};

export const useMountState = () => {
  const mountState = useRef(true);

  useEffect(() => {
    return () => {
      mountState.current = false;
    };
  }, [true]);

  return mountState;
};

const createAsyncEffectHook = (useEffect) => (fn, input) => {
  const cbQueueRef = useRef([]);
  const [result, setResult] = useState(null);
  const [iterator, setIterator] = useState(null);

  const cleanup = useCallback(() => {
    for (let callback of cbQueueRef.current) {
      callback();
    }
  }, [iterator]);

  const onCleanup = useCallback((fn) => {
    cbQueueRef.current.push(fn);
  }, [true]);

  const next = useCallback((value) => {
    if (result && result.done) {
      return;
    }

    setResult(iterator.next(value));
  }, [result, iterator]);

  const throwback = useCallback((error) => {
    if (result && result.done) {
      return;
    }

    setResult(iterator.throw(error));
  }, [result]);

  useEffect(() => {
    cbQueueRef.current = [];
    setResult(null);

    const iterator = fn(onCleanup);

    setIterator(iterator);
    setResult(iterator.next());

    return cleanup;
  }, input);

  useEffect(() => {
    if (!result) return;

    let mounted = true;

    if (result.value instanceof Promise) {
      result.value.then((value) => {
        if (mounted) {
          next(value);
        }
      }).catch((error) => {
        if (mounted) {
          throwback(error);
        }
      });

      return;
    }

    next(result.value);

    return () => {
      mounted = false;
    };
  }, [result]);
};
export const useAsyncEffect = createAsyncEffectHook(useEffect);
export const useAsyncLayoutEffect = createAsyncEffectHook(useLayoutEffect);

export const useAsyncCallback = (fn, input) => {
  const mountState = useMountState();

  return useCallback(async (...args) => {
    const iterator = fn(...args);
    let result = iterator.next();

    while (!result.done) {
      try {
        if (mountState.current) {
          result = iterator.next(await result.value);
        }
      }
      catch (e) {
        if (mountState.current) {
          result = iterator.throw(e);
        }
      }
    }

    return result.value;
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
export const useCallbackWhen = (callback, cond) => {
  const [shouldInvoke, setShouldInvoke] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    if (!cond) {
      setIsReady(false);

      return;
    }

    setIsReady(true);

    if (shouldInvoke) {
      callback();
      setShouldInvoke(false);
    }
  }, [cond]);

  return useCallback(() => {
    if (isReady) {
      callback();
    }
    else {
      setShouldInvoke(true);
    }
  }, [isReady, cond]);
};

export const useStatePromise = (init) => {
  const resolveRef = useRef(null);
  const [state, superSetState] = useState(init);
  const [pending, setPending] = useState(false);
  const [promise, setPromise] = useState(() => {
    return new Promise(r => resolveRef.current = r);
  });

  useEffect(() => {
    if (pending) {
      const resolve = resolveRef.current;
      setPending(false);
      setPromise(new Promise(r => resolveRef.current = r));
      resolve(state);
    }
  }, [pending]);

  const setState = useCallback((state) => {
    superSetState(state);
    setPending(true);

    return promise;
  }, [state]);

  return [state, setState];
};

export const useDelayedEffect = (cb, ms, input) => {
  const timeoutRef = useRef(0);

  const clearDelayedEffect = useCallback(() => {
    clearTimeout(timeoutRef.current);
  }, [true]);

  useEffect(() => {
    const timeoutCb = cb();

    if (typeof timeoutCb != 'function') return;

    timeoutRef.current = setTimeout(timeoutCb, ms);

    return clearDelayedEffect;
  }, input);

  return clearDelayedEffect;
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

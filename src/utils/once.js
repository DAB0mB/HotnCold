const createOnce = () => {
  const set = new Set();

  const once = (obj, defaultReturn) => {
    if (set.has(obj)) {
      throw [set, defaultReturn];
    }
    else {
      set.add(obj);
    }
  };

  once.create = createOnce;

  once.try = (callback, args = []) => {
    try {
      return callback(...args, once);
    }
    catch (e) {
      if (e && e[0] === set) {
        return e[1];
      }

      throw e;
    }
  };

  return once;
};

export default createOnce();

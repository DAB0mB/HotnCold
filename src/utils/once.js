const createOnce = () => {
  const once = (obj) => {
    if (once.set.has(obj)) {
      throw once.set;
    } else {
      once.set.add(obj);
    }
  };

  once.create = createOnce;
  once.set = new Set();

  once.try = (callback, args) => {
    try {
      callback(...args, once);
    } catch (e) {
      if (e !== once.set) {
        throw e;
      }
    }
  };

  return once;
};

export default createOnce();

import { isValidNumber } from 'libphonenumber-js';
import CONFIG from 'react-native-config';

export { default as __ } from './_';
export * from './cookie';
export * from './hooks';
export * from './mapbox';
export { default as once } from './once';

export const noop = () => {};
export const noopGen = function* () {};
export const empty = {};

export const pick = (obj, keys) => {
  const clone = {};

  for (let key of keys) {
    clone[key] = obj[key];
  }

  return clone;
};

export const omit = (obj, keys) => {
  return pick(obj, Object.keys(obj).filter(k => !keys.includes(k)));
};

export const random = (arg1 = 0, arg2 = 1) => {
  const [min, max] = arg1 > arg2 ? [arg1, arg2] : [arg2, arg1];

  return min + Math.random() * (max - min);
};

export const pickRandomIndex = (vector) => {
  return Math.floor(random(0, vector.length));
};

export const pickRandom = (vector) => {
  const i = pickRandomIndex(vector);

  return vector[i];
};

export const fork = (obj) => {
  if (!(obj instanceof Object)) {
    return obj;
  }

  const clone = {};
  const keys = [];
  keys.push(...Object.getOwnPropertyNames(obj));
  keys.push(...Object.getOwnPropertySymbols(obj));

  for (let key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
    Object.defineProperty(clone, key, descriptor);
  }

  const proto = Object.getPrototypeOf(obj);
  Object.setPrototypeOf(clone, proto);

  return clone;
};

export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const validatePhone = (phone) => {
  return (
    isValidNumber(phone.replace(/^-/, '+')) ||
    new RegExp(CONFIG.TEST_PHONE_LOCAL).test(phone) ||
    new RegExp(CONFIG.TEST_PHONE_SMS).test(phone)
  );
};

// foo_barBaz -> ['foo', 'bar', 'Baz']
export const splitWords = (str) => {
  return str
    .replace(/[A-Z]/, ' $&')
    .split(/[^a-zA-Z0-9]+/)
    .filter(word => word.trim());
};

// fooBarBaz -> foo-bar-baz
export const snakeCase = (str) => {
  const words = splitWords(str);

  return words.map(w => w.toLowerCase()).join('-');
};

// upper -> Upper
export const upperFirst = (str) => {
  return str.substr(0, 1).toUpperCase() + str.substr(1);
};

// camel_case -> camelCase
export const camelCase = (str) => {
  const words = splitWords(str);
  const first = words.shift().toLowerCase();
  const rest = words.map(upperFirst);

  return [first, ...rest].join('');
};

export const promiseObj = (obj) => {
  const keys = Object.keys(obj);
  const values = Object.keys(obj);

  return Promise.all(values).then((results) => {
    return keys.reduce((res, k, i) => {
      res[k] = results[i];

      return res;
    }, {});
  });
};

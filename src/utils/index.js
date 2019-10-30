export { default as __ } from './_';
export * from './hooks';
export { default as once } from './once';

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

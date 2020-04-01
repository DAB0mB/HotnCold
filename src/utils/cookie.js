import Cookie from 'cookie';

const optionsNames = ['expires', 'path', 'domain'];

export const parseRawCookie = (rawCookie) => {
  const { camelCase } = require('.');

  const cookie = Cookie.parse(rawCookie);
  const attributes = Object.keys(cookie);
  const name = attributes.shift();
  const value = cookie[name];

  const options = attributes.reduce((options, key) => {
    const optionName = camelCase(key);

    if (!optionsNames.includes(optionName)) return options;

    options[optionName] = cookie[key];

    return options;
  }, {});

  if ('expires' in options) {
    options.expires = new Date(options.expires);
  }

  return [name, value, options];
};

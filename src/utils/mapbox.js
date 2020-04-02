export const mapfn = new Proxy((scopeFn) => {
  return scopeFn(mapfn);
}, {
  get(target, p) {
    const { snakeCase } = require('.');

    switch (p) {
    case 'getDeep':
      return (path) => path.split('.').reduce((children, prop) => ['get', prop, children].filter(Boolean), '');
    case 'not': p = '!'; break;
    case 'neq': p = '!='; break;
    case 'eq': p = '=='; break;
    case 'lt': p = '<'; break;
    case 'lte': p = '<='; break;
    case 'gt': p = '>'; break;
    case 'gte': p = '>='; break;
    case 'add': p = '+'; break;
    case 'sub': p = '-'; break;
    case 'mul': p = '*'; break;
    case 'div': p = '/'; break;
    case 'pow': p = '^'; break;
    case 'mod': p = '%'; break;
    default: p = snakeCase(p);
    }

    return (...args) => [p, ...args];
  },
});

export const maparg = new Proxy({}, {
  get(target, p) {
    const { snakeCase } = require('.');

    return [snakeCase(p)];
  },
});

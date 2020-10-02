// Custom Mapbox Expressions
export const mapx = (x, ...args) => {
  switch (x) {
  case 'get_deep': {
    const [path] = args;

    return path.split('.').reduce((children, prop) => ['get', prop, children].filter(Boolean), '');
  }
  case 'not': x = '!'; break;
  case 'neq': x = '!='; break;
  case 'eq': x = '=='; break;
  case 'lt': x = '<'; break;
  case 'lte': x = '<='; break;
  case 'gt': x = '>'; break;
  case 'gte': x = '>='; break;
  case 'add': x = '+'; break;
  case 'sub': x = '-'; break;
  case 'mul': x = '*'; break;
  case 'div': x = '/'; break;
  case 'pow': x = '^'; break;
  case 'mod': x = '%'; break;
  }

  return [x, ...args];
};

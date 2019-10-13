export const colors = {
  hot: '#ec58ae',
  warm: '#d6ec58',
  cold: '#58ecd8',
  ink: '#281745',
};

export const hexToRgba = (hex, a = 1) => {
  if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    throw Error('Bad hex');
  }

  let c = hex.substring(1).split('');

  if (c.length == 3) {
    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  }

  c = '0x' + c.join('');

  return `rgba(${(c>>16)&255}, ${(c>>8)&255}, ${c&255}, ${a})`;
};

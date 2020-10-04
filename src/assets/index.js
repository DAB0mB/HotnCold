export const getUserAvatarSource = (user, prop = 'avatar') => {
  return user[prop] ? { uri: user[prop] } : require('./avatar.png');
};

export const getStatusThumbSource = (status, prop = 'thumb') => {
  return status[prop] ? { uri: status[prop] } : require('./statusThumb_square.png');
};

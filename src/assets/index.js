export const getUserAvatarSource = (user, prop = 'avatar') => {
  return user[prop] ? { uri: user[prop] } : require('./avatar.png');
};

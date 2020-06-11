import gql from 'graphql-tag';

const user = gql `
  fragment User on User {
    id
    name
    avatar
  }
`;

user.profile = gql `
  fragment UserProfile on User {
    ...User
    birthDate
    age
    bio
    occupation
    pictures
  }

  ${user}
`;

user.read = (cache, id) => {
  id = `User:${id.split(':').pop()}`;

  return cache.readFragment({
    id,
    fragment: user,
    fragmentName: 'User',
  });
};

user.write = (cache, data) => {
  const id = `User:${data.id}`;

  return cache.writeFragment({
    id,
    fragment: user,
    fragmentName: 'User',
    data,
  });
};

user.profile.read = (cache, id) => {
  id = `User:${id.split(':').pop()}`;

  return cache.readFragment({
    id,
    fragment: user.profile,
    fragmentName: 'UserProfile',
  });
};

user.profile.write = (cache, data) => {
  const id = `User:${data.id}`;

  return cache.writeFragment({
    id,
    fragment: user.profile,
    fragmentName: 'UserProfile',
    data,
  });
};

export default user;

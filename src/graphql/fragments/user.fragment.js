import gql from 'graphql-tag';

import status from './status.fragment';

const user = gql `
  fragment User on User {
    id
    name
    avatar
  }
`;

user.result = gql `
  fragment UserResult on User {
    ...User
    status {
      ...Status
    }
  }

  ${user}
  ${status}
`;

user.profile = gql `
  fragment UserProfile on User {
    ...UserResult
    birthDate
    age
    bio
    location
    occupation
    pictures
    discoverable
  }

  ${user.result}
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

user.result.read = (cache, id) => {
  id = `User:${id.split(':').pop()}`;

  return cache.readFragment({
    id,
    fragment: user.result,
    fragmentName: 'UserResult',
  });
};

user.result.write = (cache, data) => {
  const id = `User:${data.id}`;

  return cache.writeFragment({
    id,
    fragment: user.result,
    fragmentName: 'UserResult',
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

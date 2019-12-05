import gql from 'graphql-tag';

import area from './area.fragment';

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
    firstName
    lastName
    birthDate
    age
    bio
    location
    occupation
    pictures
  }

  ${user}
`;

user.read = (cache, id) => {
  return cache.readFragment({
    id,
    fragment: user,
    fragmentName: 'User',
  });
};

user.write = (cache, data) => {
  return cache.writeFragment({
    id: data.id,
    fragment: user,
    fragmentName: 'User',
    data,
  });
};

user.profile.read = (cache, id) => {
  return cache.readFragment({
    id,
    fragment: user.profile,
    fragmentName: 'UserProfile',
  });
};

user.profile.write = (cache, data) => {
  return cache.writeFragment({
    id: data.id,
    fragment: user.profile,
    fragmentName: 'UserProfile',
    data,
  });
};

export default user;

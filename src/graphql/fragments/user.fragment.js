import gql from 'graphql-tag';

import area from './area.fragment';

const user = gql `
  fragment User on User {
    id
    firstName
    birthDate
    age
    bio
    location
    occupation
    pictures
  }
`;

user.withArea = gql `
  fragment UserWithArea on User {
    ...User
    area {
      ...Area
    }
  }

  ${user}
  ${area}
`;

export default user;

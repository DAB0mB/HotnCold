import gql from 'graphql-tag';

import area from './area.fragment';

const user = gql `
  fragment User on User {
    id
    firstName
    lastName
    birthDate
    # gender
    age
    bio
    location
    occupation
    pictures
    avatar
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

user.forSocial = gql `
  fragment UserForChat on User {
    ...User
    id: _id
    firstName: name
  }

  ${user}
 `;

export default user;

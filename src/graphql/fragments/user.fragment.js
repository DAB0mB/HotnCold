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
  fragment UserForSocial on User {
    _id: id
    name: firstName
    avatar
  }
 `;

export default user;

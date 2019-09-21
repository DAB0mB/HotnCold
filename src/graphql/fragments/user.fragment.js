import gql from 'graphql-tag';

const user = gql`
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

export default user;

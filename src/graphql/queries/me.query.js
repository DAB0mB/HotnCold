import gql from 'graphql-tag';

const me = gql `
  query Me {
    me {
      id
      firstName
      birthDate
      age
      bio
      location
      occupation
      pictures
    }
  }
`;

export default me;

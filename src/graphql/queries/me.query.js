import gql from 'graphql-tag';

const me = gql `
  query Me {
    me {
      id
      firstName
      birthDate
      age
      bio
      occupation
      location
      pictures
    }
  }
`;

export default me;

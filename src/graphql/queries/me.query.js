import gql from 'graphql-tag';

const me = gql `
  query Me {
    me {
      id
      firstName
      age
      bio
      occupation
      pictures
    }
  }
`

export default me;

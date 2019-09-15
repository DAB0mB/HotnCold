import gql from 'graphql-tag';

const me = gql `
  query Me {
    me {
      id
      firstName
      lastName
      age
      bio
      job
      pictures
    }
  }
`

export default me;

import gql from 'graphql-tag';

const area = gql `
  fragment Area on Area {
    id
    name
  }
`;

export default area;

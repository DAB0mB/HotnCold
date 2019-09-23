import gql from 'graphql-tag';

const area = gql `
  fragment Area on Area {
    id
    name
    bbox
  }
`;

export default area;

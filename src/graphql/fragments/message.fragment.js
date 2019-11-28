import gql from 'graphql-tag';

import user from './user.fragment';

const message = gql `
  fragment Message on Message {
    id
    createdAt
    text
  }
`;

message.forSocial = gql `
  fragment MessageForSocial on Message {
    _id: id
    createdAt
    text
    user {
      ...UserForSocial
    }
  }

  ${user.forSocial}
`;

export default message;

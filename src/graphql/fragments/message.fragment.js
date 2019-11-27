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
    ...Message
    id: _id
    user {
      ...UserForSocial
    }
  }

  ${message}
  ${user.forSocial}
`;

export default message;

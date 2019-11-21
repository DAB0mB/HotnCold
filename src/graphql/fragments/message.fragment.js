import gql from 'graphql-tag';

import user from './user.fragment';

const message = gql `
  fragment Message on Message {
    id
    createdAt
    text
  }
`;

message.forChat = gql `
  fragment Message on Message {
    ...Message
    id: _id
    user {
      ...UserForChat
    }
  }

  ${message}
  ${user.forChat}
`;

export default user;

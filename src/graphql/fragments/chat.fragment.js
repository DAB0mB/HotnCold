import gql from 'graphql-tag';

import message from './message.fragment';
import user from './user.fragment';

const chat = gql `
  fragment Chat on Chat {
    id
    recentMessage {
      ...Message
    }
    users {
      ...User
    }
  }

  ${message}
  ${user}
`;

export default chat;

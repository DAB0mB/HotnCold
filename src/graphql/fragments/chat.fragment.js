import gql from 'graphql-tag';

import user from './user.fragment';

const chat = gql `
  fragment Chat on Chat {
    id
    text
    recentMessage
    users {
      ...User
    }
  }

  ${user}
`;

export default chat;

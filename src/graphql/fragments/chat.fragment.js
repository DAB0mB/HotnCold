import gql from 'graphql-tag';

import message from './message.fragment';
import user from './user.fragment';

const chat = gql `
  fragment Chat on Chat {
    id
    firstMessage {
      ...Message
    }
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

chat.read = (cache, id) => {
  return cache.readFragment({
    id,
    fragment: chat,
    fragmentName: 'Chat',
  });
};

chat.write = (cache, data) => {
  return cache.writeFragment({
    id: data.id,
    fragment: chat,
    fragmentName: 'Chat',
    data,
  });
};

export default chat;
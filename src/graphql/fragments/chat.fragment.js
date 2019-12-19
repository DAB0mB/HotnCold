import gql from 'graphql-tag';

import message from './message.fragment';
import user from './user.fragment';

const chat = gql `
  fragment Chat on Chat {
    id
    title
    picture
    firstMessage {
      ...Message
    }
    recentMessages {
      ...Message
    }
    users {
      ...UserProfile
    }
  }

  ${message}
  ${user.profile}
`;

chat.read = (cache, id) => {
  id = `Chat:${id.split(':').pop()}`;

  return cache.readFragment({
    id,
    fragment: chat,
    fragmentName: 'Chat',
  });
};

chat.write = (cache, data) => {
  const id = `Chat:${data.id}`;

  return cache.writeFragment({
    id,
    fragment: chat,
    fragmentName: 'Chat',
    data,
  });
};

export default chat;

import gql from 'graphql-tag';

import chat from './chat.fragment';
import user from './user.fragment';

const status = gql `
  fragment Status on Status {
    id
    text
    location
    createdAt
    weight
    author {
      ...User
    }
  }

  ${user}
`;

status.item = gql `
  fragment StatusItem on Status {
    ...Status
    chat {
      __nocache: __typename
      id
      subscribed
    }
  }

  ${status}
`;

status.withChat = gql `
  fragment StatusWithChat on Status {
    ...Status
    chat {
      ...Chat
    }
  }

  ${chat}
  ${status}
`;

status.read = (cache, id) => {
  id = `Status:${id.split(':').pop()}`;

  return cache.readFragment({
    id,
    fragment: status,
    fragmentName: 'Status',
  });
};

status.write = (cache, data) => {
  const id = `Status:${data.id}`;

  return cache.writeFragment({
    id,
    fragment: status,
    fragmentName: 'Status',
    data,
  });
};

status.item.read = (cache, id) => {
  id = `Status:${id.split(':').pop()}`;

  return cache.readFragment({
    id,
    fragment: status.item,
    fragmentName: 'StatusItem',
  });
};

status.item.write = (cache, data) => {
  const id = `Status:${data.id}`;

  return cache.writeFragment({
    id,
    fragment: status.item,
    fragmentName: 'StatusItem',
    data,
  });
};

status.withChat.read = (cache, id) => {
  id = `Status:${id.split(':').pop()}`;

  return cache.readFragment({
    id,
    fragment: status.withChat,
    fragmentName: 'StatusWithChat',
  });
};

status.withChat.write = (cache, data) => {
  const id = `Status:${data.id}`;

  return cache.writeFragment({
    id,
    fragment: status.withChat,
    fragmentName: 'StatusWithChat',
    data,
  });
};

export default status;

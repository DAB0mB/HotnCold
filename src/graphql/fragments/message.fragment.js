import gql from 'graphql-tag';

import user from './user.fragment';

const message = gql `
  fragment Message on Message {
    id
    createdAt
    text
    user {
      ...User
    }
  }

  ${user}
`;

message.read = (cache, id) => {
  id = `Message:${id.split(':').pop()}`;

  return cache.readFragment({
    id,
    fragment: message,
    fragmentName: 'Message',
  });
};

message.write = (cache, data) => {
  const id = `Message:${data.id}`;

  return cache.writeFragment({
    id,
    fragment: message,
    fragmentName: 'Message',
    data,
  });
};

export default message;

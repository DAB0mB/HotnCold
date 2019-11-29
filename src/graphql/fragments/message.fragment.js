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
  return cache.readFragment({
    id,
    fragment: message,
    fragmentName: 'Message',
  });
};

message.write = (cache, data) => {
  return cache.writeFragment({
    id: data.id,
    fragment: message,
    fragmentName: 'Message',
    data,
  });
};

export default message;

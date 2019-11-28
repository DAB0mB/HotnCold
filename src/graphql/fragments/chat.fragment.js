import { useApolloClient } from '@apollo/react-hooks';
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

chat.read = (id) => {
  const client = useApolloClient();

  return client.readFragment({
    id,
    fragment: chat,
    fragmentName: 'Chat',
  });
};

chat.write = (data) => {
  const client = useApolloClient();

  return client.writeFragment({
    id: data.id,
    fragment: chat,
    fragmentName: 'Chat',
    data,
  });
};

export default chat;

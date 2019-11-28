import { useApolloClient } from '@apollo/react-hooks';
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

message.read = (id) => {
  const client = useApolloClient();

  return client.readFragment({
    id,
    fragment: message,
    fragmentName: 'Message',
  });
};

message.write = (data) => {
  const client = useApolloClient();

  return client.writeFragment({
    id: data.id,
    fragment: message,
    fragmentName: 'Message',
    data,
  });
};

export default message;

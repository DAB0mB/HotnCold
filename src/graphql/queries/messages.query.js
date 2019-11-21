import { useQuery, useLazyQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const messages = gql `
  query Messages($recipientId: ID!) {
    messages(recipientId: $recipientId) {
      ...Message
    }
  }

  ${fragments.message}
`;

messages.forChat = gql `
  query MessagesForChat($recipientId: ID!) {
    messages(recipientId: $recipientId) {
      ...MessageForChat
    }
  }

  ${fragments.message.forChat}
`

messages.use = (recipientId, options = {}, queryAst = messages, idField = 'id') => {
  const query = useQuery(queryAst, {
    variables: { recipientId },
    ...options,
  });

  return {
    ...query,
    fetchMore(options = {}) {
      return query.fetchMore({
        variables: {
          recipientId,
          anchor: query.data.messages[query.data.messages.length - 1][idField],
        },
        ...options,
      });
    };
  };
};

messages.forChat.use = (recipientId, options) => {
  return messages.use(recipientId, options, messages.forChat, '_id');
};

export default user;

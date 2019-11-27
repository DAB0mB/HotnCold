import { useQuery, useLazyQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const messages = gql `
  query Messages($chatId: ID!, $anchor: ID) {
    messages(chatId: $chatId) {
      ...Message
    }
  }

  ${fragments.message}
`;

messages.forSocial = gql `
  query MessagesForSocial($chatId: ID!, $anchor: ID) {
    messages(chatId: $chatId, anchor: $anchor) {
      ...MessageForSocial
    }
  }

  ${fragments.message.forSocial}
`

messages.use = (chatId, options = {}, ast = messages, $id = 'id') => {
  const query = useQuery(ast, {
    variables: { chatId },
    ...options,
  });

  return {
    ...query,
    fetchMore(options = {}) {
      return query.fetchMore({
        variables: {
          chatId,
          anchor: query.data.messages[query.data.messages.length - 1][$id],
        },
        ...options,
      });
    };
  };
};

messages.forSocial.use = (chatId, options) => {
  return messages.use(chatId, options, messages.forSocial, '_id');
};

export default user;

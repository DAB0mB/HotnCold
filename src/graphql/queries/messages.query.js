import { useQuery, useLazyQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const messages = gql `
  query Messages($chatId: ID!, $anchor: ID) {
    messages(chatId: $chatId, anchor: $anchor) {
      ...Message
    }
  }

  ${fragments.message}
`;

messages.use = (chatId, options = {}, messages) => {
  const query = useQuery(messages, {
    variables: { chatId },
    fetchPolicy: 'no-cache',
    ...options,
  });

  return {
    ...query,
    fetchMore(options = {}) {
      return query.fetchMore({
        variables: {
          chatId,
          anchor: query.data.messages[query.data.messages.length - 1].id,
        },
        fetchPolicy: 'no-cache',
        ...options,
      });
    }
  };
};

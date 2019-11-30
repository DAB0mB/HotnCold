import { useQuery, useLazyQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';
import * as subscriptions from '../subscriptions';

const messages = gql `
  query Messages($chatId: ID!, $anchor: ID) {
    messages(chatId: $chatId, anchor: $anchor) {
      ...Message
    }
  }

  ${fragments.message}
`;

messages.use = (chatId, options = {}) => {
  const query = useQuery(messages, {
    variables: { chatId },
    fetchPolicy: 'no-cache',
    ...options,
  });

  query.subscribeToMore({
    document: subscriptions.messageSent,
    variables: { chatId },
    updateQuery(prev, { subscriptionData }) {
      if (!subscriptionData.data) return prev;

      const { messageSent } = subscriptionData.data;

      return {
        ...prev,
        messages: [...prev.messages, messageSent],
      },
    },
  });

  return {
    ...query,
    fetchMore(options = {}) {
      return query.fetchMore({
        variables: {
          chatId,
          anchor: query.data.messages[query.data.messages.length - 1].id,
        },
        updateQuery(prev, { fetchMoreResult }) {
          if (!fetchMoreResult) return prev;

          return {
            ...prev,
            messages: [...fetchMoreResult.messages, ...prev.messages],
          };
        },
        fetchPolicy: 'no-cache',
        ...options,
      });
    }
  };
};

export default messages;

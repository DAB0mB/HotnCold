import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback, useEffect, useState } from 'react';

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

  // Manual cache for now.
  const [data, setData] = useState(query.data);

  useEffect(() => {
    setData(query.data);
  }, [query.data]);

  useEffect(() => {
    return query.subscribeToMore({
      document: subscriptions.messageSent,
      variables: { chatId },
      updateQuery(prev, { subscriptionData }) {
        if (!subscriptionData.data) return prev;

        const { messageSent } = subscriptionData.data;

        setData({
          messages: [messageSent, ...data.messages]
        });
      },
    });
  }, [query.subscribeToMore, data, chatId]);

  return {
    ...query,
    data,
    fetchMore: useCallback((options = {}) => {
      return query.fetchMore({
        variables: {
          chatId,
          anchor: data.messages[data.messages.length - 1].id,
        },
        updateQuery(prev, { fetchMoreResult }) {
          if (!fetchMoreResult) return prev;

          setData({
            messages: [...data.messages, ...fetchMoreResult.messages]
          });
        },
        fetchPolicy: 'no-cache',
        ...options,
      });
    }, [query.fetchMore, data, chatId]),
  };
};

export default messages;

import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback, useEffect, useState } from 'react';

import * as fragments from '../fragments';

const messages = gql `
  query Messages($chatId: ID!, $limit: Int!, $anchor: ID) {
    messages(chatId: $chatId, limit: $limit, anchor: $anchor) {
      ...Message
    }
  }

  ${fragments.message}
`;

messages.use = (chatId, limit, { onCompleted = () => {}, options = {} } = {}) => {
  const subscriptions = require('../subscriptions');

  // Manual cache for now. Don't keep anything
  const [data, setData] = useState();

  const query = useQuery(messages, {
    variables: { chatId, limit },
    fetchPolicy: 'no-cache',
    ...options,
  });

  useEffect(() => {
    setData(query.data);
  }, [query.data]);

  useEffect(() => {
    if (data) {
      onCompleted(data);
    }
  }, [data, onCompleted]);

  useEffect(() => {
    return query.subscribeToMore({
      document: subscriptions.messageSent,
      variables: { chatId },
      updateQuery(prev, { subscriptionData }) {
        if (!subscriptionData.data) return;

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
    fetchMore: useCallback((moreLimit = limit, options = {}) => {
      return query.fetchMore({
        variables: {
          chatId,
          limit: moreLimit,
          anchor: data.messages[data.messages.length - 1].id,
        },
        updateQuery(prev, { fetchMoreResult }) {
          if (!fetchMoreResult) return;

          setData({
            messages: [...data.messages, ...fetchMoreResult.messages]
          });
        },
        ...options,
      });
    }, [query.fetchMore, data, chatId, limit]),
  };
};

export default messages;

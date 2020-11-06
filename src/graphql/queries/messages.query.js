import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback, useEffect, useState, useRef } from 'react';

import * as fragments from '../fragments';

const messages = gql `
  query Messages($chatId: ID!, $limit: Int!, $anchor: ID) {
    messages(chatId: $chatId, limit: $limit, anchor: $anchor) {
      ...Message
    }
  }

  ${fragments.message}
`;

// TODO: Have similar implementation to comments.query
messages.use = (chatId, limit, { onCompleted = () => {}, options = {} } = {}) => {
  const queries = require('../queries');
  const subscriptions = require('../subscriptions');

  // Manual cache for now. Don't keep anything
  const [data, setData] = useState();
  const { data: { me } = {} } = queries.mine.use();
  const myIdRef = useRef();
  myIdRef.current = me.id;

  const query = useQuery(messages, {
    variables: { chatId, limit },
    fetchPolicy: 'no-cache',
    skip: !chatId,
    ...options,
  });

  useEffect(() => {
    const onOptimisticMessage = ({ operationName, data: { sendMessage: message } = {} }) => {
      if (operationName != 'SendMessage') return;
      if (!message) return;

      setData({
        messages: [message, ...data.messages]
      });
    };

    const onMessage = ({ operationName, data: { sendMessage: message } = {}, optimisticResponse: { sendMessage: optimisticMessage } = {} }) => {
      if (operationName != 'SendMessage') return;
      if (!message) return;

      let index = -1;
      for (let i = data.messages.length - 1; i >= 0; i--) {
        const m = data.messages[i];

        if (m.id === optimisticMessage.id) {
          index = i;
          break;
        }
      }

      if (index == -1) return;

      setData({
        messages: [
          ...data.messages.slice(0, index),
          message,
          ...data.messages.slice(index + 1),
        ],
      });
    };

    query.client.events.on('optimisticResponse', onOptimisticMessage);
    query.client.events.on('responded', onMessage);

    return () => {
      query.client.events.off('optimisticResponse', onOptimisticMessage);
      query.client.events.off('responded', onMessage);
    };
  }, [data]);

  useEffect(() => {
    if (!query.data) return;

    setData(query.data);
  }, [query.data]);

  useEffect(() => {
    if (data) {
      onCompleted(data);
    }
  }, [data, onCompleted]);

  {
    const sub = subscriptions.messageSent.use(chatId);

    // NOTE:
    // subscribeToMore() - does not unsubscribe for some reason
    // onSubscriptionData() - is not called for some reason
    useEffect(() => {
      if (!sub.data) return;

      const { messageSent } = sub.data;

      if (messageSent.user.id === myIdRef.current) return;

      setData({
        messages: [messageSent, ...data.messages]
      });
    }, [sub.data]);
  }

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

import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback, useEffect } from 'react';

import * as fragments from '../../graphql/fragments';
import { compactOptions, omit, useConst } from '../../utils';

const chats = gql `
  query Chats($limit: Int!, $anchor: ID) {
    chats(limit: $limit, anchor: $anchor) {
      ...Chat
    }
    firstChat {
      ...Chat
    }
  }
  ${fragments.chat}
`;

chats.use = (...args) => {
  const subscriptions = require('../subscriptions');
  const [limit = 12, options = {}] = compactOptions(2, args);

  const query = useQuery(chats, {
    variables: { limit },
    fetchPolicy: 'cache-and-network',
    ...omit(options, ['subscribeToChanges']),
  });

  if (options.subscribeToChanges) {
    useEffect(() => {
      return query.subscribeToMore({
        document: subscriptions.chatBumped,
        updateQuery(prev, { subscriptionData }) {
          if (!subscriptionData.data) return;

          const { chatBumped } = subscriptionData.data;
          const chats = prev.chats.slice();
          const chatIndex = chats.findIndex(c => c.id === chatBumped.id);

          if (~chatIndex) {
            chats.splice(chatIndex, 1);
          }

          chats.push(chatBumped);

          const firstChat = chats.length == 1 ? chats[0] : prev.firstChat;

          return {
            firstChat,
            chats,
          };
        },
      });
    }, [query.subscribeToMore]);
  }

  const disposeVars = useConst({});
  disposeVars.data = query.data;
  disposeVars.limit = limit;

  useEffect(() => {
    return () => {
      const { data, limit } = disposeVars;

      if (!data) return;

      const chatsData = data.chats.slice(0, limit);
      const firstChat = (chatsData.length == 1 ? chatsData[0] : data.firstChat) || null;

      // Reset fetchMore()
      query.client.writeQuery({
        query: chats,
        variables: { limit },
        data: {
          chats: chatsData,
          firstChat: firstChat,
        },
      });
    };
  }, [true]);

  return {
    ...query,
    clear: useCallback(() => {
      delete query.client.cache.data.data['ROOT_QUERY'][`chats({"limit":${limit}})`];
      delete query.client.cache.data.data['ROOT_QUERY']['firstChat'];
    }, [true]),
    fetchMore: useCallback((...args) => {
      if (!query.data) return;
      if (query.data.firstChat?.id === query.data.chats.slice(-1)[0]?.id) return;

      const [lazyLimit = limit, options = {}] = compactOptions(2, args);

      return query.fetchMore({
        ...options,
        variables: {
          limit: lazyLimit,
          anchor: query.data.chats[query.data.chats.length - 1]?.id,
        },
        updateQuery(prev, { fetchMoreResult }) {
          if (!fetchMoreResult) return prev;

          return {
            ...fetchMoreResult,
            chats: [...prev.chats, ...fetchMoreResult.chats]
          };
        },
      });
    }, [query.fetchMore, query.data, limit]),
  };
};

export default chats;
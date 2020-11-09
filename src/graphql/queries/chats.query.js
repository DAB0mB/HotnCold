import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback, useEffect } from 'react';

import * as fragments from '../../graphql/fragments';
import { compactOptions, omit, useConst } from '../../utils';

const chats = gql `
  query Chats($limit: Int!, $anchor: ID) {
    chats(limit: $limit, anchor: $anchor, includeThreads: true) {
      ...Chat
    }
    firstChat(includeThreads: true) {
      ...Chat
    }
  }
  ${fragments.chat}
`;

const $chats = chats;

chats.use = (...args) => {
  const subscriptions = require('../subscriptions');
  const [limit = 12, options = {}] = compactOptions(2, args);

  const query = useQuery(chats, {
    variables: { limit },
    fetchPolicy: 'cache-and-network',
    ...omit(options, ['subscribeToChanges']),
  });

  const refs = useConst({});
  refs.data = query.data;
  refs.limit = limit;

  if (options.subscribeToChanges) {
    const sub = subscriptions.chatBumped.use();

    useEffect(() => {
      if (!sub.data) return;
      if (!refs.data) return;

      const { chatBumped } = sub.data;
      const chats = refs.data.chats.slice();
      const chatIndex = chats.findIndex(c => c.id === chatBumped.id);

      if (~chatIndex) {
        chats.splice(chatIndex, 1);
      }

      chats.unshift(chatBumped);

      const firstChat = chats.length == 1 ? chats[0] : refs.data.firstChat;

      query.client.writeQuery({
        query: $chats,
        variables: { limit: refs.limit },
        data: {
          chats,
          firstChat,
        },
      });
    }, [sub.data]);
  }

  useEffect(() => {
    return () => {
      const { data, limit } = refs;

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
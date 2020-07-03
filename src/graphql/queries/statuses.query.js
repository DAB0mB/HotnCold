import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback, useEffect } from 'react';

import * as fragments from '../../graphql/fragments';
import { compactOptions, useConst } from '../../utils';
import mine from './mine.query';

const statuses = gql `
  query Statuses($limit: Int!, $anchor: ID) {
    statuses(limit: $limit, anchor: $anchor) {
      ...StatusItem
    }

    firstStatus {
      ...StatusItem
    }
  }

  ${fragments.status.item}
`;

statuses.use = (...args) => {
  const [limit = 12, options = {}] = compactOptions(2, args);
  const { data: { me } = {} } = mine.use();
  const myId = me?.id;

  const query = useQuery(statuses, {
    ...options,
    variables: { limit },
    skip: !myId,
    fetchPolicy: 'cache-and-network',
  });

  const disposeVars = useConst({});
  disposeVars.data = query.data;
  disposeVars.limit = limit;

  useEffect(() => {
    return () => {
      const { data, limit } = disposeVars;

      if (!data) return;

      const statusesData = data.statuses.slice(0, limit);
      const firstStatus = (statusesData.length == 1 ? statusesData[0] : data.firstStatus) || null;

      // Reset fetchMore()
      query.client.writeQuery({
        query: statuses,
        variables: { limit },
        data: {
          statuses: statusesData,
          firstStatus: firstStatus,
        },
      });
    };
  }, [true]);

  useEffect(() => {
    const onStatusCreate = ({ operationName, data }) => {
      if (operationName != 'CreateStatus') return;

      const status = {
        ...data.createStatus,
        chat: {
          id: data.createStatus.chat.id,
          subscribed: false,
        },
      };

      query.client.writeQuery({
        query: statuses,
        variables: { limit },
        data: {
          ...query.data,
          statuses: [status, ...query.data.statuses],
        },
      });
    };

    const onChatSubscriptionChange = ({ operationName, data, variables }) => {
      if (operationName != 'ToggleChatSubscription') return;

      const status = query.data.statuses.find(s => s.chat.id === variables.chatId);
      const subscriptionState = data.toggleChatSubscription;

      fragments.status.item.write(query.client, {
        ...status,
        chat: {
          ...status.chat,
          subscribed: subscriptionState,
        },
      });
    };

    query.client.events.on('response', onStatusCreate);
    query.client.events.on('response', onChatSubscriptionChange);

    return () => {
      query.client.events.off('response', onStatusCreate);
      query.client.events.off('response', onChatSubscriptionChange);
    };
  }, [query.data]);

  return {
    ...query,
    fetchMore: useCallback((...args) => {
      if (!query.data) return;
      if (query.data.firstStatus?.id === query.data.statuses[query.data.statuses.length - 1]?.id) return;

      const [lazyLimit = limit, options = {}] = compactOptions(2, args);

      return query.fetchMore({
        ...options,
        variables: {
          limit: lazyLimit,
          anchor: query.data.statuses[query.data.statuses.length - 1]?.id,
        },
        updateQuery(prev, { fetchMoreResult }) {
          if (!fetchMoreResult) return prev;

          return {
            ...fetchMoreResult,
            statuses: [...prev.statuses, ...fetchMoreResult.statuses]
          };
        },
      });
    }, [query.fetchMore, query.data, limit]),
  };
};

export default statuses;

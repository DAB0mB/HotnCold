import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback, useEffect } from 'react';

import * as fragments from '../../graphql/fragments';
import { compactOptions, omit, useConst } from '../../utils';
import mine from './mine.query';

const statuses = gql `
  query Statuses($userId: ID!, $limit: Int!, $anchor: ID) {
    statuses(userId: $userId, limit: $limit, anchor: $anchor) {
      ...Status
    }

    veryFirstStatus(userId: $userId) {
      ...Status
    }
  }

  ${fragments.status}
`;

statuses.use = (...args) => {
  const [userId, limit = 12, options = {}] = compactOptions(3, args);

  // TODO: Implement according to needs + subscriptions
  return useQuery(statuses, {
    fetchPolicy: 'no-cache',
    ...options,
    variables: { userId, limit },
  });
};

statuses.use.mine = (...args) => {
  const subscriptions = require('../subscriptions');

  const [limit = 12, options = {}] = compactOptions(2, args);
  const { data: { me } = {} } = mine.use();
  const myId = me?.id;

  const query = useQuery(statuses, {
    variables: { userId: myId, limit },
    fetchPolicy: 'cache-and-network',
    skip: !myId,
    ...omit(options, ['subscribeToChanges']),
  });

  const disposeVars = useConst({});
  disposeVars.data = query.data;
  disposeVars.limit = limit;
  disposeVars.userId = myId;

  useEffect(() => {
    return () => {
      const { data, limit, userId } = disposeVars;

      if (!data) return;

      const statusesData = data.statuses.slice(0, limit);
      const veryFirstStatus = statusesData.length == 1 ? statusesData[0] : data.veryFirstStatus;

      // Reset fetchMore()
      query.client.writeQuery({
        query: statuses,
        variables: { limit, userId },
        data: {
          statuses: statusesData,
          veryFirstStatus: veryFirstStatus || null,
        },
      });
    };
  }, [true]);

  // TODO: Update locally, move the following listeners to generic hook
  if (options.subscribeToChanges) {
    useEffect(() => {
      if (!myId) return;

      return query.subscribeToMore({
        document: subscriptions.statusCreated,
        variables: { userId: myId },
        updateQuery(prev, { subscriptionData }) {
          if (!subscriptionData.data) return;

          const { statusCreated } = subscriptionData.data;
          const publishedAt = new Date(statusCreated.publishedAt);

          let insertIndex = query.data.statuses.findIndex(s => new Date(s.publishedAt) > publishedAt);
          if (insertIndex == -1) {
            insertIndex = query.data.statuses.length;
          }

          let statuses = query.data.statuses.slice();
          statuses.splice(insertIndex, 0, statusCreated);
          statuses = statuses.slice(0, limit);

          const veryFirstStatus = statuses.length == 1 ? statuses[0] : query.data.veryFirstStatus;

          return {
            statuses,
            veryFirstStatus: veryFirstStatus || null,
          };
        },
      });
    }, [query.subscribeToMore, query.data, myId, limit]);

    useEffect(() => {
      if (!myId) return;

      return query.subscribeToMore({
        document: subscriptions.statusDeleted,
        variables: { userId: myId },
        updateQuery(prev, { subscriptionData }) {
          if (!subscriptionData.data) return;

          const { statusDeleted } = subscriptionData.data;

          const statuses = query.data.statuses.slice();
          const deletedIndex = statuses.findIndex(s => s.id === statusDeleted);

          if (!~deletedIndex) {
            return prev;
          }

          statuses.splice(deletedIndex, 1);

          let veryFirstStatus = query.data.veryFirstStatus;
          veryFirstStatus = statusDeleted === veryFirstStatus?.id ? statuses.slice(-1)[0] : veryFirstStatus;

          return {
            statuses,
            veryFirstStatus: veryFirstStatus || null,
          };
        },
      });
    }, [query.subscribeToMore, query.data, myId]);
  }

  return {
    ...query,
    fetchMore: useCallback((...args) => {
      const [extraLimit = limit, options = {}] = compactOptions(2, args);

      if (
        query.data.veryFirstStatus &&
        query.data.veryFirstStatus.id === query.data.statuses.slice(-1)[0].id
      ) {
        return;
      }

      return query.fetchMore({
        variables: {
          userId: myId,
          limit: extraLimit,
          anchor: query.data.statuses[query.data.statuses.length - 1].id,
        },
        updateQuery(prev, { fetchMoreResult }) {
          if (!fetchMoreResult) return;

          return {
            ...prev,
            statuses: [...prev.statuses, ...fetchMoreResult.statuses]
          };
        },
        ...options,
      });
    }, [query.fetchMore, query.data, myId, limit]),
  };
};

export default statuses;

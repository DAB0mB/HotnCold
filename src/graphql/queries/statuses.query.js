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

// TODO: Implement
statuses.use = (...args) => {
  const [userId, limit = 12, options = {}] = compactOptions(3, args);

  return useQuery(statuses, {
    fetchPolicy: 'no-cache',
    ...options,
    variables: { userId, limit },
  });
};

statuses.use.mine = (...args) => {
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
      const veryFirstStatus = (statusesData.length == 1 ? statusesData[0] : data.veryFirstStatus) || null;

      // Reset fetchMore()
      query.client.writeQuery({
        query: statuses,
        variables: { limit, userId },
        data: {
          statuses: statusesData,
          veryFirstStatus: veryFirstStatus,
        },
      });
    };
  }, [true]);

  if (options.subscribeToChanges) {
    useEffect(() => {
      if (!myId) return;
      if (!query.data) return;

      const statusesAst = statuses;

      const onResponse = ({ operationName, data }) => {
        if (operationName !== 'CreateStatus') return;

        let statusCreated = data.createStatus;

        if (!statusCreated) return;

        statusCreated = { ...statusCreated };
        const publishedAt = new Date(statusCreated.publishedAt);
        let statuses = query.data.statuses.slice();
        let veryFirstStatus = query.data.veryFirstStatus;
        let insertIndex = statuses.findIndex(s => new Date(s.publishedAt) > publishedAt);

        if (insertIndex == -1) {
          insertIndex = statuses.length;
        }

        statuses.splice(insertIndex, 0, statusCreated);
        statuses = statuses.slice(0, limit);
        veryFirstStatus = (statuses.length == 1 ? statuses[0] : veryFirstStatus) || null;

        query.client.writeQuery({
          query: statusesAst,
          variables: { limit, userId: myId },
          data: {
            statuses,
            veryFirstStatus,
          },
        });
      };

      query.client.events.on('response', onResponse);

      return () => {
        query.client.events.off('response', onResponse);
      };
    }, [myId, limit, query.data]);


    useEffect(() => {
      if (!myId) return;
      if (!query.data) return;

      const statusesAst = statuses;

      const onResponse = ({ operationName, data, variables }) => {
        if (operationName !== 'DeleteStatus') return;

        const statusDeleted = data.deleteStatus;

        if (!statusDeleted) return;

        let statuses = query.data.statuses.slice();
        let veryFirstStatus = query.data.veryFirstStatus;
        const { statusId: statusDeletedId } = variables;
        const deletedIndex = statuses.findIndex(s => s.id === statusDeletedId);

        if (!~deletedIndex) return;

        statuses.splice(deletedIndex, 1);
        veryFirstStatus = (statusDeletedId === veryFirstStatus?.id ? statuses.slice(-1)[0] : veryFirstStatus) || null;

        query.client.writeQuery({
          query: statusesAst,
          variables: { limit, userId: myId },
          data: {
            statuses,
            veryFirstStatus,
          },
        });
      };

      query.client.events.on('response', onResponse);

      return () => {
        query.client.events.off('response', onResponse);
      };
    }, [myId, limit, query.data]);
  }

  return {
    ...query,
    fetchMore: useCallback((...args) => {
      if (!query.data) return;
      if (query.data.veryFirstStatus?.id === query.data.statuses[query.data.statuses.length - 1]?.id) return;

      const [lazyLimit = limit, options = {}] = compactOptions(2, args);

      return query.fetchMore({
        ...options,
        variables: {
          userId: myId,
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
    }, [query.fetchMore, query.data, myId, limit]),
  };
};

export default statuses;

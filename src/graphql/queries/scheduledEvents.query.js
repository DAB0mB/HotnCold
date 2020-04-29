import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback, useEffect } from 'react';

import * as fragments from '../../graphql/fragments';
import { compactOptions, useConst } from '../../utils';

const scheduledEvents = gql `
  query ScheduledEvents($limit: Int!, $anchor: ID) {
    scheduledEvents(limit: $limit, anchor: $anchor) {
      ...Event
    }

    veryFirstScheduledEvent {
      ...Event
    }
  }

  ${fragments.event}
`;

scheduledEvents.use = (...args) => {
  const [limit = 12, options = {}] = compactOptions(2, args);

  const query = useQuery(scheduledEvents, {
    variables: { limit },
    fetchPolicy: 'cache-and-network',
    ...options,
  });

  const disposeVars = useConst({});
  disposeVars.data = query.data;
  disposeVars.limit = limit;

  useEffect(() => {
    return () => {
      const { data, limit } = disposeVars;

      if (!data) return;

      const scheduledEventsData = data.scheduledEvents.slice(0, limit);
      const veryFirstScheduledEvent = scheduledEventsData.length == 1 ? scheduledEventsData[0] : data.veryFirstScheduledEvent;

      // Reset fetchMore()
      query.client.writeQuery({
        query: scheduledEvents,
        variables: { limit },
        data: {
          scheduledEvents: scheduledEventsData,
          veryFirstScheduledEvent: veryFirstScheduledEvent || null,
        },
      });
    };
  }, [true]);

  return {
    ...query,
    fetchMore: useCallback((...args) => {
      const [extraLimit = limit, options = {}] = compactOptions(2, args);

      if (
        query.data.veryFirstScheduledEvent &&
        query.data.veryFirstScheduledEvent.id === query.data.scheduledEvents.slice(-1)[0].id
      ) {
        return;
      }

      return query.fetchMore({
        variables: {
          limit: extraLimit,
          anchor: query.data.scheduledEvents[query.data.scheduledEvents.length - 1].id,
        },
        updateQuery(prev, { fetchMoreResult }) {
          if (!fetchMoreResult) return;

          return {
            ...prev,
            scheduledEvents: [...prev.scheduledEvents, ...fetchMoreResult.scheduledEvents]
          };
        },
        ...options,
      });
    }, [query.fetchMore, query.data, limit]),
  };
};

export default scheduledEvents;

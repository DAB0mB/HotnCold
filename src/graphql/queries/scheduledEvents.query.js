import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback, useEffect } from 'react';

import * as fragments from '../../graphql/fragments';
import { compactOptions, useConst, omit } from '../../utils';
import mine from './mine.query';

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
  const { data: { me } = {} } = mine.use();
  const myId = me?.id;

  const query = useQuery(scheduledEvents, {
    variables: { limit },
    fetchPolicy: 'cache-and-network',
    skip: !myId,
    ...omit(options, ['subscribeToChanges']),
  });

  const disposeVars = useConst({});
  disposeVars.data = query.data;
  disposeVars.limit = limit;

  useEffect(() => {
    return () => {
      const { data, limit } = disposeVars;

      if (!data) return;

      const scheduledEventsData = data.scheduledEvents.slice(0, limit);
      const veryFirstScheduledEvent = (scheduledEventsData.length == 1 ? scheduledEventsData[0] : data.veryFirstScheduledEvent) || null;

      // Reset fetchMore()
      query.client.writeQuery({
        query: scheduledEvents,
        variables: { limit },
        data: {
          scheduledEvents: scheduledEventsData,
          veryFirstScheduledEvent,
        },
      });
    };
  }, [true]);

  if (options.subscribeToChanges) {
    useEffect(() => {
      if (!myId) return;
      if (!query.data) return;

      const scheduledEventsAst = scheduledEvents;

      const onResponse = ({ operationName, data }) => {
        if (operationName !== 'ToggleCheckIn') return;

        const event = { ...data.toggleCheckIn };
        const checkedInAt = new Date(event.checkedInAt);
        let scheduledEvents = query.data.scheduledEvents.slice();
        let veryFirstScheduledEvent = query.data.veryFirstScheduledEvent;

        if (event.checkedIn) {
          let insertIndex = scheduledEvents.findIndex(e => new Date(e.checkedInAt) > checkedInAt);

          if (insertIndex == -1) {
            insertIndex = scheduledEvents.length;
          }

          scheduledEvents.splice(insertIndex, 0, event);
          scheduledEvents = scheduledEvents.slice(0, limit);
          veryFirstScheduledEvent = (scheduledEvents.length == 1 ? scheduledEvents[0] : veryFirstScheduledEvent) || null;
        }
        else {
          const deletedIndex = scheduledEvents.findIndex(e => e.id === event.id);

          if (!~deletedIndex) return;

          scheduledEvents.splice(deletedIndex, 1);
          veryFirstScheduledEvent = (event.id === veryFirstScheduledEvent?.id ? scheduledEvents.slice(-1)[0] : veryFirstScheduledEvent) || null;
        }

        query.client.writeQuery({
          query: scheduledEventsAst,
          variables: { limit },
          data: {
            scheduledEvents,
            veryFirstScheduledEvent,
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
      if (query.data.veryFirstScheduledEvent.id === query.data.scheduledEvents.slice(-1)[0].id) return;

      const [lazyLimit = limit, options = {}] = compactOptions(2, args);

      return query.fetchMore({
        ...options,
        variables: {
          limit: lazyLimit,
          anchor: query.data.scheduledEvents[query.data.scheduledEvents.length - 1]?.id,
        },
        updateQuery(prev, { fetchMoreResult }) {
          if (!fetchMoreResult) return prev;

          return {
            ...fetchMoreResult,
            scheduledEvents: [...prev.scheduledEvents, ...fetchMoreResult.scheduledEvents]
          };
        },
      });
    }, [query.fetchMore, query.data, limit]),
  };
};

export default scheduledEvents;

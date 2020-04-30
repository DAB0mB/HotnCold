import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback, useEffect } from 'react';

import * as fragments from '../../graphql/fragments';
import { compactOptions, useConst } from '../../utils';

const attendees = gql `
  query Attendees($eventId: ID!, $limit: Int!, $anchor: ID) {
    attendees(eventId: $eventId, limit: $limit, anchor: $anchor) {
      ...Attendee
    }

    veryFirstAttendee(eventId: $eventId) {
      ...Attendee
    }
  }

  ${fragments.attendee}
`;

attendees.use = (...args) => {
  const [eventId, limit = 12, options = {}] = compactOptions(3, args);

  const query = useQuery(attendees, {
    variables: { eventId, limit },
    fetchPolicy: 'cache-and-network',
    ...options,
  });

  const disposeVars = useConst({});
  disposeVars.data = query.data;
  disposeVars.limit = limit;
  disposeVars.eventId = eventId;

  useEffect(() => {
    return () => {
      const { data, limit, eventId } = disposeVars;

      if (!data) return;

      const attendeesData = data.attendees.slice(0, limit);
      const veryFirstAttendee = attendeesData.length == 1 ? attendeesData[0] : data.veryFirstAttendee;

      // Reset fetchMore()
      query.client.writeQuery({
        query: attendees,
        variables: { limit, eventId },
        data: {
          attendees: attendeesData,
          veryFirstAttendee: veryFirstAttendee || null,
        },
      });
    };
  }, [true]);

  return {
    ...query,
    clear: useCallback(() => {
      delete query.client.cache.data.data['ROOT_QUERY'][`attendees({"eventId":"${eventId}","limit":${limit}})`];
    }, [true]),
    fetchMore: useCallback((...args) => {
      const [extraLimit = limit, options = {}] = compactOptions(2, args);

      if (
        query.data.veryFirstAttendee &&
        query.data.veryFirstAttendee.id === query.data.attendees.slice(-1)[0].id
      ) {
        return;
      }

      return query.fetchMore({
        variables: {
          eventId,
          limit: extraLimit,
          anchor: query.data.attendees[query.data.attendees.length - 1].id,
        },
        updateQuery(prev, { fetchMoreResult }) {
          if (!fetchMoreResult) return;

          return {
            ...prev,
            attendees: [...prev.attendees, ...fetchMoreResult.attendees]
          };
        },
        ...options,
      });
    }, [query.fetchMore, query.data, eventId, limit]),
  };
};

export default attendees;

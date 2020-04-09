import { useLazyQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import { compactOptions } from '../../utils';

const eventDescription = gql `
  query EventDescription($eventSource: EventSource!, $eventId: ID!, $urlname: String) {
    eventDescription(eventSource: $eventSource, eventId: $eventId, urlname: $urlname)
  }
`;

eventDescription.use = (...args) => {
  const [eventSource, eventId, urlname, options] = compactOptions(4, args);

  const [runQuery, query] = useLazyQuery(eventDescription, {
    fetchPolicy: 'no-cache',
    ...options,
    variables: { eventSource, eventId, urlname },
  });

  const runEventQuery = useCallback((...args) => {
    const [eventSource, eventId, urlname, options] = compactOptions(4, args);

    return runQuery({
      ...options,
      variables: { eventSource, eventId, urlname },
    });
  }, [runQuery]);

  return [runEventQuery, query];
};

export default eventDescription;

import { useLazyQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../../graphql/fragments';
import { compactOptions } from '../../utils';

const event = gql `
  query Event($eventId: ID!) {
    event(eventId: $eventId) {
      ...Event
    }
  }

  ${fragments.event}
`;

event.use = (...args) => {
  const [eventId, options] = compactOptions(2, args);
  const variables = { eventId };

  const [runQuery, query] = useLazyQuery(event, {
    fetchPolicy: 'no-cache',
    ...options,
    variables,
  });

  const runEventQuery = useCallback((...args) => {
    const [eventId, options] = compactOptions(2, args);

    return runQuery({
      ...options,
      variables: { ...variables, eventId },
    });
  }, [runQuery, eventId]);

  return [runEventQuery, query];
};

export default event;

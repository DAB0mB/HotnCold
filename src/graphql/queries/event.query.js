import { useLazyQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../../graphql/fragments';
import { compactOptions } from '../../utils';

const event = gql `
  query Event($eventId: ID!) {
    event(eventId: $eventId) {
      ...FullEvent
    }
  }

  ${fragments.event.full}
`;

event.use = (options) => {
  const [runQuery, query] = useLazyQuery(event, {
    fetchPolicy: 'no-cache',
    ...options,
  });

  const runEventQuery = useCallback((...args) => {
    const [eventId, options] = compactOptions(2, args);

    return runQuery({
      ...options,
      variables: { eventId },
    });
  }, [runQuery]);

  return [runEventQuery, query];
};

export default event;

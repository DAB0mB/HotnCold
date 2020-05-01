import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import { compactOptions } from '../../utils';
import * as fragments from '../fragments';

const toggleCheckIn = gql `
  mutation ToggleCheckIn($eventId: ID!, $checkedIn: Boolean) {
    toggleCheckIn(eventId: $eventId, checkedIn: $checkedIn) {
      ...Event
    }
  }

  ${fragments.event}
`;

toggleCheckIn.use = (...args) => {
  const [defaultEvent, defaultCheckedIn, options = {}] = compactOptions(3, args);

  const [superMutate, mutation] = useMutation(toggleCheckIn, {
    ...options,
  });

  const mutate = useCallback((...args) => {
    const [event = defaultEvent, checkedIn = defaultCheckedIn || !event.checkedIn, options = {}] = compactOptions(3, args);

    return superMutate({
      variables: { eventId: event.id, checkedIn },
      optimisticResponse: {
        __typename: 'Mutation',
        toggleCheckIn: {
          ...event,
          __typename: 'Event',
          toggleCheckIn: checkedIn,
        },
      },
      ...options,
    });
  }, [superMutate, defaultEvent, defaultCheckedIn]);

  return [mutate, mutation];
};

export default toggleCheckIn;

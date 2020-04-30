import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../fragments';

const toggleCheckIn = gql `
  mutation ToggleCheckIn($eventId: ID!) {
    toggleCheckIn(eventId: $eventId)
  }
`;

toggleCheckIn.use = (event, options = {}) => {
  const [superMutate, mutation] = useMutation(toggleCheckIn, {
    variables: { eventId: event.id },
    ...options,
  });

  const mutate = useCallback((options = {}) => {
    const eventId = event.id;
    const attending = !event.attending;

    return superMutate({
      optimisticResponse: {
        __typename: 'Mutation',
        toggleCheckIn: !event.checkedIn,
      },
      update(cache, mutation) {
        if (mutation.error) return;

        let event = fragments.event.read(cache, eventId);

        if (!event) return;

        event = { ...event, attending };
        fragments.event.write(cache, event);
      },
      ...options,
    });
  }, [superMutate, event]);

  return [mutate, mutation];
};

export default toggleCheckIn;

import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../fragments';

const pickupStatus = gql `
  mutation PickupStatus {
    pickupStatus
  }
`;

pickupStatus.use = (defaultOptions = {}) => {
  const queries = require('../queries');

  const { data: { me } = {} } = queries.mine.use();
  const [superMutate, mutation] = useMutation(pickupStatus, defaultOptions);

  const mutate = useCallback((options = {}) => {
    const onError = defaultOptions.onError || Promise.reject.bind(Promise);

    if (!me.status) {
      const error = Error('You must create a status first');

      return onError(error);
    }

    if (!me.location) {
      const error = Error('Make sure your location services are on');

      return onError(error);
    }

    // Token should be stored via response.headers, see graphql/client.js
    return superMutate({
      optimisticResponse: {
        __typename: 'Mutation',
        pickupStatus: null,
      },
      update: (cache, mutation) => {
        if (mutation.error) return;

        const recentMe = fragments.user.profile.read(cache, me.id);
        const status = { ...recentMe.status };
        status.location = null;
        fragments.status.write(cache, status);
      },
      ...options,
    });
  }, [...Object.values(defaultOptions), superMutate, me]);

  return [mutate, mutation];
};

export default pickupStatus;

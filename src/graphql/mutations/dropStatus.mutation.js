import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../fragments';

const dropStatus = gql `
  mutation DropStatus {
    dropStatus
  }
`;

dropStatus.use = (defaultOptions = {}) => {
  const queries = require('../queries');

  const { data: { me } = {} } = queries.mine.use();
  const [superMutate, mutation] = useMutation(dropStatus, defaultOptions);

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
        dropStatus: me.location,
      },
      update: (cache, mutation) => {
        if (mutation.error) return;

        const status = { ...me.status };
        status.location = me.location;
        status.updateAt = new Date().toISOString();

        fragments.status.write(cache, status);
      },
      ...options,
    });
  }, [...Object.values(defaultOptions), superMutate, me]);

  return [mutate, mutation];
};

export default dropStatus;

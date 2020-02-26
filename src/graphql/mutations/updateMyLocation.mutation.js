import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../fragments';

const updateMyLocation = gql `
  mutation UpdateMyLocation($location: Vector2D!) {
    updateMyLocation(location: $location)
  }
`;

updateMyLocation.use = (defaultLocation, defaultOptions = {}) => {
  const queries = require('../queries');

  const { data: { me } = {} } = queries.mine.use();
  const [superMutate, mutation] = useMutation(updateMyLocation, defaultOptions);

  const mutate = useCallback((location = defaultLocation) => {
    return superMutate({
      update: (cache, mutation) => {
        if (mutation.error) return;

        const recentMe = fragments.user.profile.read(cache, me.id);
        fragments.user.profile.write(cache, { ...recentMe, location });
      },
      variables: { location },
    });
  }, [me, superMutate, defaultLocation]);

  return [mutate, mutation];
};

export default updateMyLocation;

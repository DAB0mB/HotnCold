import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../fragments';
import * as queries from '../queries';

const updateMyLocation = gql `
  mutation UpdateMyLocation($location: Vector2D!) {
    updateMyLocation(location: $location)
  }
`;

updateMyLocation.use = (defaultLocation, defaultOptions = {}) => {
  const { data: { me } = {} } = queries.me.use();
  const [superMutate, mutation] = useMutation(updateMyLocation, defaultOptions);

  const mutate = useCallback((location = defaultLocation) => {
    return superMutate({
      update: (cache, mutation) => {
        if (mutation.error) return;
        if (!me) return;

        fragments.user.write({ ...me, location });
      },
      variables: { location },
    })
  }, [me, superMutate, defaultLocation]);

  return [mutate, mutation];
};

export default updateMyLocation;

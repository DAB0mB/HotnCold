import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import { defHook } from '../../utils';
import * as fragments from '../fragments';
import * as queries from '../queries';

const updateMyLocation = gql `
  mutation UpdateMyLocation($location: Vector2D!) {
    updateMyLocation(location: $location)
  }
`;

defHook(updateMyLocation, (defaultLocation, defaultOptions = {}) => {
  const meQuery = queries.me.use();
  const [superMutate, mutation] = useMutation(updateMyLocation);

  const mutate = useCallback((location = defaultLocation) => {
    return superMutate({
      fetchPolicy: 'no-cache',
      update: (client, mutation) => {
        if (mutation.error) return;
        if (!meQuery.data) return;

        const { me } = meQuery.data;

        client.writeFragment({
          id: me.id,
          fragment: fragments.user,
          data: { ...me, location },
        });
      },
      ...defaultOptions,
      variables: { location },
    })
  }, [meQuery, superMutate, defaultLocation, defaultOptions]);

  return [mutate, mutation];
});

export default updateMyLocation;

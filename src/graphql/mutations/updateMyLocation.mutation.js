import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../fragments';

const updateMyLocation = gql `
  mutation UpdateMyLocation($location: Vector2D!, $featuredAt: DateTime!) {
    updateMyLocation(location: $location, featuredAt: $featuredAt)
  }
`;

updateMyLocation.use = (featuredAt) => {
  const queries = require('../queries');

  const { data: { me } = {} } = queries.mine.use();
  const [superMutate, mutation] = useMutation(updateMyLocation);

  const mutate = useCallback((location) => {
    return superMutate({
      update: (cache, mutation) => {
        if (mutation.error) return;

        const recentMe = fragments.user.profile.read(cache, me.id);
        fragments.user.profile.write(cache, {
          ...recentMe,
          location,
          area: {
            ...(recentMe.area || {}),
            timezone: mutation.data.updateMyLocation.properties.timezone,
          },
        });
      },
      variables: { location, featuredAt },
    });
  }, [me, superMutate, featuredAt]);

  return [mutate, mutation];
};

export default updateMyLocation;

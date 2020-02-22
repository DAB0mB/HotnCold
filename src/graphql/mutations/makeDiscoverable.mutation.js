import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../fragments';

const makeDiscoverable = gql `
  mutation MakeDiscoverable {
    makeDiscoverable
  }
`;

makeDiscoverable.use = (defaultOptions) => {
  const queries = require('../queries');

  const { data: { me } = {} } = queries.mine.use();
  const [superMutate, mutation] = useMutation(makeDiscoverable, defaultOptions);

  const mutate = useCallback((options) => {
    // Token should be stored via response.headers, see graphql/client.js
    return superMutate({
      optimisticResponse: {
        __typename: 'Mutation',
        makeDiscoverable: null,
      },
      update: (cache, mutation) => {
        if (mutation.error) return;

        fragments.user.profile.write(cache, {
          ...me,
          discoverable: true,
        });
      },
      ...options,
    });
  }, [superMutate, me]);

  return [mutate, mutation];
};

export default makeDiscoverable;

import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../fragments';

const makeIncognito = gql `
  mutation MakeIncognito {
    makeIncognito
  }
`;

makeIncognito.use = (defaultOptions) => {
  const queries = require('../queries');

  const { data: { me } = {} } = queries.mine.use();
  const [superMutate, mutation] = useMutation(makeIncognito, defaultOptions);

  const mutate = useCallback((options) => {
    // Token should be stored via response.headers, see graphql/client.js
    return superMutate({
      optimisticResponse: {
        __typename: 'Mutation',
        makeIncognito: null,
      },
      update: (cache, mutation) => {
        if (mutation.error) return;

        fragments.user.profile.write(cache, {
          ...me,
          discoverable: false,
        });
      },
      ...options,
    });
  }, [superMutate, me]);

  return [mutate, mutation];
};

export default makeIncognito;

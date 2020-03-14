import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../fragments';

const createStatus = gql `
  mutation CreateStatus($text: String!) {
    createStatus(text: $text) {
      ...Status
    }
  }

  ${fragments.status}
`;

createStatus.use = (text, defaultOptions = {}) => {
  const queries = require('../queries');

  const { data: { me } = {} } = queries.mine.use();

  return useMutation(createStatus, {
    ...defaultOptions,
    variables: { text },
    update: useCallback((cache, mutation) => {
      if (mutation.error) return;

      const recentMe = fragments.user.profile.read(cache, me.id);
      const status = mutation.data.createStatus;
      fragments.status.write(cache, status);
      fragments.user.result.write(cache, {
        ...recentMe,
        status,
      });
    }, [me]),
  });
};

export default createStatus;

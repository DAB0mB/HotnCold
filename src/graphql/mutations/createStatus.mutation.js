import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback, useMemo } from 'react';

import * as fragments from '../fragments';

const createStatus = gql `
  mutation CreateStatus($text: String!, $location: Vector2D!, $publishedAt: DateTime!) {
    createStatus(text: $text, location: $location, publishedAt: $publishedAt) {
      ...Status
    }
  }

  ${fragments.status}
`;

createStatus.use = (text, options = {}) => {
  const queries = require('../queries');

  const { data: { me } = {} } = queries.mine.use();
  text = useMemo(() => text.replace(/\n+/g, ' '), [text]);

  const [superMutate, mutation] = useMutation(createStatus, {
    ...options,
    update: useCallback((cache, mutation) => {
      if (mutation.error) return;

      const recentMe = fragments.user.profile.read(cache, me.id);
      const status = mutation.data.createStatus;
      fragments.status.write(cache, {
        ...status,
        user: recentMe,
      });
    }, [me]),
  });

  const mutate = useCallback((location, publishedAt) => {
    superMutate({
      variables: {
        text,
        location,
        publishedAt,
      },
    });
  }, [superMutate, text]);

  return [mutate, mutation];
};

export default createStatus;

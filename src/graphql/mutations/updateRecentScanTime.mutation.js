import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as queries from '../queries';

const updateRecentScanTime = gql `
  mutation UpdateRecentScanTime($clear: Boolean) {
    updateRecentScanTime(clear: $clear)
  }
`;

updateRecentScanTime.use = (options = {}) => {
  const { data: { me } = {} } = queries.me.use();
  const [superMutate, mutation] = useMutation(updateRecentScanTime, options);

  const mutate = useCallback((clear) => {
    return superMutate({
      variables: { clear },
    });
  }, [me, superMutate]);

  return [mutate, mutation];
};

export default updateRecentScanTime;

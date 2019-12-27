import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

const updateRecentScanTime = gql `
  mutation UpdateRecentScanTime($clear: Boolean) {
    updateRecentScanTime(clear: $clear)
  }
`;

updateRecentScanTime.use = (options = {}) => {
  const [superMutate, mutation] = useMutation(updateRecentScanTime, options);

  const mutate = useCallback((clear) => {
    return superMutate({
      variables: { clear },
    });
  }, [superMutate]);

  return [mutate, mutation];
};

export default updateRecentScanTime;

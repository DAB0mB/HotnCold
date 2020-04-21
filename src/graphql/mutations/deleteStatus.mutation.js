import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

const deleteStatus = gql `
  mutation DeleteStatus($statusId: ID!) {
    deleteStatus(statusId: $statusId)
  }
`;

deleteStatus.use = (options = {}) => {
  const [superMutate, mutation] = useMutation(deleteStatus, options);

  const mutate = useCallback((statusId, options = {}) => {
    return superMutate({
      variables: { statusId },
      ...options,
    });
  }, [superMutate]);

  return [mutate, mutation];
};

export default deleteStatus;

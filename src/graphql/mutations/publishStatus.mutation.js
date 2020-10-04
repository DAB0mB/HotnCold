import { useMutation } from '@apollo/react-hooks';
import { useCallback } from 'react';
import gql from 'graphql-tag';

const publishStatus = gql `
  mutation PublishStatus($statusId: ID!) {
    publishStatus(statusId: $statusId)
  }
`;

publishStatus.use = (statusId, options) => {
  const [superMutate, mutation] = useMutation(publishStatus, options);

  const mutate = useCallback(() => {
    mutation.client.events.emit('response', {
      operationName: 'PublishStatus',
      variables: { statusId },
    });

    return superMutate({
      variables: { statusId },
    });
  }, [statusId, superMutate]);

  return [mutate, mutation];
};

export default publishStatus;

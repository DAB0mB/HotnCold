import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

const associateNotificationsToken = gql `
  mutation AssociateNotificationsToken($token: String!) {
    associateNotificationsToken(token: $token)
  }
`;

associateNotificationsToken.use = (options) => {
  const [superMutate, mutation] = useMutation(associateNotificationsToken, options);

  const mutate = useCallback((token, options = {}) => {
    return superMutate({
      ...options,
      variables: { token },
    });
  }, [superMutate]);

  return [mutate, mutation];
};

export default associateNotificationsToken;

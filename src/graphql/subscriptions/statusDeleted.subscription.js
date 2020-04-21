import { useSubscription } from '@apollo/react-hooks';
import gql from 'graphql-tag';

const statusDeleted = gql `
  subscription StatusDeleted($userId: ID!) {
    statusDeleted(userId: $userId)
  }
`;

statusDeleted.use = (userId, options = {}) => {
  return useSubscription(statusDeleted, {
    variables: { userId },
    ...options,
  });
};

export default statusDeleted;

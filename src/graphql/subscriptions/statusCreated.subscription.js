import { useSubscription } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const statusCreated = gql `
  subscription StatusCreated($userId: ID!) {
    statusCreated(userId: $userId) {
      ...Status
    }
  }

  ${fragments.status}
`;

statusCreated.use = (userId, options = {}) => {
  return useSubscription(statusCreated, {
    variables: { userId },
    ...options,
  });
};

export default statusCreated;

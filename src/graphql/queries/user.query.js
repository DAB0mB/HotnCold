import { useQuery, useLazyQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const user = gql `
  query User($userId: ID, $userIds: [ID]) {
    user(userId: $userId, userIds: $userIds) {
      ...User
    }
  }

  ${fragments.user}
`;

user.use = (options) => {
  return useQuery(user, options);
};

user.use.lazy = (options = {}) => {
  return useLazyQuery(user, {
    fetchPolicy: 'no-cache',
    ...options,
  });
};

export default user;
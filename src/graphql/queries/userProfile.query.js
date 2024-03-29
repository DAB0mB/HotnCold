import { useQuery, useLazyQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const userProfile = gql `
  query UserProfile($userId: ID!) {
    userProfile(userId: $userId) {
      ...UserProfile
    }
  }

  ${fragments.user.profile}
`;

userProfile.use = (userId, options = {}) => {
  return useQuery(userProfile, {
    fetchPolicy: 'no-cache',
    variables: { userId },
    skip: !userId,
    ...options,
  });
};

userProfile.use.lazy = (options = {}) => {
  return useLazyQuery(userProfile, {
    fetchPolicy: 'no-cache',
    ...options,
  });
};

export default userProfile;

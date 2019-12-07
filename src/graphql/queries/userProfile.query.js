import { useQuery, useLazyQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const userProfile = gql `
  query UserProfile($userId: ID, $randromMock: Boolean) {
    userProfile(userId: $userId, randromMock: $randromMock) {
      ...UserProfile
    }
  }

  ${fragments.user.profile}
`;

userProfile.use = (options = {}) => {
  return useQuery(userProfile, {
    fetchPolicy: 'no-cache',
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

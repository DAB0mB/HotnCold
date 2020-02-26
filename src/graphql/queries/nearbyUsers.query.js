import { useQuery, useLazyQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const nearbyUsers = gql `
  query NearbyUsers {
    nearbyUsers {
      ...UserResult
    }
  }

  ${fragments.user.result}
`;

nearbyUsers.use = (options) => {
  return useQuery(nearbyUsers, options);
};

nearbyUsers.use.lazy = (options) => {
  return useLazyQuery(nearbyUsers, options);
};

export default nearbyUsers;

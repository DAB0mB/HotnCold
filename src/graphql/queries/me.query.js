import { useApolloClient, useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const me = gql `
  query Me {
    me {
      ...UserProfile
    }
  }

  ${fragments.user.profile}
`;

me.use = (options) => {
  return useQuery(me, options);
};

export default me;

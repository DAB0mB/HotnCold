import { useSubscription } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const userRegistered = gql `
  subscription UserRegistered {
    userRegistered {
      ...User
    }
  }

  ${fragments.user}
`;

userRegistered.use = (options = {}) => {
  return useSubscription(userRegistered, options);
};

export default userRegistered;

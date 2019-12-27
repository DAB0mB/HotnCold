import { useSubscription } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const userCreated = gql `
  subscription UserCreated {
    userCreated {
      ...User
    }
  }

  ${fragments.user}
`;

userCreated.use = (options = {}) => {
  return useSubscription(userCreated, options);
};

export default userCreated;

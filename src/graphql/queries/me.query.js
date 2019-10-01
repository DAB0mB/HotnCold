import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const me = gql `
  query Me {
    me {
      ...User
    }
  }

  ${fragments.user}
`;

me.use = () => {
  return useQuery(me);
};

export default me;

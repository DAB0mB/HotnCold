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

me.withArea = gql `
  query MeWithArea {
    me {
      ...UserWithArea
    }
  }

  ${fragments.user.withArea}
`;

me.use = () => {
  return useQuery(me);
};

me.withArea.use = () => {
  return useQuery(me.withArea);
};

export default me;

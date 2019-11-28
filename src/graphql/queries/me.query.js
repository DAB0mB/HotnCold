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

me.forSocial = gql `
  query MeForSocial {
    me {
      ...UserForSocial
    }
  }

  ${fragments.user.forSocial}
`;

me.use = (options, ast = me) => {
  return useQuery(ast, options);
};

me.forSocial.use = (options) => {
  return me.use(options, me.forSocial);
};

export default me;

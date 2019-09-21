import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import { defHook } from '../../utils';
import * as fragments from '../fragments';

const me = gql `
  query Me {
    me {
      ...User
    }
  }

  ${fragments.user}
`;

defHook(me, () => {
  return useQuery(me);
});

export default me;

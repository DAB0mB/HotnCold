import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { Image } from 'react-native';

import * as fragments from '../fragments';

const me = gql `
  query Me {
    me {
      ...UserProfile
    }
  }

  ${fragments.user.profile}
`;

me.use = ({ onCompleted = () => {}, ...options } = {}) => {
  return useQuery(me, {
    onCompleted: (data) => {
      const { me } = data;

      if (me) {
        Image.prefetch(me.avatar);

        me.pictures.forEach(p => Image.prefetch(p));
      }

      onCompleted(data);
    },
    ...options,
  });
};

export default me;

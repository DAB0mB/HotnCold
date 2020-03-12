import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { Image } from 'react-native';

import * as fragments from '../fragments';

const mine = gql `
  query Mine {
    myContract {
      ...Contract
    }

    me {
      ...UserProfile
    }
  }

  ${fragments.contract}
  ${fragments.user.profile}
`;

mine.use = ({ onCompleted = () => {}, ...options } = {}) => {
  return useQuery(mine, {
    onCompleted: (data) => {
      const { me } = data || {};

      if (me) {
        Image.prefetch(me.avatar);

        me.pictures.forEach(p => Image.prefetch(p));
      }

      onCompleted(data);
    },
    ...options,
  });
};

export default mine;

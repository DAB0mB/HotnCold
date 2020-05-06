import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';
import { Image } from 'react-native';

import { noop } from '../../utils';
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

mine.use = ({ onCompleted = noop, ...options } = {}) => {
  const query = useQuery(mine, {
    onCompleted: useCallback((data) => {
      const { me } = data || {};

      if (me) {
        if (me.avatar) {
          Image.prefetch(me.avatar);
        }

        me.pictures.forEach(p => Image.prefetch(p));
      }

      onCompleted(data);
    }, [onCompleted]),
    ...options,
  });

  return query;
};

export default mine;

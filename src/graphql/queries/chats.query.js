import { useQuery } from '@apollo/react-hooks';
import { useEffect } from 'react';
import { Image } from 'react-native';
import gql from 'graphql-tag';

import { omit } from '../../utils';
import * as fragments from '../fragments';
import mine from './mine.query';

const chats = gql `
  query Chats {
    chats {
      ...Chat
    }
  }

  ${fragments.chat}
`;

chats.use = ({ onCompleted = () => {}, ...options } = {}) => {
  const subscriptions = require('../subscriptions');

  const { data: { me } = {} } = mine.use();

  const query = useQuery(chats, {
    skip: !me,
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      if (data?.chats) {
        data.chats.forEach(c => Image.prefetch(c.picture));
      }

      onCompleted(data);
    },
    ...omit(options, ['subscribeToChanges']),
  });

  if (options.subscribeToChanges) {
    useEffect(() => {
      return query.subscribeToMore({
        document: subscriptions.chatBumped,
        updateQuery(prev, { subscriptionData }) {
          if (!subscriptionData.data) return;

          const { chatBumped } = subscriptionData.data;
          const chats = prev.chats.slice();
          const chatIndex = chats.findIndex(c => c.id === chatBumped.id);

          if (~chatIndex) {
            chats.splice(chatIndex, 1);
          }

          chats.push(chatBumped);

          return { chats };
        },
      });
    }, [query.subscribeToMore]);
  }

  return query;
};

export default chats;

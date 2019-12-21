import { useQuery } from '@apollo/react-hooks';
import { useEffect } from 'react';
import { Image } from 'react-native';
import gql from 'graphql-tag';

import * as fragments from '../fragments';
import * as subscriptions from '../subscriptions';

const chats = gql `
  query Chats {
    chats {
      ...Chat
    }
  }

  ${fragments.chat}
`;

chats.use = ({ onCompleted = () => {}, ...options } = {}) => {
  const query = useQuery(chats, {
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      const { chats } = data;

      if (chats) {
        chats.forEach(c => Image.prefetch(c.picture));
      }

      onCompleted(data);
    },
    ...options,
  });

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

  return query;
};

export default chats;

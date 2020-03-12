import { useQuery, useLazyQuery } from '@apollo/react-hooks';
import { useEffect } from 'react';
import { Image } from 'react-native';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

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

  const query = useQuery(chats, {
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      if (data?.chats) {
        data.chats.forEach(c => Image.prefetch(c.picture));
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

chats.use.lazy = ({ onCompleted = () => {}, ...options } = {}) => {
  const [runQuery, query] = useLazyQuery(chats, {
    onCompleted: (data) => {
      if (data?.chats) {
        data.chats.forEach(c => Image.prefetch(c.picture));
      }

      onCompleted(data);
    },
    ...options,
  });

  return [runQuery, query];
};

export default chats;

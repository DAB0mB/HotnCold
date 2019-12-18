import { useQuery } from '@apollo/react-hooks';
import { useEffect } from 'react';
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

chats.use = (options = {}) => {
  const query = useQuery(chats, {
    fetchPolicy: 'cache-and-network',
    ...options,
  });

  useEffect(() => {
    return query.subscribeToMore({
      document: subscriptions.chatBumped,
      updateQuery(prev, { subscriptionData }) {
        if (!subscriptionData.data) return;

        const { chatBumed } = subscriptionData.data;
        const chats = prev.chats.slice();
        const chatIndex = chats.findIndex(c => c.id === chatBumed.id);

        if (~chatIndex) {
          chats.splice(chatIndex, 1);
        }

        chats.push(chatBumed);

        return { chats };
      },
    });
  }, [query.subscribeToMore]);

  return query;
};

export default chats;

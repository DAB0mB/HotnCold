import { useQuery } from '@apollo/react-hooks';
import { Image } from 'react-native';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const chat = gql `
  query Chat($chatId: ID!) {
    chat(chatId: $chatId) {
      ...Chat
    }
  }

  ${fragments.chat}
`;

chat.use = (chatId, { onCompleted = () => {}, ...options } = {}) => {
  return useQuery(chat, {
    fetchPolicy: 'cache-and-network',
    ...options,
    variables: { chatId },
    onCompleted: (data) => {
      if (data && data.chat) {
        Image.prefetch(data.chat.picture);
      }

      onCompleted(data);
    },
  });
};

export default chat;

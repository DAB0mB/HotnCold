import { useQuery } from '@apollo/react-hooks';
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

chat.use = (chatId, options = {}) => {
  return useQuery(chat, {
    variables: { chatId },
    fetchPolicy: 'no-cache',
    skip: !chatId,
    ...options,
  });
};

export default chat;

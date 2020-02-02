import { useApolloClient, useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../fragments';

const markChatAsRead = gql `
  mutation markChatAsRead($chatId: ID!) {
    markChatAsRead(chatId: $chatId)
  }
`;

markChatAsRead.use = (chatId, options = {}) => {
  const client = useApolloClient();
  const [superMutate, mutation] = useMutation(markChatAsRead, {
    ...options,
    variables: { chatId },
  });

  const mutate = useCallback(() => {
    const chat = fragments.chat.read(client, chatId);
    chat.unreadMessagesCount = 0;
    fragments.chat.write(client, chat);

    return superMutate();
  }, [
    superMutate,
    chatId,
  ]);

  return [mutate, mutation];
};

export default markChatAsRead;

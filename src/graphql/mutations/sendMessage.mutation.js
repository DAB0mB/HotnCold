import { useMutation, useApolloClient } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../fragments';

const sendMessage = gql `
  mutation SendMessage($chatId: ID!, $text: String!) {
    sendMessage(chatId: $chatId, text: $text) {
      ...MessageForSocial
    }
  }

  ${fragments.message.forSocial}
`;

sendMessage.use = ({ chatId }, options = {}) => {
  const [superMutate, mutation] = useMutation(sendMessage, options);

  const mutate = useCallback((message, options = {}) => {
    return superMutate({
      optimisticResponse: {
        __typename: 'Mutation',
        sendMessage: {
          __typename: 'Message',
          ...message,
        },
      },
      update: (cache, mutation) => {
        if (mutation.error) return;

        const chat = cache.readFragment({
          id: chatId,
          fragment: fragments.chat
        });

        if (!chat) return;

        cache.writeFragment({
          id: chatId,
          fragment: fragments.chat,
          data: { ...chat, recentMessage: mutation.data },
        });
      },
      variables: { chatId, text: message.text },
      ...options,
    })
  }, [
    superMutate,
    chatId,
  ]);

  return [mutate, mutation];
};

export default register;

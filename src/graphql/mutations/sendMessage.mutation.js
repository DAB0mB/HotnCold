import { useMutation, useApolloClient } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';
import UUID from 'uuid/v4';

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
  const id = UUID();

  const mutate = useCallback((message, options = {}) => {
    return superMutate({
      optimisticResponse: {
        __typename: 'Mutation',
        sendMessage: {
          __typename: 'Message',
          id,
          text: message.text,
          createdAt: message.createdAt,
          user: {
            __typename: 'User',
            id: message.user._id,
            avatar: message.user.avatar,
            firstName: message.user.name,
          },
        },
      },
      update: (cache, mutation) => {
        if (mutation.error) return;

        const chat = cache.readFragment({
          id: chatId,
          fragment: fragments.chat,
          fragmentName: 'Chat',
        });

        if (!chat) return;

        cache.writeFragment({
          id: chatId,
          fragment: fragments.chat,
          fragmentName: 'Chat',
          data: { ...chat, recentMessage: mutation.data.sendMessage },
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

export default sendMessage;

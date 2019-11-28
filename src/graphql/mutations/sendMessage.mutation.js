import { useMutation, useApolloClient } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';
import UUID from 'uuid/v4';

import * as fragments from '../fragments';

const sendMessage = gql `
  mutation SendMessage($chatId: ID!, $text: String!) {
    sendMessage(chatId: $chatId, text: $text) {
      ...Message
    }
  }

  ${fragments.message}
`;

sendMessage.use = ({ chatId }, options = {}) => {
  const [superMutate, mutation] = useMutation(sendMessage, options);
  const messageId = UUID();

  const mutate = useCallback((message, options = {}) => {
    return superMutate({
      optimisticResponse: {
        __typename: 'Mutation',
        sendMessage: {
          __typename: 'Message',
          id: messageId,
          text: message.text,
          createdAt: message.createdAt,
          user: {
            __typename: 'User',
            id: message.user.id,
            avatar: message.user.avatar,
            name: message.user.name,
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

        const message = mutation.data.sendMessage;

        cache.writeFragment({
          id: chatId,
          fragment: fragments.chat,
          fragmentName: 'Chat',
          data: {
            ...chat,
            recentMessage: {
              __typename: 'Message',
              id: messageId,
              text: message.text,
              createdAt: message.createdAt,
              user: {
                __typename: 'User',
                id: message.user.id,
                avatar: message.user.avatar,
                name: message.user.name,
              }
            },
          },
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

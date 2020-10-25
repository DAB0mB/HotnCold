import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';
import UUID from 'uuid/v4';

import * as fragments from '../fragments';

const sendMessage = gql `
  mutation SendMessage($chatId: ID!, $text: String, $image: String) {
    sendMessage(chatId: $chatId, text: $text, image: $image) {
      ...Message
    }
  }

  ${fragments.message}
`;

sendMessage.use = (chatId, options = {}) => {
  const [superMutate, mutation] = useMutation(sendMessage, options);

  const mutate = useCallback((message, options = {}) => {
    const messageId = message.id || UUID();
    const createdAt = message.createdAt || new Date();

    return superMutate({
      optimisticResponse: {
        __typename: 'Mutation',
        sendMessage: {
          __typename: 'Message',
          id: messageId,
          text: message.text || null,
          image: message.image || null,
          createdAt: createdAt,
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

        let chat = fragments.chat.read(cache, chatId);

        if (!chat) return;

        const message = mutation.data.sendMessage;

        chat = { ...chat };

        const recentMessage = {
          __typename: 'Message',
          id: messageId,
          text: message.text || null,
          image: message.image || null,
          createdAt: createdAt,
          user: {
            __typename: 'User',
            id: message.user.id,
            avatar: message.user.avatar,
            name: message.user.name,
          }
        };

        chat.recentMessages = [recentMessage, ...chat.recentMessages].slice(0, 12);

        if (!chat.firstMessage) {
          chat.firstMessage = recentMessage;
        }

        fragments.chat.write(cache, chat);
      },
      variables: { chatId, text: message.text, image: message.image },
      ...options,
    });
  }, [
    superMutate,
    chatId,
  ]);

  return [mutate, mutation];
};

export default sendMessage;

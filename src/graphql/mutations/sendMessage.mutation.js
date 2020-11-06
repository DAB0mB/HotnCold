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

    const optimisticResponse = {
      __typename: 'Mutation',
      sendMessage: {
        __typename: 'Message',
        id: messageId,
        text: message.text || null,
        image: message.image || null,
        createdAt: createdAt,
        pending: true,
        sent: false,
        user: {
          __typename: 'User',
          id: message.user.id,
          avatar: message.user.avatar,
          name: message.user.name,
        },
      },
    };

    mutation.client.events.emit('optimisticResponse', ({
      operationName: 'SendMessage',
      variables: { chatId, text: message.text, image: message.image },
      data: optimisticResponse,
    }));

    return superMutate({
      optimisticResponse,
      update: (cache, mutation) => {
        if (mutation.error) return;

        let chat = fragments.chat.read(cache, chatId);

        if (!chat) return;

        const message = mutation.data.sendMessage;

        chat = { ...chat };

        const recentMessage = {
          __typename: 'Message',
          id: message.id,
          text: message.text || null,
          image: message.image || null,
          createdAt: createdAt,
          pending: message.pending,
          sent: message.sent,
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
    }).then(({ data }) => {
      mutation.client.events.emit('responded', {
        operationName: 'SendMessage',
        variables: { chatId, text: message.text, image: message.image },
        data,
        optimisticResponse,
      });
    });
  }, [
    superMutate,
    chatId,
  ]);

  return [mutate, mutation];
};

export default sendMessage;

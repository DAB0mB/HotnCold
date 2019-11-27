import { useMutation, useApolloClient } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../fragments';

const sendMessage = gql `
  mutation SendMessage($chatId: ID, $recipientId: ID, $text: String!) {
    sendMessage(chatId: $chatId, recipientId: $recipientId, text: $text) {
      ...MessageForSocial
    }
  }

  ${fragments.message.forSocial}
`;

sendMessage.use = ({ recipientId, chatId }, options = {}) => {
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

        cache.writeFragment({
          id: message.id,
          fragment: fragments.message.forSocial,
          data: mutation.data.sendMessage,
        });
      },
      variables: { recipientId, chatId, text: message.text },
      ...options,
    })
  }, [
    superMutate,
    recipientId,
    chatId,
  ]);

  return [mutate, mutation];
};

export default register;

import { useMutation, useApolloClient } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../fragments';

const sendMessage = gql `
  mutation SendMessage($recipientId: String!, $text: String!) {
    sendMessage(recipientId: $recipientId, text: $text) {
      ...MessageForChat
    }
  }

  ${fragments.message.forChat}
`;

sendMessage.use = (recipientId, options = {}) => {
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
          fragment: fragments.message.forChat,
          data: mutation.data.sendMessage,
        });
      },
      variables: { recipientId, text: message.text },
      ...options,
    })
  }, [
    superMutate,
    recipientId,
  ]);

  return [mutate, mutation];
};

export default register;

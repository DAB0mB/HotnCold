import { useMutation } from '@apollo/react-hooks';
import { useCallback } from 'react';
import gql from 'graphql-tag';

const toggleChatSubscription = gql `
  mutation ToggleChatSubscription($chatId: ID!) {
    toggleChatSubscription(chatId: $chatId)
  }
`;

toggleChatSubscription.use = (chatId, options) => {
  const [superMutate, mutation] = useMutation(toggleChatSubscription, options);

  const mutate = useCallback((chat) => {
    mutation.client.events.emit('response', {
      operationName: 'ToggleChatSubscription',
      data: { toggleChatSubscription: !chat.subscribed },
      variables: { chatId: chat.id },
    });

    return superMutate({
      variables: { chatId: chat.id },
    });
  }, [chatId, superMutate]);

  return [mutate, mutation];
};

export default toggleChatSubscription;

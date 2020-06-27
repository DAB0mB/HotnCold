import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../fragments';

const findOrCreateChat = gql `
  mutation FindOrCreateChat($recipientId: ID!) {
    findOrCreateChat_2(recipientId: $recipientId) {
      ...Chat
    }
  }

  ${fragments.chat}
`;

findOrCreateChat.use = (_recipientId, options) => {
  const [superMutate, mutation] = useMutation(findOrCreateChat, options);

  const mutate = useCallback((recipientId = _recipientId, options = {}) => {
    // Token should be stored via response.headers, see graphql/client.js
    return superMutate({
      update: (cache, mutation) => {
        if (mutation.error) return;

        mutation.data.findOrCreateChat = mutation.data.findOrCreateChat_2;
        delete mutation.data.findOrCreateChat_2;

        fragments.chat.write(cache, mutation.data.findOrCreateChat);
      },
      variables: { recipientId },
      ...options,
    });
  }, [
    superMutate,
    _recipientId,
  ]);

  return [mutate, mutation];
};

export default findOrCreateChat;

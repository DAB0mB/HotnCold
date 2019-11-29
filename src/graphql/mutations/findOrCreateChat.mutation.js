import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../fragments';

const findOrCreateChat = gql `
  mutation FindOrCreateChat($usersIds: [ID!]!) {
    findOrCreateChat(usersIds: $usersIds) {
      ...Chat
    }
  }

  ${fragments.chat}
`;

findOrCreateChat.use = (_usersIds = [], defaultOptions = {}) => {
  const [superMutate, mutation] = useMutation(findOrCreateChat, defaultOptions);

  const mutate = useCallback((usersIds = _usersIds, options = {}) => {
    // Token should be stored via response.headers, see graphql/client.js
    return superMutate({
      update: (cache, mutation) => {
        if (mutation.error) return;

        fragments.chat.write(cache, mutation.data.findOrCreateChat);
      },
      variables: { usersIds },
      ...options,
    })
  }, [
    superMutate,
    _usersIds,
  ]);

  return [mutate, mutation];
};

export default findOrCreateChat;

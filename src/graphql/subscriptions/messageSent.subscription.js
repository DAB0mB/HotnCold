import { useSubscription } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const messageSent = gql `
  subscription MessageSent($chatId: ID!) {
    messageSent(chatId: $chatId) {
      ...Message
    }
  }

  ${fragments.message}
`;

messageSent.use = (chatId, options = {}) => {
  return useSubscription(messageSent, {
    variables: { chatId },
    fetchPolicy: 'no-cache',
    skip: !chatId,
    ...options,
  });
};

export default messageSent;

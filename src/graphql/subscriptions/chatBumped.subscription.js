import { useSubscription } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const chatBumped = gql `
  subscription ChatBumped {
    chatBumped {
      ...Chat
    }
  }

  ${fragments.chat}
`;

chatBumped.use = (options = {}) => {
  return useSubscription(chatBumped, {
    fetchPolicy: 'no-cache',
    ...options,
  });
};

export default chatBumped;

import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const statusChat = gql `
  query StatusChat($statusId: ID!) {
    statusChat(statusId: $statusId) {
      ...Chat
    }
  }

  ${fragments.chat}
`;

statusChat.use = (statusId, options = {}) => {
  return useQuery(statusChat, {
    variables: { statusId },
    fetchPolicy: 'no-cache',
    ...options,
  });
};

export default statusChat;

import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const status = gql `
  query Status($statusId: ID, $chatId: ID) {
    status(statusId: $statusId, chatId: $chatId) {
      ...StatusWithChat
    }
  }

  ${fragments.status.withChat}
`;

status.use = (id, { type = 'status', ...options } = {}) => {
  const variables = type == 'chat' ? {
    chatId: id,
  } : {
    statusId: id,
  };

  return useQuery(status, {
    variables,
    fetchPolicy: 'no-cache',
    skip: !id,
    ...options,
  });
};

export default status;

import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const status = gql `
  query Status($statusId: ID!) {
    status(statusId: $statusId) {
      ...StatusWithChat
    }
  }

  ${fragments.status.withChat}
`;

status.use = (statusId, options = {}) => {
  return useQuery(status, {
    variables: { statusId },
    fetchPolicy: 'no-cache',
    skip: !statusId,
    ...options,
  });
};

export default status;

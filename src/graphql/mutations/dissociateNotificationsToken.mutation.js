import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';

const dissociateNotificationsToken = gql `
  mutation DissociateNotificationsToken {
    dissociateNotificationsToken
  }
`;

dissociateNotificationsToken.use = (options) => {
  return useMutation(dissociateNotificationsToken, options);
};

export default dissociateNotificationsToken;

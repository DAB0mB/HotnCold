import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const createComment = gql `
  mutation CreateComment($eventId: ID!, $text: String!) {
    createComment(eventId: $eventId, text: $text) {
      ...Comment
    }
  }

  ${fragments.comment}
`;

createComment.use = (eventId, text, options = {}) => {
  return useMutation(createComment, {
    variables: { eventId, text },
    ...options,
  });
};

export default createComment;

import { useCallback } from 'react';
import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';

const deleteComment = gql `
  mutation DeleteComment($commentId: ID!) {
    deleteComment(commentId: $commentId)
  }
`;

deleteComment.use = (options) => {
  const [superMutate, mutation] = useMutation(deleteComment, options);

  const mutate = useCallback((commentId, options = {}) => {
    return superMutate({
      ...options,
      variables: { commentId },
    });
  }, [superMutate]);

  return [mutate, mutation];
};

export default deleteComment;

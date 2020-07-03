import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback, useMemo } from 'react';

import * as fragments from '../fragments';

const createStatus = gql `
  mutation CreateStatus($text: String!, $location: Vector2D!) {
    createStatus(text: $text, location: $location) {
      ...StatusItem
    }
  }

  ${fragments.status.item}
`;

createStatus.use = (text, options = {}) => {
  text = useMemo(() => text.replace(/\n+/g, ' '), [text]);

  const [superMutate, mutation] = useMutation(createStatus, options);

  const mutate = useCallback((location) => {
    superMutate({
      variables: {
        text,
        location,
      },
    });
  }, [superMutate, text]);

  return [mutate, mutation];
};

export default createStatus;

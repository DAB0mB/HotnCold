import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback, useMemo } from 'react';

import * as fragments from '../fragments';

const createStatus = gql `
  mutation CreateStatus($text: String!, $images: [String]!, $location: Vector2D!, $published: Boolean) {
    createStatus(text: $text, images: $images, location: $location, published: $published) {
      ...StatusItem
    }
  }

  ${fragments.status.item}
`;

createStatus.use = (text, options = {}) => {
  text = useMemo(() => text.replace(/\n+/g, ' '), [text]);

  const [superMutate, mutation] = useMutation(createStatus, options);

  const mutate = useCallback((images, location, published) => {
    superMutate({
      variables: {
        text,
        images,
        location,
        published,
      },
    });
  }, [superMutate, text]);

  return [mutate, mutation];
};

export default createStatus;

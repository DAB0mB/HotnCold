import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../fragments';

const createStatus = gql `
  mutation CreateStatus($text: String!, $images: [String]!, $location: Vector2D!, $published: Boolean, $isMeetup: Boolean) {
    createStatus(text: $text, images: $images, location: $location, published: $published, isMeetup: $isMeetup) {
      ...StatusItem
    }
  }

  ${fragments.status.item}
`;

createStatus.use = (options = {}) => {
  const [superMutate, mutation] = useMutation(createStatus, options);

  const mutate = useCallback((text, images, location, published, isMeetup) => {
    superMutate({
      variables: {
        text,
        images,
        location,
        published,
        isMeetup,
      },
    });
  }, [superMutate]);

  return [mutate, mutation];
};

export default createStatus;

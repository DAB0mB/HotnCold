import { useQuery } from '@apollo/react-hooks';
import { useCallback } from 'react';
import { Image } from 'react-native';
import gql from 'graphql-tag';

const statusImages = gql `
  query StatusImages($statusId: ID!) {
    status(statusId: $statusId) {
      id
      images
    }
  }
`;

statusImages.use = (statusId, options = {}) => {
  return useQuery(statusImages, {
    skip: !statusId,
    variables: { statusId },
    fetchPolicy: 'no-cache',
    onCompleted: useCallback((data) => {
      data?.status?.images.forEach((image) => {
        Image.prefetch(image);
      });

      options.onCompleted?.(data);
    }, [options.onCompleted]),
  });
};

export default statusImages;

import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

const uploadPicture = gql `
  mutation UploadPicture($data: Upload!) {
    uploadPicture(data: $data)
  }
`;

uploadPicture.use = (defaultOptions = {}) => {
  const [superMutate, mutation] = useMutation(uploadPicture, defaultOptions);

  const mutate = useCallback((data) => {
    return superMutate({
      variables: { data },
    })
  }, [superMutate]);

  return [mutate, mutation];
};

export default uploadPicture;

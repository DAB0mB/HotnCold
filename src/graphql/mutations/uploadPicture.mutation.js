import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';

const uploadPicture = gql `
  mutation UploadPicture($blob: Upload!) {
    UploadPicture(blob: $blob)
  }
`;

uploadPicture.use = (defaultBlob, defaultOptions = {}) => {
  const [superMutate, mutation] = useMutation(uploadPicture, defaultOptions);

  const mutate = useCallback((blob = defaultBlob) => {
    return superMutate({
      variables: { blob },
    })
  }, [superMutate, defaultBlob]);

  return [mutate, mutation];
};

export default uploadPicture;

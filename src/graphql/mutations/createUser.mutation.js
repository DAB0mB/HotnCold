import { useMutation, useApolloClient } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

const createUser = gql `
  mutation CreateUser(
    $notificationsToken: String!
    $name: String!
    $occupation: String!
    $birthDate: DateTime!
    $bio: String!
    $pictures: [String!]!
  ) {
    createUser(
      notificationsToken: $notificationsToken
      name: $name
      occupation: $occupation
      birthDate: $birthDate
      bio: $bio
      pictures: $pictures
    )
  }
`;

createUser.use = (defaultArgs = {}, defaultOptions = {}) => {
  const client = useApolloClient();
  const [superMutate, mutation] = useMutation(createUser, defaultOptions);

  const mutate = useCallback(({
    notificationsToken = defaultArgs.notificationsToken,
    name = defaultArgs.name,
    birthDate = defaultArgs.birthDate,
    occupation = defaultArgs.occupation,
    bio = defaultArgs.bio,
    pictures = defaultArgs.pictures,
  }) => {
    // Token should be stored via response.headers, see graphql/client.js
    return superMutate({
      update: (cache, mutation) => {
        if (mutation.error) return;

        client.clearStore();
      },
      variables: { notificationsToken, name, birthDate, occupation, bio, pictures },
    });
  }, [
    superMutate,
    defaultArgs.notificationsToken,
    defaultArgs.name,
    defaultArgs.birthDate,
    defaultArgs.occupation,
    defaultArgs.bio,
    defaultArgs.pictures,
  ]);

  return [mutate, mutation];
};

export default createUser;

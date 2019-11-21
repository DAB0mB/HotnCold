import { useMutation, useApolloClient } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

const register = gql `
  mutation Register(
    $firstName: String!
    $lastName: String!
    $occupation: String!
    $birthDate: DateTime!
    $bio: String!
    $pictures: [String!]!
  ) {
    register(
      firstName: $firstName
      lastName: $lastName
      occupation: $occupation
      birthDate: $birthDate
      bio: $bio
      pictures: $pictures
    )
  }
`;

register.use = (defaultArgs = {}, defaultOptions = {}) => {
  const client = useApolloClient();
  const [superMutate, mutation] = useMutation(register, defaultOptions);

  const mutate = useCallback(({
    firstName = defaultArgs.firstName,
    lastName = defaultArgs.lastName,
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
      variables: { firstName, lastName, birthDate, occupation, bio, pictures },
    })
  }, [
    superMutate,
    defaultArgs.firstName,
    defaultArgs.lastName,
    defaultArgs.birthDate,
    defaultArgs.occupation,
    defaultArgs.bio,
    defaultArgs.pictures,
  ]);

  return [mutate, mutation];
};

export default register;

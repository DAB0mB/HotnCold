import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import { useMe } from '../../services/Auth';
import * as fragments from '../fragments';

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
  const [superMutate, mutation] = useMutation(register, defaultOptions);

  const mutate = useCallback(({
    firstName = defaultArgs.firstName,
    lastName = defaultArgs.lastName,
    birthDate = defaultArgs.birthDate,
    occupation = defaultArgs.occupation,
    bio = defaultArgs.bio,
    pictures = defaultArgs.pictures,
  }) => {
    // Token should be stored via response.headers, see graphql/client.ts
    return superMutate({
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
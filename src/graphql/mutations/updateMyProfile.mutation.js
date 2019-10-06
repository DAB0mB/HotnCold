import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import { useMe } from '../../services/Auth';
import * as fragments from '../fragments';

const updateMyProfile = gql `
  mutation UpdateMyProfile(
    $firstName: String!
    $lastName: String!
    $occupation: String!
    $birthDate: DateTime!
    $bio: String!
    $pictures: [String!]!
  ) {
    updateMyProfile(
      firstName: $firstName
      lastName: $lastName
      occupation: $occupation
      birthDate: $birthDate
      bio: $bio
      pictures: $pictures
    ) {
      ...User
    }
  }

  ${fragments.user}
`;

updateMyProfile.use = (defaultArgs = {}, defaultOptions = {}) => {
  const me = useMe();
  const [superMutate, mutation] = useMutation(updateMyProfile, defaultOptions);

  const mutate = useCallback(({
    firstName = defaultArgs.firstName,
    lastName = defaultArgs.lastName,
    birthDate = defaultArgs.birthDate,
    occupation = defaultArgs.occupation,
    bio = defaultArgs.bio,
    pictures = defaultArgs.pictures,
  }) => {
    return superMutate({
      update: (client, mutation) => {
        if (mutation.error) return;
        if (!me) return;

        client.writeFragment({
          id: me.id,
          fragment: fragments.user,
          data: { ...me, firstName, lastName, birthDate, occupation, bio, pictures },
        });
      },
      variables: { firstName, lastName, birthDate, occupation, bio, pictures },
    })
  }, [
    me,
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

export default updateMyProfile;

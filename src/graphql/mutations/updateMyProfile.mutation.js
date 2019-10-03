import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import { useMe } from '../../services/Auth';
import * as fragments from '../fragments';

const updateMyProfile = gql `
  mutation UpdateMyProfile(
    $name: String!
    $occupation: String!
    $birthDate: DateTime!
    $bio: String!
  ) {
    updateMyProfile(
      name: $name
      occupation: $occupation
      birthDate: $birthDate
      bio: $bio
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
    name = defaultArgs.name,
    birthDate = defaultArgs.birthDate,
    occupation = defaultArgs.occupation,
    bio = defaultArgs.bio,
  }) => {
    return superMutate({
      update: (client, mutation) => {
        if (mutation.error) return;
        if (!me) return;

        client.writeFragment({
          id: me.id,
          fragment: fragments.user,
          data: { ...me, name, birthDate, occupation, bio },
        });
      },
      variables: { name, birthDate, occupation, bio },
    })
  }, [me, superMutate, defaultArgs]);

  return [mutate, mutation];
};

export default updateMyProfile;

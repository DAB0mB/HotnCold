import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../fragments';
import * as queries from '../queries';

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
      ...UserProfile
    }
  }

  ${fragments.user.profile}
`;

updateMyProfile.use = (defaultArgs = {}, defaultOptions = {}) => {
  const { data: { me } = {} } = queries.me.use();
  const [superMutate, mutation] = useMutation(updateMyProfile, defaultOptions);

  const mutate = useCallback(({
    name = defaultArgs.name,
    birthDate = defaultArgs.birthDate,
    occupation = defaultArgs.occupation,
    bio = defaultArgs.bio,
    pictures = defaultArgs.pictures,
  }) => {
    const names = name.split(/ +/);
    const firstName = names.shift();
    const lastName = names.join(' ');

    return superMutate({
      update: (cache, mutation) => {
        if (mutation.error) return;
        if (!me) return;

        fragments.user.profile.write(cache, {
          ...me, name, firstName, lastName, birthDate, occupation, bio, pictures
        });
      },
      variables: { firstName, lastName, birthDate, occupation, bio, pictures },
    })
  }, [
    me,
    superMutate,
    defaultArgs.name,
    defaultArgs.birthDate,
    defaultArgs.occupation,
    defaultArgs.bio,
    defaultArgs.pictures,
  ]);

  return [mutate, mutation];
};

export default updateMyProfile;

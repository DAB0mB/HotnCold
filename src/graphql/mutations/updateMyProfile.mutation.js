import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../fragments';

const updateMyProfile = gql `
  mutation UpdateMyProfile(
    $name: String!
    $occupation: String!
    $birthDate: DateTime!
    $bio: String!
    $pictures: [String!]!
  ) {
    updateMyProfile(
      name: $name
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
  const queries = require('../queries');

  const { data: { me } = {} } = queries.mine.use();
  const [superMutate, mutation] = useMutation(updateMyProfile, defaultOptions);

  const mutate = useCallback(({
    name = defaultArgs.name,
    birthDate = defaultArgs.birthDate,
    occupation = defaultArgs.occupation,
    bio = defaultArgs.bio,
    pictures = defaultArgs.pictures,
  }) => {
    return superMutate({
      update: (cache, mutation) => {
        if (mutation.error) return;
        if (!me) return;

        fragments.user.profile.write(cache, {
          ...me, name, birthDate, occupation, bio, pictures
        });
      },
      variables: { name, birthDate, occupation, bio, pictures },
    });
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

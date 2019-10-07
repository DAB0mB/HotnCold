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

register.use = (defaultOptions = {}) => {
  const [superMutate, mutation] = useMutation(register, defaultOptions);

  const mutate = useCallback((location = defaultLocation) => {
    return superMutate({
      update: (client, mutation) => {
        if (mutation.error) return;
        if (!me) return;

        client.writeFragment({
          id: me.id,
          fragment: fragments.user,
          data: { ...me, location },
        });
      },
      variables: { location },
    })
  }, [superMutate]);

  return [mutate, mutation];
};

export default register;

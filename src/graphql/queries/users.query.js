import { useQuery, useLazyQuery, useApolloClient } from '@apollo/react-hooks';
import { useMemo, useCallback } from 'react';
import { Image } from 'react-native';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const users = gql `
  query Users($usersIds: [ID!]!) {
    users(usersIds: $usersIds) {
      ...User
    }
  }

  ${fragments.user}
`;

users.profiles = gql `
  query UserProfiles($usersIds: [ID!]!) {
    users(usersIds: $usersIds) {
      ...UserProfile
    }
  }

  ${fragments.user.profile}
`;

users.use = ({ onCompleted = () => {}, ...options } = {}) => {
  const client = useApolloClient();

  const [_runQuery, query] = useLazyQuery(users, {
    fetchPolicy: 'no-cache',
    onCompleted: (data) => {
      if (data.users) {
        data.users.forEach((u) => {
          Image.prefetch(u.avatar);

          Object.assign(u, {
            birthDate: null,
            age: null,
            bio: null,
            location: null,
            occupation: null,
            pictures: null,
          });
        });

        // Write partial data
        client.writeQuery({
          query: users.profiles,
          data,
        });
      }

      onCompleted(data);
    },
    ...options,
  });

  const runQuery = useCallback((usersIds) => {
    return _runQuery({
      variables: { usersIds }
    });
  }, [_runQuery]);

  return useMemo(() => [runQuery, query], [runQuery, query]);
};

users.profiles.use = ({ onCompleted = () => {}, ...options } = {}) => {
  const client = useApolloClient();
  const initialData = client.readQuery({ query: users.profiles });

  const { data = initialData, ...query } = useQuery(users.profiles, {
    fetchPolicy: 'no-cache',
    variables: { usersIds: initialData.users.map(u => u.id) },
    onCompleted: (data) => {
      if (data.users) {
        data.users.forEach((u) => {
          u.pictures.forEach((p) => {
            Image.prefetch(p);
          });
        });

        client.writeQuery({
          query: users.profiles,
          data,
        });
      }

      onCompleted(data);
    },
    ...options,
  });

  return useMemo(() => ({ data, ...query }), [data, ...Object.values(query)]);
};

export default users;

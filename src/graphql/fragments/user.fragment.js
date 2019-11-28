import { useApolloClient } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import area from './area.fragment';

const user = gql `
  fragment User on User {
    id
    name
    birthDate
    age
    bio
    location
    occupation
    pictures
    avatar
  }
`;

user.read = (id) => {
  const client = useApolloClient();

  return client.readFragment({
    id,
    fragment: user,
    fragmentName: 'User',
  });
};

user.write = (data) => {
  const client = useApolloClient();

  return client.writeFragment({
    id: data.id,
    fragment: user,
    fragmentName: 'User',
    data,
  });
};

export default user;

import { useApolloClient } from '@apollo/react-hooks';
import gql from 'graphql-tag';

const area = gql `
  fragment Area on Area {
    id
    name
  }
`;

area.read = (id) => {
  const client = useApolloClient();

  return client.readFragment({
    id,
    fragment: area,
    fragmentName: 'Area',
  });
};

area.write = (data) => {
  const client = useApolloClient();

  return client.writeFragment({
    id: data.id,
    fragment: area,
    fragmentName: 'Area',
    data,
  });
};

export default area;

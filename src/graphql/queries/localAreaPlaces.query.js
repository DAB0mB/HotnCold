import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

const localAreaPlaces = gql `
  query LocalAreaPlaces($location: Vector2D!, $searchText: String!) {
    localAreaPlaces(location: $location, searchText: $searchText)
  }
`;

localAreaPlaces.use = (location, searchText, options = {}) => {
  return useQuery(localAreaPlaces, {
    variables: { location, searchText },
    fetchPolicy: 'no-cache',
    skip: !searchText || !location,
    ...options,
  });
};

export default localAreaPlaces;

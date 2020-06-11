import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const areas = gql `
  query Areas($searchText: String!) {
    areas(searchText: $searchText) {
      ...Area
    }
  }

  ${fragments.area}
`;

areas.use = (searchText, options = {}) => {
  return useQuery(areas, {
    variables: { searchText },
    fetchPolicy: 'no-cache',
    skip: !searchText,
    ...options,
  });
};

export default areas;

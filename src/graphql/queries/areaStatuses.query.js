import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import * as fragments from '../fragments';

const areaStatuses = gql `
  query AreaStatuses($location: Vector2D!) {
    areaStatuses(location: $location) {
      ...Status
    }
  }

  ${fragments.status}
`;

areaStatuses.use = (location, options = {}) => {
  return useQuery(areaStatuses, {
    variables: { location },
    fetchPolicy: 'no-cache',
    skip: !location,
    ...options,
  });
};

export default areaStatuses;

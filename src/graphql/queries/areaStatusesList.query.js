import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback, useEffect } from 'react';

import * as fragments from '../../graphql/fragments';
import { compactOptions } from '../../utils';

const $areaStatusesList = gql `
  query Statuses($location: Vector2D!, $anchor: ID) {
    areaStatusesList(location: $location, limit: 12, anchor: $anchor) {
      ...StatusItem
    }

    areaStatusesListRoot(location: $location) {
      ...StatusItem
    }
  }

  ${fragments.status.item}
`;

$areaStatusesList.use = (...args) => {
  const [location, options = {}] = compactOptions(2, args);

  const query = useQuery($areaStatusesList, {
    ...options,
    variables: { location },
    skip: location == null,
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => () => {
    delete query.client.cache.data.data['ROOT_QUERY'][`areaStatusesList({"location":${location},"limit":12})`];
    delete query.client.cache.data.data['ROOT_QUERY'][`areaStatusesListRoot({"location":${location}})`];
  }, [true]);

  useEffect(() => {
    const onStatusCreate = ({ operationName, data }) => {
      if (operationName != 'CreateStatus') return;

      const status = {
        ...data.createStatus,
        chat: {
          id: data.createStatus.chat.id,
          subscribed: true,
        },
      };

      query.client.writeQuery({
        query: $areaStatusesList,
        variables: { location },
        data: {
          ...query.data,
          areaStatusesList: [status, ...query.data.areaStatusesList],
        },
      });
    };

    query.client.events.on('response', onStatusCreate);

    return () => {
      query.client.events.off('response', onStatusCreate);
    };
  }, [query.data]);

  return {
    ...query,
    fetchMore: useCallback((...args) => {
      if (!location) return;
      if (!query.data) return;
      if (query.loading) return;
      if (query.data.areaStatusesListRoot?.id === query.data.areaStatusesList[query.data.areaStatusesList.length - 1]?.id) return;

      const [lazyLocation = location, options = {}] = compactOptions(2, args);

      return query.fetchMore({
        ...options,
        variables: {
          location: lazyLocation,
          anchor: query.data.areaStatusesList[query.data.areaStatusesList.length - 1]?.id,
        },
        updateQuery(prev, { fetchMoreResult }) {
          if (!fetchMoreResult) return prev;

          return {
            ...fetchMoreResult,
            areaStatusesList: [...prev.areaStatusesList, ...fetchMoreResult.areaStatusesList]
          };
        },
      });
    }, [query.fetchMore, query.loading, query.data, location]),
  };
};

export default $areaStatusesList;

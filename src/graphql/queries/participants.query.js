import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback, useEffect } from 'react';

import * as fragments from '../../graphql/fragments';
import { compactOptions, useConst } from '../../utils';

const participants = gql `
  query Participants($chatId: ID!, $limit: Int!, $anchor: ID) {
    participants(chatId: $chatId, limit: $limit, anchor: $anchor) {
      ...User
    }
    firstParticipant(chatId: $chatId) {
      ...User
    }
  }
  ${fragments.user}
`;

participants.use = (...args) => {
  const [chatId, limit = 12, options = {}] = compactOptions(3, args);

  const query = useQuery(participants, {
    variables: { chatId, limit },
    fetchPolicy: 'cache-and-network',
    ...options,
  });

  const disposeVars = useConst({});
  disposeVars.data = query.data;
  disposeVars.limit = limit;
  disposeVars.chatId = chatId;

  useEffect(() => {
    return () => {
      const { data, limit, chatId } = disposeVars;

      if (!data) return;

      const participantsData = data.participants.slice(0, limit);
      const firstParticipant = (participantsData.length == 1 ? participantsData[0] : data.firstParticipant) || null;

      // Reset fetchMore()
      query.client.writeQuery({
        query: participants,
        variables: { limit, chatId },
        data: {
          participants: participantsData,
          firstParticipant: firstParticipant,
        },
      });
    };
  }, [true]);

  return {
    ...query,
    clear: useCallback(() => {
      delete query.client.cache.data.data['ROOT_QUERY'][`participants({"chatId":"${chatId}","limit":${limit}})`];
      delete query.client.cache.data.data['ROOT_QUERY'][`firstParticipant({"chatId":"${chatId}"})`];
    }, [true]),
    fetchMore: useCallback((...args) => {
      if (!query.data) return;
      if (query.data.firstParticipant?.id === query.data.participants.slice(-1)[0]?.id) return;

      const [lazyLimit = limit, options = {}] = compactOptions(2, args);

      return query.fetchMore({
        ...options,
        variables: {
          chatId,
          limit: lazyLimit,
          anchor: query.data.participants[query.data.participants.length - 1]?.id,
        },
        updateQuery(prev, { fetchMoreResult }) {
          if (!fetchMoreResult) return prev;

          return {
            ...fetchMoreResult,
            participants: [...prev.participants, ...fetchMoreResult.participants]
          };
        },
      });
    }, [query.fetchMore, query.data, chatId, limit]),
  };
};

export default participants;

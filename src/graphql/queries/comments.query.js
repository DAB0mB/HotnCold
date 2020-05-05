import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback, useEffect } from 'react';

import * as fragments from '../../graphql/fragments';
import { compactOptions, useConst, omit } from '../../utils';
import mine from './mine.query';

const comments = gql `
  query Comments($eventId: ID!, $limit: Int!, $anchor: ID) {
    comments(eventId: $eventId, limit: $limit, anchor: $anchor) {
      ...Comment
    }

    veryFirstComment(eventId: $eventId) {
      ...Comment
    }

    commentsCount(eventId: $eventId)
  }

  ${fragments.comment}
`;

comments.use = (...args) => {
  const [eventId, limit = 12, options = {}] = compactOptions(3, args);
  const { data: { me } = {} } = mine.use();
  const myId = me?.id;

  const query = useQuery(comments, {
    variables: { eventId, limit },
    fetchPolicy: 'cache-and-network',
    skip: !myId,
    ...omit(options, ['subscribeToChanges']),
  });

  const disposeVars = useConst({});
  disposeVars.data = query.data;
  disposeVars.eventId = eventId;
  disposeVars.limit = limit;

  useEffect(() => {
    return () => {
      const { data, eventId, limit } = disposeVars;

      if (!data) return;

      const commentsData = data.comments.slice(0, limit);
      const veryFirstComment = (commentsData.length == 1 ? commentsData[0] : data.veryFirstComment) || null;

      // Reset fetchMore()
      query.client.writeQuery({
        query: comments,
        variables: { eventId, limit },
        data: {
          comments: commentsData,
          veryFirstComment: veryFirstComment || null,
          commentsCount: data.commentsCount,
        },
      });
    };
  }, [true]);

  if (options.subscribeToChanges) {
    useEffect(() => {
      if (!myId) return;
      if (!query.data) return;

      const commentsAst = comments;

      const onResponse = ({ operationName, data }) => {
        if (operationName !== 'CreateComment') return;

        let commentCreated = data.createComment;

        if (!commentCreated) return;

        commentCreated = { ...commentCreated };
        const createdAt = new Date(commentCreated.createdAt);
        let comments = query.data.comments.slice();
        let veryFirstComment = query.data.veryFirstComment;
        let insertIndex = comments.findIndex(c => new Date(c.createdAt) > createdAt);

        if (insertIndex == -1) {
          insertIndex = comments.length;
        }

        comments.splice(insertIndex, 0, commentCreated);
        comments = comments.slice(0, limit);
        veryFirstComment = (comments.length == 1 ? comments[0] : veryFirstComment) || null;

        query.client.writeQuery({
          query: commentsAst,
          variables: { eventId, limit },
          data: {
            comments,
            veryFirstComment,
            commentsCount: query.data.commentsCount + 1,
          },
        });
      };

      query.client.events.on('response', onResponse);

      return () => {
        query.client.events.off('response', onResponse);
      };
    }, [myId, eventId, limit, query.data]);


    useEffect(() => {
      if (!myId) return;
      if (!query.data) return;

      const commentsAst = comments;

      const onResponse = ({ operationName, data, variables }) => {
        if (operationName !== 'DeleteComment') return;

        const commentDeleted = data.deleteComment;

        if (!commentDeleted) return;

        let comments = query.data.comments.slice();
        let veryFirstComment = query.data.veryFirstComment;
        const { commentId: commentDeletedId } = variables;
        const deletedIndex = comments.findIndex(c => c.id === commentDeletedId);

        if (!~deletedIndex) return;

        comments.splice(deletedIndex, 1);
        veryFirstComment = (commentDeletedId === veryFirstComment?.id ? comments.slice(-1)[0] : veryFirstComment) || null;

        query.client.writeQuery({
          query: commentsAst,
          variables: { eventId, limit },
          data: {
            comments,
            veryFirstComment,
            commentsCount: query.data.commentsCount - 1,
          },
        });
      };

      query.client.events.on('response', onResponse);

      return () => {
        query.client.events.off('response', onResponse);
      };
    }, [myId, eventId, limit, query.data]);
  }

  return {
    ...query,
    clear: useCallback(() => {
      delete query.client.cache.data.data['ROOT_QUERY'][`comments({"eventId":"${eventId}","limit":${limit}})`];
    }, [true]),
    fetchMore: useCallback((...args) => {
      if (!query.data) return;
      if (query.data.veryFirstComment?.id === query.data.comments[query.data.comments.length - 1]?.id) return;

      const [lazyEventId = eventId, lazyLimit = limit, options = {}] = compactOptions(3, args);

      return query.fetchMore({
        ...options,
        variables: {
          eventId: lazyEventId,
          limit: lazyLimit,
          anchor: query.data.comments[query.data.comments.length - 1]?.id,
        },
        updateQuery(prev, { fetchMoreResult }) {
          if (!fetchMoreResult) return prev;

          return {
            ...fetchMoreResult,
            comments: [...prev.comments, ...fetchMoreResult.comments]
          };
        },
      });
    }, [query.fetchMore, query.data, eventId, limit]),
  };
};

export default comments;

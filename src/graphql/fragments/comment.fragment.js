import gql from 'graphql-tag';

import user from './user.fragment';

const comment = gql `
  fragment Comment on Comment {
    id
    createdAt
    text
    user {
      ...User
    }
  }

  ${user}
`;

comment.read = (cache, id) => {
  id = `Comment:${id.split(':').pop()}`;

  return cache.readFragment({
    id,
    fragment: comment,
    fragmentName: 'Comment',
  });
};

comment.write = (cache, data) => {
  const id = `Comment:${data.id}`;

  return cache.writeFragment({
    id,
    fragment: comment,
    fragmentName: 'Comment',
    data,
  });
};

export default comment;

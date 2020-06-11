import gql from 'graphql-tag';

import user from './user.fragment';

const status = gql `
  fragment Status on Status {
    id
    text
    location
    createdAt
    weight
    author {
      ...User
    }
  }

  ${user}
`;

status.read = (cache, id) => {
  id = `Status:${id.split(':').pop()}`;

  return cache.readFragment({
    id,
    fragment: status,
    fragmentName: 'Status',
  });
};

status.write = (cache, data) => {
  const id = `Status:${data.id}`;

  return cache.writeFragment({
    id,
    fragment: status,
    fragmentName: 'Status',
    data,
  });
};

export default status;

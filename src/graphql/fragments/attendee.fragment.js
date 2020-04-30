import gql from 'graphql-tag';

const attendee = gql `
  fragment Attendee on Attendee {
    id
    name
    bio
    avatar
    checkedInAt
  }
`;

attendee.read = (cache, id) => {
  id = `Attendee:${id.split(':').pop()}`;

  return cache.readFragment({
    id,
    fragment: attendee,
    fragmentName: 'Attendee',
  });
};

attendee.write = (cache, data) => {
  const id = `Attendee:${data.id}`;

  return cache.writeFragment({
    id,
    fragment: attendee,
    fragmentName: 'Attendee',
    data,
  });
};

export default attendee;

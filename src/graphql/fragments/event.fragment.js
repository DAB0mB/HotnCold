import gql from 'graphql-tag';

const event = gql `
  fragment Event on Event {
    id
    source
    name
    city
    localDate
    localTime
    duration
    description
    maxPeople
    attendanceCount
    location
    address
    venueName
    featuredPhoto
    link
  }
`;

event.read = (cache, id) => {
  id = `Event:${id.split(':').pop()}`;

  return cache.readFragment({
    id,
    fragment: event,
    fragmentName: 'Event',
  });
};

event.write = (cache, data) => {
  const id = `Event:${data.id}`;

  return cache.writeFragment({
    id,
    fragment: event,
    fragmentName: 'Event',
    data,
  });
};

export default event;

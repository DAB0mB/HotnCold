import gql from 'graphql-tag';

import area from './area.fragment';

const event = gql `
  fragment Event on Event {
    id
    source
    name
    localDate
    localTime
    startsAt
    endsAt
    description
    attendanceCount
    location
    venueName
    duration
    maxPeople
    address
    featuredPhoto
    link
    area {
      ...Area
    }
  }

  ${area}
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

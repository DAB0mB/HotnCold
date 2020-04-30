import gql from 'graphql-tag';

import area from './area.fragment';

const event = gql `
  fragment Event on Event {
    id
    source
    sourceLink
    name
    localDate
    localTime
    startsAt
    endsAt
    description
    attendanceCount
    location
    checkedIn
    venueName
    duration
    maxPeople
    address
    featuredPhoto
    checkedInAt
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

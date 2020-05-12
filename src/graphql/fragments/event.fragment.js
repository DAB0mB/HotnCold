import gql from 'graphql-tag';

import area from './area.fragment';

const event = gql `
  fragment Event on Event {
    id
    category
    source
    sourceLink
    name
    localDate
    localTime
    startsAt
    endsAt
    sourceAttendanceCount
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

event.full = gql `
  fragment FullEvent on Event {
    ...Event
    description
  }

  ${event}
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

event.full.read = (cache, id) => {
  id = `FullEvent:${id.split(':').pop()}`;

  return cache.readFragment({
    id,
    fragment: event,
    fragmentName: 'FullEvent',
  });
};

event.full.write = (cache, data) => {
  const id = `FullEvent:${data.id}`;

  return cache.writeFragment({
    id,
    fragment: event,
    fragmentName: 'FullEvent',
    data,
  });
};

export default event;

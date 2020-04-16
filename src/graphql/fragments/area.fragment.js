import gql from 'graphql-tag';

const area = gql `
  fragment Area on Area {
    id
    name
    shortName
  }
`;

area.read = (cache, id) => {
  id = `Area:${id.split(':').pop()}`;

  return cache.readFragment({
    id,
    fragment: area,
    fragmentName: 'Area',
  });
};

area.write = (cache, data) => {
  const id = `Area:${data.id}`;

  return cache.writeFragment({
    id,
    fragment: area,
    fragmentName: 'Area',
    data,
  });
};

export default area;

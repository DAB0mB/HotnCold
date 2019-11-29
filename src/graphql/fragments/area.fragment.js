import gql from 'graphql-tag';

const area = gql `
  fragment Area on Area {
    id
    name
  }
`;

area.read = (cache, id) => {
  return cache.readFragment({
    id,
    fragment: area,
    fragmentName: 'Area',
  });
};

area.write = (cache, data) => {
  return cache.writeFragment({
    id: data.id,
    fragment: area,
    fragmentName: 'Area',
    data,
  });
};

export default area;

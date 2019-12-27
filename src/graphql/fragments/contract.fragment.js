import gql from 'graphql-tag';

const contract = gql `
  fragment Contract on Contract {
    id
    phone
    isTest
    verified
    passcode
  }
`;

contract.read = (cache, id) => {
  id = `Contract:${id.split(':').pop()}`;

  return cache.readFragment({
    id,
    fragment: contract,
    fragmentName: 'Contract',
  });
};

contract.write = (cache, data) => {
  const id = `Contract:${data.id}`;

  return cache.writeFragment({
    id,
    fragment: contract,
    fragmentName: 'Contract',
    data,
  });
};

export default contract;

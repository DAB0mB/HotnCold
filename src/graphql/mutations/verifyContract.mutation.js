import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../fragments';

const verifyContract = gql `
  mutation VerifyContract($contractId: ID!, $passcode: String!) {
    verifyContract(contractId: $contractId, passcode: $passcode) {
      ...Contract
    }
  }

  ${fragments.contract}
`;

verifyContract.use = (contractId, passcode, options) => {
  const [superMutate, mutation] = useMutation(verifyContract, options);

  const mutate = useCallback((options = {}) => {
    return superMutate({
      ...options,
      variables: { contractId, passcode },
    });
  }, [superMutate, contractId, passcode]);

  return [mutate, mutation];
};

export default verifyContract;

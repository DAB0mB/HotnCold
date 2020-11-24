import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

const $addContractReferenceDetails = gql `
  mutation AddContractReferenceDetails($referenceComment: String!) {
    addContractReferenceDetails(referenceComment: $referenceComment) {
      id
      referenceSubmitted
    }
  }
`;

$addContractReferenceDetails.use = (_variables = {}, options = {}) => {
  const [_mutate, mutation] = useMutation($addContractReferenceDetails, {
    ...options,
    variables: _variables,
  });

  const mutate = useCallback((variables = {}, options = {}) => {
    _mutate({
      ...options,
      variables: Object.assign({}, variables, _variables),
    });
  }, Object.values(_variables));

  return [mutate, mutation];
};

export default $addContractReferenceDetails;

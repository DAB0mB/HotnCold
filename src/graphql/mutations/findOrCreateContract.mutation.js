import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useCallback } from 'react';

import * as fragments from '../fragments';
import { validatePhone } from '../../utils';

const findOrCreateContract = gql `
  mutation FindOrCreateContract($phone: String!) {
    findOrCreateContract(phone: $phone) {
      ...Contract
    }
  }

  ${fragments.contract}
`;

findOrCreateContract.use = (phone, { onError = useCallback(() => {}), ...options } = {}) => {
  const [superMutate, mutation] = useMutation(findOrCreateContract, {
    ...options,
    onError,
  });

  const mutate = useCallback((options = {}) => {
    if (!validatePhone(phone)) {
      const error = new TypeError('Phone is invalid');

      onError(error);

      throw error;
    }

    return superMutate({
      ...options,
      variables: { phone },
    });
  }, [
    phone,
    superMutate,
    onError,
  ]);

  return [mutate, mutation];
};

export default findOrCreateContract;

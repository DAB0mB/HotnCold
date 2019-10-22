import React from 'react';

import DiscoveryRouter from '../../routers/Discovery';
import Header from './Header';
import ServiceRequired from './ServiceRequired';

const Discovery = () => {
  return (
    <HeaderProvider HeaderComponent={Header}>
      <NativeServices ServiceRequiredComponent={ServiceRequired}>
        <DiscoveryRouter />
      </NativeServices>
    </HeaderProvider>
  );
};

export default Discovery;

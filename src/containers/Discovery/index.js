import React from 'react';

import DiscoveryRouter from '../../routers/Discovery';
import BaseScreen from '../../screens/Base';
import { HeaderProvider } from '../../services/Header';
import { NativeServicesProvider } from '../../services/NativeServices';
import { useNavigation } from '../../services/Navigation';
import Header from './Header';
import ServiceRequired from './ServiceRequired';

const Discovery = () => {
  const baseNavigation = useNavigation();

  return (
    <HeaderProvider HeaderComponent={Header} defaultProps={{ baseNavigation }}>
      <NativeServicesProvider ServiceRequiredComponent={ServiceRequired}>
        <DiscoveryRouter />
      </NativeServicesProvider>
    </HeaderProvider>
  );
};

export default BaseScreen(Discovery);

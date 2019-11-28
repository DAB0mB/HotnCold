import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import CONFIG from 'react-native-config';

import * as queries from '../../graphql/queries';
import { MeProvider } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { HeaderProvider } from '../../services/Header';
import { useHeader } from '../../services/Header';
import { LoadingProvider, useLoading } from '../../services/Loading';
import NativeServices, { SERVICES } from '../../services/NativeServices';
import { useNavigation, NavigationProvider } from '../../services/Navigation';
import Base from '../Base';
import Header from './Header';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
  },
  body: {
    flex: 1,
  },
});

const Social = Base.create(() => {
  const { default: SocialRouter } = require('../../routers/Social');

  const alertError = useAlertError();
  const baseNavigation = useNavigation(Base);
  const meQuery = queries.me.use({ onError: alertError });
  const { me } = meQuery.data || {};
  meQuery.forSocial = queries.me.forSocial.use({ onError: alertError });
  me.forSocial = meQuery.forSocial.data || {};

  useEffect(() => {
    if (meQuery.called && !meQuery.loading && (meQuery.error || !me)) {
      // Unauthorized
      baseNavigation.replace('Profile');
    }
  }, [meQuery.called, meQuery.loading, meQuery.error, me, baseNavigation]);

  if (meQuery.loading) {
    return useLoading(true);
  }

  if (meQuery.error || !me) {
    return useLoading(false);
  }

  return useLoading(false,
    <View style={styles.container}>
      <MeProvider me={me}>
      <HeaderProvider HeaderComponent={Header} defaultProps={{ baseNavigation, me }}>
      <LoadingProvider>
        <View style={styles.body}>
          <SocialRouter />
        </View>
      </LoadingProvider>
      </HeaderProvider>
      </MeProvider>
    </View>
  );
});

Social.create = (Component) => {
  return ({ navigation: socialNavigation }) => {
    const { headerProps, setHeaderProps } = useHeader();

    useEffect(() => {
      setHeaderProps({ ...headerProps, socialNavigation });

      return () => {
        setHeaderProps(headerProps);
      };
    }, [true]);

    return (
      <NavigationProvider navKey={Social} navigation={socialNavigation}>
        <Component />
      </NavigationProvider>
    );
  };
};

export default Social;

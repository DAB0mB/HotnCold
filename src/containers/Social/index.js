import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import CONFIG from 'react-native-config';

import * as queries from '../../graphql/queries';
import { MeProvider } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { HeaderProvider } from '../../services/Header';
import { useHeader } from '../../services/Header';
import { LoadingProvider, useLoading } from '../../services/Loading';
import { useNavigation, NavigationProvider } from '../../services/Navigation';
import Base from '../Base';
import Header from './Header';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
  },
  body: {
    marginTop: 50,
    flex: 1,
  },
});

const Social = Base.create(({ navigation }) => {
  const { default: SocialRouter } = require('../../routers/Social');

  const alertError = useAlertError();
  const baseNav = useNavigation(Base);
  const meQuery = queries.me.use({ onError: alertError });
  const { me } = meQuery.data || {};

  useEffect(() => {
    if (meQuery.called && !meQuery.loading && (meQuery.error || !me)) {
      // Unauthorized
      baseNav.replace('Profile');
    }
  }, [meQuery.called, meQuery.loading, meQuery.error, me, baseNav]);

  if (meQuery.loading) {
    return useLoading(true);
  }

  if (meQuery.error || !me) {
    return useLoading(false);
  }

  return useLoading(false,
    <View style={styles.container}>
      <MeProvider me={me}>
      <LoadingProvider>
      <HeaderProvider HeaderComponent={Header}>
        <View style={styles.body}>
          <SocialRouter navigation={navigation} />
        </View>
      </HeaderProvider>
      </LoadingProvider>
      </MeProvider>
    </View>
  );
});

Social.create = (Component) => {
  return ({ navigation: socialNav }) => {
    const { headerProps, setHeaderProps } = useHeader();

    useEffect(() => {
      setHeaderProps({ ...headerProps, socialNav, Contents: Component.Header });

      return () => {
        setHeaderProps(headerProps);
      };
    }, [true]);

    return (
      <NavigationProvider navKey={Social} navigation={socialNav}>
        <Component navigation={socialNav} />
      </NavigationProvider>
    );
  };
};

export default Social;

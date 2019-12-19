import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

import * as queries from '../../graphql/queries';
import { MeProvider } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
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
    flex: 1,
  },
  bodyComponent: {
    marginTop: 50,
    flex: 1
  },
  loading: {
    backgroundColor: 'transparent',
  }
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
        <LoadingProvider loadingStyle={styles.loading}>
          <Header />
          <View style={styles.body}>
            <SocialRouter navigation={navigation} />
          </View>
        </LoadingProvider>
      </MeProvider>
    </View>
  );
});

Social.create = (Component) => {
  const HeaderContents = Component.Header || (() => null);

  return function SocialScreen({ navigation: socialNav }) {
    return (
      <NavigationProvider navKey={Social} navigation={socialNav}>
        <View style={{ marginTop: 50, flex: 1 }}>
          <Component navigation={socialNav} />
        </View>
        <Header>
          <HeaderContents />
        </Header>
      </NavigationProvider>
    );
  };
};

export default Social;

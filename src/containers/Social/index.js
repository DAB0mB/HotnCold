import React from 'react';
import { View, StyleSheet } from 'react-native';

import * as queries from '../../graphql/queries';
import { MyProvider } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { LoadingProvider, useLoading } from '../../services/Loading';
import { NavigationProvider } from '../../services/Navigation';
import Base from '../Base';
import Header from './Header';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    backgroundColor: 'white',
    flex: 1,
  },
  router: {
    flex: 1,
  },
  body: {
    backgroundColor: 'white',
    marginTop: 50,
    flex: 1
  },
});

const Social = Base.create(({ navigation }) => {
  const { default: SocialRouter } = require('../../routers/Social');

  const alertError = useAlertError();
  const myQuery = queries.mine.use({ onError: alertError });
  const { me, myContract } = myQuery.data || {};

  if (myQuery.loading) {
    return useLoading(true);
  }

  if (myQuery.error || !me) {
    return useLoading(false);
  }

  return useLoading(false,
    <View style={styles.container}>
      <MyProvider me={me} myContract={myContract}>
        <LoadingProvider>
          <Header />
          <View style={styles.router}>
            <SocialRouter navigation={navigation} />
          </View>
        </LoadingProvider>
      </MyProvider>
    </View>
  );
});

Social.create = (Component) => {
  const HeaderContents = Component.Header || (() => null);

  return function SocialScreen({ navigation: socialNav }) {
    return (
      <NavigationProvider navKey={Social} navigation={socialNav}>
        <View style={styles.body}>
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

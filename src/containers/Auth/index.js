import React from 'react';
import { View, StyleSheet } from 'react-native';

import { LoadingProvider } from '../../services/Loading';
import { NavigationProvider } from '../../services/Navigation';
import { StatusBarProvider } from '../../services/StatusBar';
import { colors } from '../../theme';
import Base from '../Base';
import Header, { HEIGHT as HEADER_HEIGHT } from './Header';
import Loader from './Loader';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
    backgroundColor: colors.ink,
  },
  bodyFiller: {
    backgroundColor: colors.ink,
    position: 'absolute',
    // -1 will make transition look without glitches
    left: -1,
    top: -1,
    right: -1,
    bottom: -1,
  },
  body: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: HEADER_HEIGHT,
    padding: 20,
    backgroundColor: colors.ink,
  },
  loadingContainer: {
    backgroundColor: colors.ink,
  }
});

const Auth = Base.create(({ navigation }) => {
  const { default: AuthRouter } = require('../../routers/Auth');

  return (
    <View style={styles.container}>
      <LoadingProvider containerStyle={styles.loadingContainer} LoaderComponent={Loader}>
        <AuthRouter navigation={navigation} />
        <Header />
      </LoadingProvider>
    </View>
  );
});

Auth.create = (Component) => {
  return function AuthScreen({ navigation: authNav }) {
    return (
      <NavigationProvider navKey={Auth} navigation={authNav}>
        <StatusBarProvider translucent barStyle='light-content' backgroundColor={colors.ink}>
          <View style={styles.bodyFiller} />
          <View style={styles.body}>
            <Component navigation={authNav} />
          </View>
        </StatusBarProvider>
      </NavigationProvider>
    );
  };
};

export default Auth;

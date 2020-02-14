import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';

import { LoadingProvider } from '../../services/Loading';
import { NavigationProvider } from '../../services/Navigation';
import { StatusBarProvider } from '../../services/StatusBar';
import Base from '../Base';
import Header, { HEIGHT as HEADER_HEIGHT } from './Header';
import Loader from './Loader';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
    position: 'relative',
  },
  body: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: HEADER_HEIGHT,
    padding: 20,
  },
});

const Auth = Base.create(({ navigation }) => {
  const { default: AuthRouter } = require('../../routers/Auth');

  return (
    <View style={styles.container}>
      <LoadingProvider LoaderComponent={Loader}>
        <ImageBackground source={require('./auth-background.png')} style={{ width: '100%', height: '100%' }}>
          <AuthRouter navigation={navigation} />
        </ImageBackground>
        <Header />
      </LoadingProvider>
    </View>
  );
});

Auth.create = (Component) => {
  return function AuthScreen({ navigation: authNav }) {
    return (
      <NavigationProvider navKey={Auth} navigation={authNav}>
        <StatusBarProvider translucent barStyle='dark-content' backgroundColor={'white'}>
          <View style={styles.body}>
            <Component navigation={authNav} />
          </View>
        </StatusBarProvider>
      </NavigationProvider>
    );
  };
};

export default Auth;

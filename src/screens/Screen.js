import { ApolloProvider } from '@apollo/react-hooks';
import React from 'react';
import { View, StatusBar, SafeAreaView, StyleSheet } from 'react-native';
import { getStatusBarHeight } from 'react-native-status-bar-height';

import graphqlClient from '../graphql/client';
import mapboxClient from '../mapbox/client';
import { MapboxProvider } from '../mapbox/utils';
import { NavigationProvider } from '../Navigation';

const styles = StyleSheet.create({
  container: {
    paddingTop: getStatusBarHeight(),
    flex: 1,
  }
});

const Screen = ({ navigation, children }) => {
  return (
    <ApolloProvider client={graphqlClient}>
    <MapboxProvider client={mapboxClient}>
    <NavigationProvider navigation={navigation}>
      {children}
    </NavigationProvider>
    </MapboxProvider>
    </ApolloProvider>
  );
};

Screen.create = (Root) => ({ navigation }) => {
  return (
    <Screen navigation={navigation}>
      <StatusBar translucent backgroundColor='black' />
      <SafeAreaView style={styles.container}>
        <Root />
      </SafeAreaView>
    </Screen>
  );
};

export default Screen;

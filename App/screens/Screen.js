import React from 'react';
import { ApolloProvider } from 'react-apollo-hooks';
import { View, StyleSheet } from 'react-native';
import { getStatusBarHeight } from 'react-native-status-bar-height';

import graphqlClient from '../graphql/client';
import mapboxClient from '../mapbox/client';
import { MapboxProvider } from '../mapbox/utils';
import { NavigationProvider } from '../Navigation';

const styles = StyleSheet.create({
  statusBar: {
    paddingTop: getStatusBarHeight(),
    backgroundColor: 'black',
  },
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
      <View style={styles.statusBar} />
      <Root />
    </Screen>
  );
};

export default Screen;

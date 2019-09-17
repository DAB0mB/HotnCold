import React from 'react';
import { ApolloProvider } from 'react-apollo-hooks';
import { View, StatusBar } from 'react-native';

import graphqlClient from '../graphql/client';
import mapboxClient from '../mapbox/client';
import { MapboxProvider } from '../mapbox/utils';
import { NavigationProvider } from '../Navigation';

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
      <Root />
    </Screen>
  );
};

export default Screen;

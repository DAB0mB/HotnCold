import bootstrap from './bootstrap';

import { ApolloProvider } from '@apollo/react-hooks';
import { RobotRunner } from 'hotncold-robot';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import { getStatusBarHeight } from 'react-native-status-bar-height';

import BaseContainer from './containers/Base';
import graphqlClient from './graphql/client';
import { AppStateProvider } from './services/AppState';
import { CookieProvider } from './services/Cookie';
import { DropdownAlertProvider } from './services/DropdownAlert';
import { GeolocationProvider } from './services/Geolocation';
import { ImagePickerProvider } from './services/ImagePicker';
import { NotificationsProvider } from './services/Notifications';

const bootstrapping = bootstrap();

const styles = StyleSheet.create({
  container: {
    paddingTop: getStatusBarHeight(),
    flex: 1,
  },
});

const initialAppState = {
  discoveryTime: new Date(),
};

const App = () => {
  const [bootstrapped, setBootstrapped] = useState(null);
  const dropdownAlertRef = useRef(null);

  useEffect(() => {
    bootstrapping.then((bootstrapped) => {
      SplashScreen.hide();

      setBootstrapped(bootstrapped);
    })
      .catch((e) => {
        SplashScreen.hide();

        console.error(e);
      });
  }, [true]);

  useEffect(() => {
    const onGraphQLError = ({ networkError }) => {
      const dropdownAlert = dropdownAlertRef.current;

      if (networkError) {
        dropdownAlert.alertWithType('error', 'Error', networkError.message);
      }
    };

    graphqlClient.events.on('error', onGraphQLError);

    return () => {
      graphqlClient.events.off('error', onGraphQLError);
    };
  }, [true]);

  if (!bootstrapped) {
    return null;
  }

  return (
    <View style={styles.container}>
      <AppStateProvider init={initialAppState}>
        <ApolloProvider client={graphqlClient}>
          <NotificationsProvider>
            <CookieProvider>
              <DropdownAlertProvider ref={dropdownAlertRef}>
                <ImagePickerProvider>
                  <GeolocationProvider>
                    <RobotRunner>
                      <BaseContainer />
                    </RobotRunner>
                  </GeolocationProvider>
                </ImagePickerProvider>
              </DropdownAlertProvider>
            </CookieProvider>
          </NotificationsProvider>
        </ApolloProvider>
      </AppStateProvider>
    </View>
  );
};

export default App;

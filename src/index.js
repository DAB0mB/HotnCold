import bootstrap from './bootstrap';

import { ApolloProvider } from '@apollo/react-hooks';
import { RobotRunner } from 'hotncold-robot';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { getStatusBarHeight } from 'react-native-status-bar-height';

import BaseContainer from './containers/Base';
import graphqlClient from './graphql/client';
import { AppStateProvider } from './services/AppState';
import { CookieProvider } from './services/Cookie';
import { DateTimePickerProvider } from './services/DateTimePicker';
import { DeviceInfoProvider } from './services/DeviceInfo';
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

const App = () => {
  const [bootstrapped, setBootstrapped] = useState(null);
  const dropdownAlertRef = useRef(null);

  useEffect(() => {
    bootstrapping.then((bootstrapped) => {
      setBootstrapped(bootstrapped);
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
      <AppStateProvider>
        <DeviceInfoProvider info={bootstrapped.deviceInfo}>
          <ApolloProvider client={graphqlClient}>
            <NotificationsProvider trigger={bootstrapped.initialNotification}>
              <CookieProvider>
                <DropdownAlertProvider ref={dropdownAlertRef}>
                  <DateTimePickerProvider>
                    <ImagePickerProvider>
                      <GeolocationProvider>
                        <RobotRunner>
                          <BaseContainer />
                        </RobotRunner>
                      </GeolocationProvider>
                    </ImagePickerProvider>
                  </DateTimePickerProvider>
                </DropdownAlertProvider>
              </CookieProvider>
            </NotificationsProvider>
          </ApolloProvider>
        </DeviceInfoProvider>
      </AppStateProvider>
    </View>
  );
};

export default App;

import { ApolloProvider } from '@apollo/react-hooks';
import { Robot } from 'hotncold-robot';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import bootstrap from './bootstrap';
import BaseContainer from './containers/Base';
import graphqlClient from './graphql/client';
import { AppStateProvider } from './services/AppState';
import { BluetoothLEProvider } from './services/BluetoothLE';
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
    flex: 1
  },
});

const App = () => {
  const [bootstrapped, setBootstrapped] = useState(null);

  useEffect(() => {
    bootstrapping.then((bootstrapped) => {
      setBootstrapped(bootstrapped);
    });
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
                <DropdownAlertProvider>
                  <DateTimePickerProvider>
                    <ImagePickerProvider>
                      <BluetoothLEProvider>
                        <GeolocationProvider>
                          <Robot>
                            <BaseContainer />
                          </Robot>
                        </GeolocationProvider>
                      </BluetoothLEProvider>
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

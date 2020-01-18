import { ApolloProvider } from '@apollo/react-hooks';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import bootstrap from './bootstrap';
import BaseContainer from './containers/Base';
import graphqlClient from './graphql/client';
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
  const [nativeInitialized, setNativeInitialized] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);

  useEffect(() => {
    bootstrapping.then(({ deviceInfo }) => {
      setDeviceInfo(deviceInfo);
      setNativeInitialized(true);
    });
  }, [true]);

  if (!nativeInitialized) {
    return null;
  }

  return (
    <View style={styles.container}>
      <DeviceInfoProvider info={deviceInfo}>
        <ApolloProvider client={graphqlClient}>
          <NotificationsProvider>
            <CookieProvider>
              <DropdownAlertProvider>
                <DateTimePickerProvider>
                  <ImagePickerProvider>
                    <BluetoothLEProvider>
                      <GeolocationProvider>
                        <BaseContainer />
                      </GeolocationProvider>
                    </BluetoothLEProvider>
                  </ImagePickerProvider>
                </DateTimePickerProvider>
              </DropdownAlertProvider>
            </CookieProvider>
          </NotificationsProvider>
        </ApolloProvider>
      </DeviceInfoProvider>
    </View>
  );
};

export default App;

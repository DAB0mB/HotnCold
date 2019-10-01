import { ApolloProvider } from '@apollo/react-hooks';
import React, { useEffect, useState } from 'react';
import { View, StatusBar, SafeAreaView, StyleSheet } from 'react-native';
import BleManager from 'react-native-ble-manager';
import BlePeripheral from 'react-native-ble-peripheral';
import CONFIG from 'react-native-config';
import DropdownAlert from 'react-native-dropdownalert';
import { getStatusBarHeight } from 'react-native-status-bar-height';

import ActivityIndicator from '../components/ActivityIndicator';
import PermissionRequestor from '../components/PermissionRequestor';
import graphqlClient from '../graphql/client';
import { AuthProvider } from '../services/Auth';
import { useAlertError, DropDownAlertProvider } from '../services/DropDownAlert';
import { NavigationProvider } from '../services/Navigation';

const styles = StyleSheet.create({
  container: {
    paddingTop: getStatusBarHeight(),
    flex: 1,
  }
});

const Screen = ({ children }) => {
  const dropDownAlertRef = useRef(null);

  return (
    <>
      <DropDownAlert ref={dropDownAlertRef} />
      <DropDownAlertProvider dropDownAlert={dropDownAlertRef.current}>
        {dropDownAlertRef.current && children}
      </DropDownAlertProvider>
    </>
  );
};

Screen.Authorized = ({ children }) => {
  const alertError = useAlertError();
  const meQuery = queries.me.use({ onError: alertError });
  const startedServices = useSet([]);
  const { me } = me.data || {};

  useEffect(() => {
    if (!me) return;

    BlePeripheral.start().then(() => {
      ble.peripheral.addService(CONFIG.BLE_SERVICE_UUID, true);
      ble.peripheral.addService(me.id, false);
      startedServices.add(BlePeripheral);
    }).catch(alertError);

    BleManager.start().then(() => {
      startedServices.add(BleManager);
    }).catch(alertError);

    return () => {
      if (startedServices.has(BlePeripheral)) {
        BlePeripheral.stop();
      }
    };
  }, [me]);

  if (meQuery.loading || startedServices.size != 2) {
    return (
      <ActivityIndicator />
    );
  }

  return (
    <AuthProvider me={me}>
      {children}
    </AuthProvider>
  );
};

Screen.create = (Root) => ({ navigation }) => {
  return (
    <ApolloProvider client={graphqlClient}>
      <NavigationProvider service={navigation}>
        <Screen>
          <StatusBar translucent backgroundColor='black' />
          <SafeAreaView style={styles.container}>
            <Root />
          </SafeAreaView>
        </Screen>
      </NavigationProvider>
    </ApolloProvider>
  );
};

Screen.Authorized.create = (Root) => Screen.create(() =>
  <PermissionRequestor funcs={['bluetooth', 'location']}>
    <Screen.Authorized {...props}>
      <Root />
    </Screen.Authorized>
  </PermissionRequestor>
);

export default Screen;

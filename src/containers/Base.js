import React, { useMemo } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useApolloClient } from '@apollo/react-hooks';

import * as queries from '../graphql/queries';
import { MyProvider } from '../services/Auth';
import { LoadingProvider } from '../services/Loading';
import { NavigationProvider } from '../services/Navigation';
import { StatusBarProvider } from '../services/StatusBar';

const styles = StyleSheet.create({
  container: { position: 'relative', flex: 1 },
});

const Base = ({ navigation }) => {
  const { default: BaseRouter } = require('../routers/Base');

  return (
    <BaseRouter navigation={navigation} />
  );
};

Base.create = (Component) => {
  return function BaseScreen({ navigation }) {
    const client = useApolloClient();

    const mine = useMemo(() => {
      try {
        return client.readQuery({
          query: queries.mine,
        });
      }
      catch (e) {
        return {};
      }
    }, [client]);

    return (
      <NavigationProvider navKey={Base} navigation={navigation}>
        <StatusBarProvider translucent barStyle='dark-content' backgroundColor='white'>
          <SafeAreaView style={styles.container}>
            <LoadingProvider>
              <MyProvider {...mine}>
                <Component navigation={navigation} />
              </MyProvider>
            </LoadingProvider>
          </SafeAreaView>
        </StatusBarProvider>
      </NavigationProvider>
    );
  };
};

export default Base;

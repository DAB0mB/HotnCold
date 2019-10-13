import React from 'react';
import { StyleSheet, View } from 'react-native';

import Router from './Router';
import { DropdownAlertProvider } from './services/DropdownAlert';
import { useHeaderState, HeaderProvider } from './services/Header';


const styles = StyleSheet.create({
  container: {
    flex: 1
  },
});

const App = () => {
  const [header] = useHeaderState();

  return (
    <View style={styles.container}>
      <Router />
      {header}
    </View>
  );
};

export default () => {
  return (
    <HeaderProvider>
    <DropdownAlertProvider>
      <App />
    </DropdownAlertProvider>
    </HeaderProvider>
  );
};

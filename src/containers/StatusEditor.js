import React from 'react';
import { View, StyleSheet } from 'react-native';

import { NavigationProvider } from '../services/Navigation';
import Base from './Base';

const styles = StyleSheet.create({
  container: { flexDirection: 'column', flex: 1, position: 'relative' },
});

const StatusEditor = Base.create(({ navigation }) => {
  const { default: StatusEditorRouter } = require('../routers/StatusEditor');

  return (
    <View style={styles.container}>
      <StatusEditorRouter navigation={navigation} />
    </View>
  );
});

StatusEditor.create = (Component) => {
  return function StatusEditorScreen({ navigation: statusEditorNav }) {
    return (
      <NavigationProvider navKey={StatusEditor} navigation={statusEditorNav}>
        <Component navigation={statusEditorNav} />
      </NavigationProvider>
    );
  };
};

export default StatusEditor;

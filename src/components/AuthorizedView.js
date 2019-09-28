import React, { useEffect, useMemo, useState } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import Permissions from 'react-native-permissions';

import ViewLoadingIndicator from './ViewLoadingIndicator';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4264fb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unauthorizedText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

const AuthorizedView = ({ functions: funcs, ...props }) => {
  const [permissions, setPermissions] = useState(() =>
    funcs.reduce((permissions, func) =>
      Object.assign(permissions, {
        [func]: 'undetermined'
      })
    )
  );
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // async function returns Promise
    (async () => {
      const permissions = await Permissions.checkMultiple(funcs);

      for (let [func, permission] of Object.entries(permissions)) {
        if (permission !== 'authorized') {
          permission = await Permissions.request(func);
        }

        if (permission !== 'authorized') {
          setLoading(false);

          return;
        }
      }

      setAuthorized(true);
      setLoading(false);
    })();
  }, [true]);

  if (Platform.OS === 'android' && !authorized) {
    if (loading) {
      return <ViewLoadingIndicator />;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.unauthorizedText}>
          You need to accept {funcs.join(', ')} permissions in order to proceed
        </Text>
      </View>
    );
  }

  return (
    <View {...props} />
  );
};

export default AuthorizedView;

import React, { useMemo, useState } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';

import { useMapbox } from '../mapbox/utils';
import ViewLoadingIndicator from './ViewLoadingIndicator';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4264fb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPermissionsText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

const LocationPermittedView = (props) => {
  const [loading, setLoading] = useState(true);
  const [permitted, setPermitted] = useState(false);
  const mapbox = useMapbox();

  useMemo(() => {
    mapbox.requestAndroidLocationPermissions().then((permitted) => {
      setLoading(false);
      setPermitted(permitted);
    });
  }, [true]);

  if (Platform.OS === 'android' && !permitted) {
    if (loading) {
      return <ViewLoadingIndicator />;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.noPermissionsText}>
          You need to accept location permissions in order to use this
          example applications
        </Text>
      </View>
    );
  }

  return (
    <View {...props} />
  );
};

export default LocationPermittedView;

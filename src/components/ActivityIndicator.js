import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, Dimensions } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const SIZE = Platform.OS == 'android' ? Dimensions.get('window').width / 4 : 'large';
const BUFFER_MS = 1000;

const ViewLoadingIndicator = ({ size = SIZE, bufferMs = BUFFER_MS }) => {
  const [buffering, setBuffering] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setBuffering(false);
    }, bufferMs);

    return () => {
      clearTimeout(timeout);
    };
  }, [true]);

  return (
    <View style={styles.container}>
      {!buffering && (
        <ActivityIndicator size={size} color="#0000ff" />
      )}
    </View>
  );
};

export default ViewLoadingIndicator;

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';

import DotsLoader from './DotsLoader';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'silver',
    margin: 10,
  },
});

const SIZE = Platform.OS == 'android' ? Dimensions.get('window').width / 4 : 'large';
const BUFFER_MS = 500;

const ViewLoadingIndicator = ({ size = SIZE, bufferMs = BUFFER_MS, style = {} }) => {
  const [buffering, setBuffering] = useState(true);

  useEffect(() => {
    // React native doesn't clear timeout for some reason
    let mounted = true;

    const timeout = setTimeout(() => {
      if (mounted) {
        setBuffering(false);
      }
    }, bufferMs);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [true]);

  return (
    <View style={[styles.container, style]}>
      {!buffering && (
        <>
          <DotsLoader />
          <Text style={styles.text}>Loading...</Text>
        </>
      )}
    </View>
  );
};

export default ViewLoadingIndicator;

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import DotsLoader from './DotsLoader';

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  text: { color: 'silver', margin: 10 },
});

const Loader = ({ size, betweenSpace, bufferMs = 0, style = {}, text = 'Loading' }) => {
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
        <React.Fragment>
          <DotsLoader size={size} betweenSpace={betweenSpace} />
          {text && (
            <Text style={[styles.text, style]}>{text}...</Text>
          )}
        </React.Fragment>
      )}
    </View>
  );
};

export default Loader;

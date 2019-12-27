import React from 'react';
import { StyleSheet } from 'react-native';

import SuperLoader from '../../components/Loader';

const styles = StyleSheet.create({
  loader: {
    color: 'white',
  },
});

const Loader = ({ children }) => {
  return (
    <SuperLoader style={styles.loader}>{children}</SuperLoader>
  );
};

export default Loader;

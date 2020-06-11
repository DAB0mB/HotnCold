import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import Base from '../../containers/Base';
import { useAppState } from '../../services/AppState';
import { useNavigation } from '../../services/Navigation';
import SearchBar from './SearchBar';
import Results from './Results';

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'column', backgroundColor: 'white' },
  shadow: { position: 'absolute', top: 0, left: 0, width: '100%', height: 30 },
});

const AreaSearch = () => {
  const [results, setResults] = useState([]);
  const [, setAppState] = useAppState();
  const baseNav = useNavigation(Base);

  baseNav.useBackListener();

  const handleResults = useCallback((results) => {
    setResults(results);
  }, [true]);

  const handleAreaPick = useCallback((area) => {
    baseNav.goBackOnceFocused();

    setAppState((appState) => {
      return {
        ...appState,
        discoveryArea: area,
      };
    });
  }, [true]);

  return (
    <View style={styles.container}>
      <SearchBar onResults={handleResults} />
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={['rgba(0, 0, 0, .05)', 'rgba(0, 0, 0, 0)']}
          style={styles.shadow}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <Results results={results} onAreaPick={handleAreaPick} />
      </View>
    </View>
  );
};

export default Base.create(AreaSearch);

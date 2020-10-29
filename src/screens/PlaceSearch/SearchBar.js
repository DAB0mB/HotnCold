import MapboxGL from '@react-native-mapbox-gl/maps';
import React, { useEffect, useCallback, useState } from 'react';
import { TouchableWithoutFeedback, TextInput, StyleSheet } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Bar from '../../components/Bar';
import Base from '../../containers/Base';
import { colors } from '../../theme';
import * as queries from '../../graphql/queries';
import { useAppState } from '../../services/AppState';
import { useAlertError } from '../../services/DropdownAlert';
import { useNavigation } from '../../services/Navigation';
import { useAsyncEffect } from '../../utils';

const styles = StyleSheet.create({
  input: { fontSize: 18, paddingLeft: 20, flex: 1 },
});

const SearchBar = ({ onResults }) => {
  const [results, setResults] = useState([]);
  const [text, setText] = useState('');
  const [searchText, setSearchText] = useState('');
  const baseNav = useNavigation(Base);
  const alertError = useAlertError();
  const [appState] = useAppState();
  const [location, setLocation] = useState(() => appState.discoveryArea?.center);

  useAsyncEffect(function* () {
    if (location) return;

    const { coords } = yield MapboxGL.locationManager.getLastKnownLocation();

    setLocation([
      coords.longitude,
      coords.latitude,
    ]);
  }, [searchText]);

  queries.localAreaPlaces.use(location, searchText, {
    onCompleted: useCallback((data) => {
      if (!data) return;

      setResults(data.localAreaPlaces.features);
    }, []),
    onError: alertError,
  });

  baseNav.useBackListener();

  const clearText = useCallback(() => {
    setText('');
  }, [true]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchText(text);

      if (!text) {
        setResults([]);
      }
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [text]);

  useEffect(() => {
    if (results) {
      onResults(results);
    }
  }, [results]);

  return (
    <Bar>
      <TouchableWithoutFeedback onPress={baseNav.goBackOnceFocused}>
        <McIcon name='arrow-left' color={colors.hot} size={30} />
      </TouchableWithoutFeedback>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder='Type place name'
        autoCompleteType='off'
        importantForAutofill='no'
        autoCorrect={false}
        style={styles.input}
      />

      {text ? (
        <TouchableWithoutFeedback onPress={clearText}>
          <McIcon name='close' color={colors.hot} size={30} />
        </TouchableWithoutFeedback>
      ) : null}
    </Bar>
  );
};

export default SearchBar;

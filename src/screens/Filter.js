import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, TextInput, Text, TouchableWithoutFeedback } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Base from '../containers/Base';
import { useAppState } from '../services/AppState';
import { useNavigation } from '../services/Navigation';

const Filter = () => {
  const baseNav = useNavigation(Base);
  const [appState, setAppState] = useAppState();
  const [filterText, setFilterText] = useState(appState.discoveryFilterText);
  const inputRef = useRef();

  baseNav.useBackListener();

  const applyFilter = useCallback(() => {
    setAppState(appState => ({
      ...appState,
      discoveryFilterText: filterText,
    }));

    baseNav.goBackOnceFocused();
  }, [baseNav, filterText]);

  useEffect(() => {
    const didFocusListener = baseNav.addListener('didFocus', () => {
      inputRef.current.focus();
    });

    return () => {
      didFocusListener.remove();
    };
  }, [true]);

  return (
    <View style={{ backgroundColor: 'rgba(0, 0, 0, .8)', flex: 1, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      <McIcon name='close' color='white' size={30} style={{ position: 'absolute', top: 10, right: 10 }} onPress={baseNav.goBackOnceFocused} />
      {!filterText && (
        <Text style={{ position: 'absolute', fontSize: 30, color: 'rgba(255, 255, 255, .5)', fontWeight: '200' }}>-Any-</Text>
      )}
      <TextInput ref={inputRef} style={{ textAlign: 'center', fontSize: 30, color: 'white', fontWeight: '500', width: '80%', borderBottomColor: 'white', borderBottomWidth: 2.5 }} value={filterText} placeholder='' placeholderTextColor='white' onChangeText={setFilterText} />

      <TouchableWithoutFeedback onPress={applyFilter}>
        <View style={{ alignItems: 'center', justifyContent: 'center', height: 65, width: 65, position: 'absolute', bottom: 30, alignSelf: 'center', borderRadius: 100, borderWidth: 2, borderColor: 'white' }}>
          <McIcon name='filter-outline' size={40} color='white' />
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default Base.create(Filter);

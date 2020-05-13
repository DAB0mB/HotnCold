import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, TextInput, TouchableWithoutFeedback } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MIcon from 'react-native-vector-icons/MaterialIcons';

import Base from '../containers/Base';
import { useAppState } from '../services/AppState';
import { useNavigation } from '../services/Navigation';

const Search = () => {
  const baseNav = useNavigation(Base);
  const [appState, setAppState] = useAppState();
  const [searchText, setSearchText] = useState(appState.discoverySearchText);
  const inputRef = useRef();

  baseNav.useBackListener();

  const applySearch = useCallback(() => {
    setAppState(appState => ({
      ...appState,
      discoverySearchText: searchText,
    }));

    baseNav.goBackOnceFocused();
  }, [baseNav, searchText]);

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
      <TextInput ref={inputRef} style={[{ textAlign: 'center', fontSize: 30, color: 'white', fontWeight: '500', width: '80%', borderBottomColor: 'white', borderBottomWidth: 2.5 }, !searchText && { fontWeight: '300' }].filter(Boolean)} value={searchText} placeholder='-Any-' placeholderTextColor='white' onChangeText={setSearchText} />

      <TouchableWithoutFeedback onPress={applySearch}>
        <View style={{ alignItems: 'center', justifyContent: 'center', height: 65, width: 65, position: 'absolute', bottom: 30, alignSelf: 'center', borderRadius: 100, borderWidth: 2, borderColor: 'white' }}>
          <MIcon name='search' size={40} color='white' />
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default Base.create(Search);

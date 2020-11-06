import React, { useCallback, useState } from 'react';
import { Animated, View, StyleSheet, ScrollView, Image, TouchableWithoutFeedback } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppState } from '../../services/AppState';
import { hexToRgba, colors } from '../../theme';
import { useAsyncEffect } from '../../utils';

const styles = StyleSheet.create({
  container: { top: 0, width: '100%', position: 'absolute' },
  scroller: { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  scrollerContent: { alignItems: 'center' },
  statusAvatar: { margin: 10, height: 60, width: 60, borderRadius: 60, borderWidth: 3 },
  closeBtn: { backgroundColor: 'white', alignSelf: 'flex-end' },
});

const Selection = ({ selection: _selection, handleClearSelection }) => {
  const [selection, setSelection] = useState(() => _selection || { features: [] });
  const [translateY] = useState(() => new Animated.Value(selection.features.length ? 0 : -130));
  const [appState, setAppState] = useAppState();

  useAsyncEffect(function* () {
    let toValue;
    if (_selection?.features.length) {
      setSelection(_selection);
      toValue = 0;
    }
    else {
      toValue = -130;
    }

    yield new Promise(resolve => Animated.timing(translateY, {
      toValue,
      duration: 500,
      useNativeDriver: true,
    }).start(resolve));

    if (!_selection?.features.length) {
      setSelection({ features: [] });
    }
  }, [_selection]);

  const onFeaturePress = useCallback((feature) => {
    appState.discoveryCamera.current.setCamera({
      centerCoordinate: feature.geometry.coordinates,
      zoomLevel: 13,
      animationDuration: 2000,
    });

    setAppState(appState => ({
      ...appState,
      activeStatus: feature.properties.status,
    }));
  }, [appState]);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <ScrollView horizontal key={selection.features.length} style={styles.scroller} contentStyleContainer={styles.scrollerContent}>
        {selection.features.map((feature) => (
          <TouchableWithoutFeedback key={feature.properties.status.id} onPress={() => onFeaturePress(feature)}>
            <Image style={[styles.statusAvatar, { borderColor: feature.properties.status.isMeetup ? colors.hot : colors.cold }]} source={{ uri: feature.properties.status.avatar }} />
          </TouchableWithoutFeedback>
        ))}
      </ScrollView>
      <TouchableWithoutFeedback onPress={handleClearSelection}>
        <View style={styles.closeBtn}>
          <McIcon name='close' size={20} color={hexToRgba(colors.gray, .5)} style={{ margin: 10 }} />
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

export default Selection;

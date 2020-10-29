import React, { useCallback, useState } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import Ripple from 'react-native-material-ripple';
import MIcon from 'react-native-vector-icons/MaterialIcons';

import { colors, hexToRgba } from '../../theme';

const styles = StyleSheet.create({
  itemRipple: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingHorizontal: 20 },
  itemText: { paddingLeft: 20 },
});

const ResultItem = ({ feature, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(feature);
  }, [onPress]);

  const [iconName] = useState(() => {
    switch (feature.properties.maki) {
    case 'bar': return 'local-bar';
    case 'airport': return 'local-airport';
    case 'pharmacy': return 'local-pharmacy';
    case 'cafe': return 'local-cafe';
    case 'hospital': return 'local-hospital';
    case 'rail': return 'train';
    }

    return (feature.place_type.length == 1 && feature.place_type == 'address') ? 'home' : 'place';
  });

  return (
    <Ripple onPress={handlePress} style={styles.itemRipple}>
      <MIcon name={iconName} size={20} color={hexToRgba(colors.gray, .5)} />
      <Text style={styles.itemText}>{feature.place_name}</Text>
    </Ripple>
  );
};

const Results = ({ results, onFeaturePress }) => {
  return (
    <ScrollView>
      {results.map(result =>
        <ResultItem key={result.id} feature={result} onPress={onFeaturePress} />
      )}
    </ScrollView>
  );
};

export default Results;

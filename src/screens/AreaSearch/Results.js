import React, { useCallback } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import Ripple from 'react-native-material-ripple';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { colors, hexToRgba } from '../../theme';

const styles = StyleSheet.create({
  itemRipple: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingHorizontal: 20 },
  itemText: { paddingLeft: 20 },
});

const ResultItem = ({ icon, name, area, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(area);
  }, [onPress]);

  return (
    <Ripple onPress={handlePress} style={styles.itemRipple}>
      <McIcon name={icon} size={20} color={hexToRgba(colors.gray, .5)} />
      <Text style={styles.itemText}>{name}</Text>
    </Ripple>
  );
};

const Results = ({ results, onAreaPick }) => {
  return (
    <ScrollView>
      <ResultItem icon='crosshairs-gps' name='-reset-' area={{ __reset: true }} onPress={onAreaPick} />

      {results.map(result =>
        <ResultItem key={result.id} icon='city' name={result.name} area={result} onPress={onAreaPick} />
      )}
    </ScrollView>
  );
};

export default Results;

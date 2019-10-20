import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { colors } from '../theme';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    paddingLeft: 20,
    paddingRight: 20,
  },
  text: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 10,
  },
  customMessage: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    color: colors.cold,
  }
});

const ServiceRequiredError = ({ requiredService }) => {
  if (!requiredService) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        <Text style={{ color: colors.hot }}>Please turn on your</Text> <Text style={{ color: colors.cold }}>{requiredService.name}</Text><Text style={{ color: colors.hot }}>.</Text>
      </Text>
      <McIcon name={requiredService.icon} size={25} color={colors.ink} solid />
      {requiredService.customMessage && (
        <Text style={styles.customMessage}>{requiredService.customMessage}</Text>
      )}
    </View>
  );
};

export default ServiceRequiredError;

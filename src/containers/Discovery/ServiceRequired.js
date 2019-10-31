import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { SERVICES } from '../../services/NativeServices';
import { colors } from '../../theme';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
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

const mapServiceToServiceData = (service) => {
  switch (service) {
    case SERVICES.GPS: return { name: 'GPS', icon: 'crosshairs-gps' };
    case SERVICES.BLUETOOTH: return { name: 'Bluetooth', icon: 'bluetooth' };
  }
};

const ServiceRequired = ({ service }) => {
  const serviceData = mapServiceToServiceData(service);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        <Text style={{ color: colors.hot }}>Please turn on your</Text> <Text style={{ color: colors.cold }}>{serviceData.name}</Text><Text style={{ color: colors.hot }}>.</Text>
      </Text>
      <McIcon name={serviceData.icon} size={25} color={colors.ink} solid />
      {serviceData.customMessage && (
        <Text style={styles.customMessage}>{serviceData.customMessage}</Text>
      )}
    </View>
  );
};

export default ServiceRequired;

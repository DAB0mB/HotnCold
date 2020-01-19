import React, { useCallback, useMemo } from 'react';
import { View, Image, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useDeviceInfo } from '../../services/DeviceInfo';
import { colors, hexToRgba } from '../../theme';
import { useCallbackTask } from '../../utils';

const styles = StyleSheet.create({
  gradient: {
    width: '100%',
    marginTop: getStatusBarHeight(),
    position: 'absolute',
    padding: 10,
    left: 0,
    top: 0,
  },
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    left: 0,
    top: 0,
  },
  logo: {
    height: 20,
    resizeMode: 'contain',
    flex: 1,
  },
});

const Header = ({ baseNav, discoveryNav }) => {
  const deviceInfo = useDeviceInfo();
  const alterIcon = useMemo(() =>
    (discoveryNav && discoveryNav.state.routeName) === 'Radar' ? 'map' : 'radar'
  , [discoveryNav]);

  const navToInbox = useCallback(() => {
    baseNav.push('Social', {
      $initialChildRoute: {
        routeName: 'Inbox',
      },
    });
  }, [baseNav]);

  const toggleDiscoveryRoute = useCallbackTask(() => {
    if (discoveryNav.state.routeName === 'Map') {
      discoveryNav.push('Radar');
    }
    else {
      // Registered in the component body
      discoveryNav.goBackOnceFocused();
    }
  }, [discoveryNav]);

  return (
    <LinearGradient colors={['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0)']} style={styles.gradient}>
      <View style={styles.container}>
        {deviceInfo.supportsBluetooth && (
          <View>
            <TouchableWithoutFeedback onPress={toggleDiscoveryRoute}>
              <McIcon name={alterIcon} size={25} color={hexToRgba(colors.ink, 0.8)} />
            </TouchableWithoutFeedback>
          </View>
        )}
        <View style={{ height: styles.logo.height }}>
          <Image source={require('../../assets/logo_light.png')} style={styles.logo} />
        </View>
        <TouchableWithoutFeedback onPress={navToInbox}>
          <McIcon name='account-group' size={25} color={hexToRgba(colors.ink, 0.8)} solid />
        </TouchableWithoutFeedback>
      </View>
    </LinearGradient>
  );
};

export default Header;

import React, { useCallback, useState, useEffect } from 'react';
import { View, Image, StyleSheet, TouchableWithoutFeedback, BackHandler } from 'react-native';
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
    justifyContent: 'space-between',
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
  const [toggled, setToggled] = useState(false);
  const [pointerEvents, setPointerEvents] = useState('auto');

  const navToInbox = useCallback(() => {
    baseNav.push('Social', {
      childNavigationState: {
        routeName: 'Inbox',
      },
    });
  }, [baseNav]);

  const navToScreen = useCallbackTask(() => {
    if (discoveryNav.state.routeName === 'Map') {
      setToggled(true);
      discoveryNav.push('Radar');
    } else {
      setToggled(false);
      discoveryNav.goBack();
    }
  }, [discoveryNav]);

  useEffect(() => {
    setPointerEvents('none');

    const timeout = setTimeout(() => {
      setPointerEvents('auto');
    }, 333);

    return () => {
      clearTimeout(timeout);
    };
  }, [toggled]);

  useEffect(() => {
    if (!discoveryNav) return;

    const backHandler = () => {
      if (discoveryNav.state.routeName !== 'Radar') return true;
      if (pointerEvents !== 'auto') return true;

      discoveryNav.goBack();
      setToggled(false);

      return true;
    };

    BackHandler.addEventListener('hardwareBackPress', backHandler);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', backHandler);
    };
  }, [discoveryNav, pointerEvents]);

  return (
    <LinearGradient colors={['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0)']} style={styles.gradient}>
      <View style={styles.container}>
        {deviceInfo.supportsBluetooth && (
          <View pointerEvents={pointerEvents}>
            <TouchableWithoutFeedback onPress={navToScreen}>
              {toggled ? (
                <McIcon name='map' size={25} color={hexToRgba(colors.ink, 0.8)} />
              ) : (
                <McIcon name='radar' size={25} color={hexToRgba(colors.ink, 0.8)} />
              )}
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

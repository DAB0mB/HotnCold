import React, { useCallback, useState, useEffect } from 'react';
import { View, Image, Switch, StyleSheet, TouchableWithoutFeedback, BackHandler } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import Fa5Icon from 'react-native-vector-icons/FontAwesome5';

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

const Header = ({ baseNavigation, discoveryNavigation, me }) => {
  const [toggled, setToggled] = useState(false);
  const [pointerEvents, setPointerEvents] = useState('auto');

  const editProfile = useCallback(() => {
    baseNavigation.push('Profile', { user: me, itsMe: true });
  }, [baseNavigation, me]);

  const navToScreen = useCallbackTask(() => {
    if (discoveryNavigation.state.routeName === 'Map') {
      setToggled(true);
      discoveryNavigation.push('Radar');
    } else {
      setToggled(false);
      discoveryNavigation.goBack();
    }
  }, [discoveryNavigation]);

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
    if (!discoveryNavigation) return;

    const backHandler = () => {
      if (discoveryNavigation.state.routeName !== 'Radar') return true;
      if (pointerEvents !== 'auto') return true;

      discoveryNavigation.goBack();
      setToggled(false);

      return true;
    };

    BackHandler.addEventListener('hardwareBackPress', backHandler);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', backHandler);
    };
  }, [discoveryNavigation, pointerEvents]);

  return (
    <LinearGradient colors={['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0)']} style={styles.gradient}>
      <View style={styles.container}>
        <View pointerEvents={pointerEvents}>
          <Switch value={toggled} onChange={navToScreen} />
        </View>
        <View style={{ height: styles.logo.height }}>
          <Image source={require('../../assets/logo_light.png')} style={styles.logo} />
        </View>
        <TouchableWithoutFeedback onPress={editProfile}>
          <Fa5Icon name='user-edit' size={25} color={hexToRgba(colors.ink, 0.8)} solid />
        </TouchableWithoutFeedback>
      </View>
    </LinearGradient>
  );
};

export default Header;

import React, { useCallback } from 'react';
import { View, Image, Switch, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import Fa5Icon from 'react-native-vector-icons/FontAwesome5';

import { colors, hexToRgba } from '../theme';

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

const RootHeader = ({ navigation, me }) => {
  const editProfile = useCallback(() => {
    if (!navigation) return;
    if (!me) return;

    navigation.push('Profile', { user: me, itsMe: true });
  }, [navigation, me]);

  return (
    <LinearGradient colors={['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0)']} style={styles.gradient}>
      <View style={styles.container}>
        <Switch />
        <View style={{ height: styles.logo.height }}>
          <Image source={require('../assets/logo_light.png')} style={styles.logo} />
        </View>
        <TouchableWithoutFeedback onPress={editProfile}>
          <Fa5Icon name='user-edit' size={25} color={hexToRgba(colors.ink, 0.8)} solid />
        </TouchableWithoutFeedback>
      </View>
    </LinearGradient>
  );
};

export default RootHeader;

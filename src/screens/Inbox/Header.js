import React from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRobot } from 'hotncold-robot';

import Base from '../../containers/Base';
import Social from '../../containers/Social';
import { useNavigation } from '../../services/Navigation';

const styles = StyleSheet.create({
  header: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 20,
  },
  backIcon: {
    paddingRight: 10
  },
  title: {
    paddingLeft: 15,
    color: 'white',
    fontSize: 16,
    fontWeight: '900'
  },
});

export const $Header = Symbol('Header');

const Header = () => {
  const { useTrap } = useRobot();
  const socialNav = useNavigation(Social);
  const baseNav = useNavigation(Base);

  socialNav.useBackListener(() => {
    baseNav.goBack();
  });

  useTrap($Header, {});

  return (
    <View style={styles.header}>
      <TouchableWithoutFeedback onPress={socialNav.goBackOnceFocused}>
        <View style={styles.backIcon}>
          <McIcon name='arrow-left' size={20} color='white' solid />
        </View>
      </TouchableWithoutFeedback>
      <Text style={styles.title}>Inbox</Text>
    </View>
  );
};

export default Header;

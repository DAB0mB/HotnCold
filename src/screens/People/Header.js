import React from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

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

const Header = () => {
  const socialNav = useNavigation(Social);
  const baseNav = useNavigation(Base);

  socialNav.useBackListener(() => {
    baseNav.goBack();
  });

  return (
    <View style={styles.header}>
      <TouchableWithoutFeedback onPress={socialNav.goBackOnceFocused}>
        <View style={styles.backIcon}>
          <McIcon name='arrow-left' size={20} color='white' solid />
        </View>
      </TouchableWithoutFeedback>
      <Text style={styles.title}>Users</Text>
    </View>
  );
};

export default Header;

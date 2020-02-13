import { useRobot } from 'hotncold-robot';
import React, { useCallback } from 'react';
import { Text, View, ScrollView, StyleSheet, Image } from 'react-native';
import { RaisedTextButton } from 'react-native-material-buttons';

import Markdown, { styles as _mdStyles } from '../../components/Markdown';
import Base from '../../containers/Base';
import { useNavigation } from '../../services/Navigation';
import { colors } from '../../theme';
import privacyMD from './privacy.md';
import termsMD from './terms.md';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  header: {
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginBottom: 20,
    padding: 11,
  },
  logo: {
    height: 25,
    resizeMode: 'contain',
  },
  agreeButton: {
    margin: 30,
    alignSelf: 'center',
    backgroundColor: colors.hot,
    borderRadius: 999,
    borderColor: 'white',
  },
  copyrights: {
    fontSize: 12,
    marginBottom: 10,
  },
});

const mdStyles = StyleSheet.create({
  heading2: {
    ..._mdStyles.heading2,
    textAlign: 'center',
    alignSelf: 'center',
    color: colors.hot,
    width: '100%',
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 20,
  },
  heading3: {
    ..._mdStyles.heading3,
    fontWeight: '600',
  },
  listUnorderedItem: {
    marginTop: -10,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  listOrderedItemIcon: {
    fontWeight: '600',
    paddingTop: 10,
    paddingLeft: 2,
    paddingRight: 8,
  },
  listUnorderedItemIcon: {
    fontWeight: '600',
    paddingTop: 10,
    paddingLeft: 2,
    paddingRight: 8,
  },
});

const termsStyle = StyleSheet.create({
  ...mdStyles,
  listUnorderedItemIcon: {
    ...mdStyles.listOrderedItemIcon,
    color: colors.lightGray,
  },
});

const privacyStyle = StyleSheet.create({
  ...mdStyles,
});

export const $Agreement = Symbol('Agreement');

const Agreement = () => {
  const { useTrap } = useRobot();
  const nav = useNavigation();

  const agree = useCallback(() => {
    nav.pop();
  }, [true]);

  useTrap($Agreement, {
    agree,
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.body}>
        <View style={styles.header}>
          <Image source={require('../../assets/logo_light.png')} style={styles.logo} />
        </View>
        <View style={{ paddingLeft: 15, paddingRight: 15 }}>
          <Markdown style={termsStyle}>{termsMD}</Markdown>
          <Markdown style={privacyStyle}>{privacyMD}</Markdown>
          <View style={{ padding: 5, paddingTop: 20, paddingBottom: 20 }}>
            <RaisedTextButton
              onPress={agree}
              color={colors.hot}
              title='Agree and Continue'
              titleColor='white'
            />
          </View>
          <Text style={[mdStyles.text, styles.copyrights]}>© Hot &amp; Cold App, Inc 2020</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default Base.create(Agreement);

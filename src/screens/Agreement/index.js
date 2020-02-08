import { useRobot } from 'hotncold-robot';
import React, { useCallback } from 'react';
import { Text, View, ScrollView, StyleSheet, Image } from 'react-native';
import Ripple from 'react-native-material-ripple';

import Markdown, { styles as _mdStyles } from '../../components/Markdown';
import Base from '../../containers/Base';
import { useNavigation } from '../../services/Navigation';
import { StatusBarProvider } from '../../services/StatusBar';
import { colors } from '../../theme';
import privacyMD from './privacy.md';
import termsMD from './terms.md';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  logo: {
    width: 200,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  body: {
    paddingLeft: 15,
    paddingRight: 15,
  },
  mianTitle: {
    color: 'white',
    fontSize: 30,
    marginBottom: 10,
  },
  agreeButton: {
    margin: 30,
    alignSelf: 'center',
    backgroundColor: colors.hot,
    borderRadius: 999,
    borderColor: 'white',
  },
  agreeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 15,
    padding: 15,
  },
  copyrights: {
    fontSize: 12,
    marginBottom: 10,
  },
});

const mdStyles = StyleSheet.create({
  heading1: {
    ..._mdStyles.heading1,
    textAlign: 'left',
  },
  heading2: {
    ..._mdStyles.heading2,
    textAlign: 'left',
  },
  heading3: {
    ..._mdStyles.heading3,
    textAlign: 'left',
  },
  heading4: {
    ..._mdStyles.heading4,
    textAlign: 'left',
  },
  heading5: {
    ..._mdStyles.heading5,
    textAlign: 'left',
  },
  heading6: {
    ..._mdStyles.heading6,
    textAlign: 'left',
  },
  heading7: {
    ..._mdStyles.heading7,
    textAlign: 'left',
  },
  heading8: {
    ..._mdStyles.heading8,
    textAlign: 'left',
  },
  text: {
    color: 'white',
    textAlign: 'justify',
  },
  listUnorderedItem: {
    marginTop: -10,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  listOrderedItemIcon: {
    color: 'white',
    paddingTop: 10,
    paddingLeft: 2,
    paddingRight: 8,
  },
  listUnorderedItemIcon: {
    color: colors.ink,
    paddingTop: 10,
    paddingLeft: 2,
    paddingRight: 8,
  },
});

const termsStyle = StyleSheet.create({
  ...mdStyles
});

const privacyStyle = StyleSheet.create({
  ...mdStyles,
  listUnorderedItemIcon: {
    ...mdStyles.listUnorderedItemIcon,
    color: 'white',
  },
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
      <StatusBarProvider translucent barStyle='light-content' backgroundColor={colors.ink}>
        <ScrollView style={styles.body}>
          <Image source={require('../../assets/logo_dark.png')} style={styles.logo} />
          <Text style={styles.mianTitle}>License Agreement</Text>
          <Markdown style={termsStyle}>{termsMD}</Markdown>
          <Markdown style={privacyStyle}>{privacyMD}</Markdown>
          <Ripple onPressOut={agree} style={styles.agreeButton}>
            <Text style={styles.agreeButtonText}>Agree and Continue</Text>
          </Ripple>
          <Text style={[mdStyles.text, styles.copyrights]}>© Hot &amp; Cold App, Inc 2020</Text>
        </ScrollView>
      </StatusBarProvider>
    </View>
  );
};

export default Base.create(Agreement);

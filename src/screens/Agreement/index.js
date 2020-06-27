import { useRobot } from 'hotncold-robot';
import React from 'react';
import { TouchableWithoutFeedback, Text, View, ScrollView, StyleSheet, Image } from 'react-native';
import { RaisedTextButton } from 'react-native-material-buttons';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Bar from '../../components/Bar';
import Markdown, { hncMdStyles } from '../../components/Markdown';
import Base from '../../containers/Base';
import { useNavigation } from '../../services/Navigation';
import { colors } from '../../theme';
import { useAsyncCallback, sleep } from '../../utils';
import privacyMD from './privacy.md';
import termsMD from './terms.md';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightGray },
  header: { marginBottom: 20 },
  logo: { height: 25, marginLeft: 'auto', marginRight: 'auto', resizeMode: 'contain' },
  agreeButton: { margin: 30, alignSelf: 'center', backgroundColor: colors.hot, borderRadius: 999, borderColor: 'white' },
  copyrights: { fontSize: 12, marginBottom: 10 },
});

const termsStyle = StyleSheet.create({
  ...hncMdStyles,
  listUnorderedItemIcon: {
    ...hncMdStyles.listOrderedItemIcon,
    color: colors.lightGray,
  },
});

const privacyStyle = StyleSheet.create({
  ...hncMdStyles,
});

export const $Agreement = {};

const Agreement = () => {
  const { useTrap } = useRobot();
  const nav = useNavigation();
  const hasBack = nav.getParam('hasBack');

  nav.useBackListener();

  const agree = useAsyncCallback(function* () {
    yield sleep(500);

    nav.goBackOnceFocused();
  }, [true]);

  useTrap($Agreement, {
    agree,
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.body}>
        <Bar style={styles.header}>
          <Image source={require('../../assets/logo_light.png')} style={styles.logo} />

          {hasBack && (
            <TouchableWithoutFeedback onPress={nav.goBackOnceFocused}>
              <View style={{ position: 'absolute', left: 0 }}>
                <McIcon name='arrow-left' size={25} color={colors.hot} />
              </View>
            </TouchableWithoutFeedback>
          )}
        </Bar>
        <View style={{ paddingLeft: 15, paddingRight: 15 }}>
          <Markdown style={termsStyle}>{termsMD}</Markdown>
          <Markdown style={privacyStyle}>{privacyMD}</Markdown>
          <View style={{ padding: 5, paddingTop: 30, paddingBottom: 40, alignItems: 'center' }}>
            <RaisedTextButton
              onPress={agree}
              color={colors.hot}
              title='agree & continue'
              titleColor='white'
            />
          </View>
          <Text style={[hncMdStyles.text, styles.copyrights]}>© Hot &amp; Cold App, Inc 2020</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default Base.create(Agreement);

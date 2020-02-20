import React from 'react';
import { TouchableWithoutFeedback, Text, View, ScrollView, StyleSheet, Image } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Bar from '../../components/Bar';
import Markdown, { hncMdStyles } from '../../components/Markdown';
import Base from '../../containers/Base';
import { useNavigation } from '../../services/Navigation';
import { colors } from '../../theme';
import faqMD from './FAQ.md';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  header: {
    marginBottom: 20,
  },
  logo: {
    height: 25,
    marginLeft: 'auto',
    marginRight: 'auto',
    resizeMode: 'contain',
  },
  copyrights: {
    fontSize: 12,
    marginBottom: 10,
    marginTop: 20,
  },
});

const FAQ = () => {
  const nav = useNavigation();

  nav.useBackListener();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.body}>
        <Bar style={styles.header}>
          <Image source={require('../../assets/logo_light.png')} style={styles.logo} />

          <TouchableWithoutFeedback onPress={nav.goBackOnceFocused}>
            <View style={{ position: 'absolute', left: 0 }}>
              <McIcon name='arrow-left' size={25} color={colors.hot} />
            </View>
          </TouchableWithoutFeedback>
        </Bar>
        <View style={{ paddingLeft: 15, paddingRight: 15 }}>
          <Markdown style={hncMdStyles}>{faqMD}</Markdown>
          <Text style={[hncMdStyles.text, styles.copyrights]}>© Hot &amp; Cold App, Inc 2020</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default Base.create(FAQ);

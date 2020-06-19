import moment from 'moment';
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

import Base from '../../containers/Base';
import { useNavigation } from '../../services/Navigation';
import { colors } from '../../theme';

const styles = StyleSheet.create({
  container: { borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  text: { color: colors.ink, fontSize: 16, padding: 15 },
});

const Status = () => {
  const baseNav = useNavigation(Base);
  const status = baseNav.getParam('status');

  return (
    <View style={styles.container}>
      <Text style={{ paddingHorizontal: 15, paddingTop: 15 }}>{moment(status.createdAt).fromNow()}</Text>
      <Text style={styles.text}>{status.text}</Text>
    </View>
  );
};

export default Status;

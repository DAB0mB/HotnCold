import moment from 'moment';
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

import { colors } from '../../theme';

const styles = StyleSheet.create({
  container: { borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  text: { color: colors.ink, fontSize: 16, padding: 15 },
});

const Status = ({ status }) => {
  if (!status) return null;

  return (
    <View style={styles.container}>
      {status && (
        <React.Fragment>
          <Text style={{ paddingHorizontal: 15, paddingTop: 15 }}>{moment(status.createdAt).fromNow()}</Text>
          <Text style={styles.text}>{status.text}</Text>
        </React.Fragment>
      )}
    </View>
  );
};

export default Status;

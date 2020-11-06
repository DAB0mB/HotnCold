import moment from 'moment';
import React from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import Lightbox from 'react-native-lightbox';

import { getStatusThumbSource } from '../../assets';
import { colors } from '../../theme';

const styles = StyleSheet.create({
  container: { borderBottomWidth: 1, borderBottomColor: colors.lightGray, flexDirection: 'row' },
  text: { color: colors.ink, fontSize: 16, padding: 15 },
  imageContainer: { margin: 10, marginBottom: -20, width: 110, height: 110, alignItems: 'center', justifyContent: 'center', borderWidth: 1, backgroundColor: 'white', borderColor: colors.lightGray },
  image: { width: 100, height: 100 },
  statusInfo: { paddingHorizontal: 15, paddingTop: 15, flexDirection: 'row', alignItems: 'center' },
  statusType: { borderRadius: 12, width: 12, height: 12, marginRight: 5 },
  createdAt: {},
  statusDetails: { flex: 1 },
});

const Status = ({ status }) => {
  if (!status) return null;

  return (
    <View style={styles.container}>
      {status && (
        <React.Fragment>
          <View style={styles.statusDetails}>
            <View style={styles.statusInfo}>
              <View style={[styles.statusType, { backgroundColor: status.isMeetup ? colors.hot : colors.cold }]} />
              <Text style={styles.createdAt}>{moment(status.createdAt).fromNow()}</Text>
            </View>
            <Text style={styles.text}>{status.text}</Text>
          </View>
          <View style={styles.imageContainer}>
            <Lightbox activeProps={{ resizeMode: 'contain', style: { flex: 1, width: '100%' }, source: { uri: status.firstImage } }}>
              <Image style={styles.image} source={getStatusThumbSource(status)} />
            </Lightbox>
          </View>
        </React.Fragment>
      )}
    </View>
  );
};

export default Status;

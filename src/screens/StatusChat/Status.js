import moment from 'moment';
import React, { useCallback, useState } from 'react';
import { Image, Text, View, StyleSheet, TouchableWithoutFeedback } from 'react-native';

import ImageViewer from '../../components/ImageViewer';
import { getStatusThumbSource } from '../../assets';
import { colors } from '../../theme';

const styles = StyleSheet.create({
  container: { borderBottomWidth: 1, borderBottomColor: colors.lightGray, flexDirection: 'row' },
  text: { color: colors.ink, fontSize: 16, padding: 15 },
  imageContainer: { margin: 10, marginBottom: -20, width: 110, height: 110, alignItems: 'center', justifyContent: 'center', borderWidth: 1, backgroundColor: 'white', borderColor: colors.lightGray },
  image: { width: 100, height: 100 },
  createdAt: { paddingHorizontal: 15, paddingTop: 15 },
  statusDetails: { flex: 1 },
});

const Status = ({ status }) => {
  if (!status) return null;

  const [isImageViewerOpen, setImageViewerOpen] = useState(false);

  const openImageViewer = useCallback(() => {
    setImageViewerOpen(true);
  }, []);

  return (
    <View style={styles.container}>
      {status && (
        <React.Fragment>
          <View style={styles.statusDetails}>
            <Text style={styles.createdAt}>{moment(status.createdAt).fromNow()}</Text>
            <Text style={styles.text}>{status.text}</Text>
          </View>
          <TouchableWithoutFeedback onPress={openImageViewer}>
            <View style={styles.imageContainer}>
              <Image style={styles.image} source={getStatusThumbSource(status)} />
            </View>
          </TouchableWithoutFeedback>
          <ImageViewer imageUrls={status.firstImage} openState={[isImageViewerOpen, setImageViewerOpen]} />
        </React.Fragment>
      )}
    </View>
  );
};

export default Status;

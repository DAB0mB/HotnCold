import React, { useCallback, useMemo } from 'react';
import { TouchableWithoutFeedback, Modal, View, StyleSheet } from 'react-native';
import SuperImageViewer from 'react-native-image-zoom-viewer';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { colors } from '../theme';

const styles = StyleSheet.create({
  imageContainer: { position: 'absolute', right: 0, bottom: '100%', margin: 10, width: 120, height: 120, backgroundColor: 'white', borderRadius: 120, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.lightGray },
  image: { width: 110, height: 110, borderRadius: 110 },
  modalBody: { position: 'relative', flex: 1 },
  modalX: { position: 'absolute', right: 10, top: 10 },
});

const ImageViewer = ({ openState, imageUrls }) => {
  imageUrls = [].concat(imageUrls);
  imageUrls = useMemo(() => {
    return imageUrls
      .filter(Boolean)
      .map((url) => ({ url }));
  }, Array.apply(null, { length: 10 }).map((_, i) => imageUrls[i]));
  const [isOpen, setOpen] = openState;

  const closeImageViewer = useCallback(() => {
    setOpen(false);
  }, []);

  return !imageUrls.length ? null : (
    <Modal visible={isOpen} onRequestClose={closeImageViewer}>
      <View style={styles.modalBody}>
        <SuperImageViewer imageUrls={imageUrls} />
        <TouchableWithoutFeedback onPress={closeImageViewer}>
          <View style={styles.modalX}>
            <McIcon name='close' size={20} color='white' solid />
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

export default ImageViewer;

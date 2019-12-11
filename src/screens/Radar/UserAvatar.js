import React, { useCallback, useEffect, useState } from 'react';
import { Animated, StyleSheet, Image, View, TouchableWithoutFeedback } from 'react-native';

import { colors } from '../../theme';

const noop = () => {};

const styles = StyleSheet.create({
  userAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderRadius: 999,
    resizeMode: 'contain',
    overflow: 'hidden',
  },
});

const UserAvatar = ({ i, j, user, avatarSize, onPress = noop }) => {
  const [visited, setVisited] = useState(false);
  const [height] = useState(() => new Animated.Value(0));

  const handlePress = useCallback(() => {
    setVisited(true);
    onPress(user);
  }, [onPress]);

  useEffect(() => {
    Animated.spring(
      height,
      {
        toValue: avatarSize,
        duration: 333,
      }
    ).start();
  }, [true]);

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={{ position: 'absolute', left: avatarSize * i, top: avatarSize * j, width: avatarSize, height: avatarSize, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={[styles.userAvatar, { borderColor: visited ? colors.hot : colors.cold, width: avatarSize, height }]}
        >
          <Animated.Image source={{ uri: user.avatar }} resizeMode={styles.userAvatar.resizeMode} style={{ width: avatarSize, height: avatarSize }} />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default UserAvatar;
